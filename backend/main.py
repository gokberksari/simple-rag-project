import os
import uuid
from pathlib import Path

import anthropic
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag.pdf_parser import extract_text_from_pdf
from rag.chunker import chunk_pages
from rag.embedder import embed_texts, embed_query
from rag.vector_store import VectorStore

app = FastAPI(title="Intelligent Document Q&A System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Global state
vector_store = VectorStore()
documents: dict[str, dict] = {}  # doc_id -> metadata
claude_client = anthropic.Anthropic()


# --- Models ---

class QueryRequest(BaseModel):
    question: str
    top_k: int = 5


class QueryResponse(BaseModel):
    answer: str
    sources: list[dict]


# --- Endpoints ---

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload_document(file: UploadFile):
    """Upload a PDF document, extract text, chunk, embed, and index it."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    doc_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{doc_id}.pdf"

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Extract text
    pages = extract_text_from_pdf(str(file_path))
    if not pages:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")

    # Chunk
    chunks = chunk_pages(pages)

    # Tag chunks with document info
    for chunk in chunks:
        chunk["doc_id"] = doc_id
        chunk["doc_name"] = file.filename

    # Embed and index
    texts = [c["text"] for c in chunks]
    embeddings = embed_texts(texts)
    vector_store.add(embeddings, chunks)

    # Store document metadata
    documents[doc_id] = {
        "id": doc_id,
        "name": file.filename,
        "pages": len(pages),
        "chunks": len(chunks),
    }

    return {
        "doc_id": doc_id,
        "name": file.filename,
        "pages": len(pages),
        "chunks": len(chunks),
        "message": f"Document '{file.filename}' indexed successfully.",
    }


@app.get("/documents")
def list_documents():
    """List all indexed documents."""
    return list(documents.values())


@app.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    """Delete a document and rebuild the index without it."""
    if doc_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Remove from documents
    del documents[doc_id]

    # Remove PDF file
    file_path = UPLOAD_DIR / f"{doc_id}.pdf"
    if file_path.exists():
        os.remove(file_path)

    # Rebuild index without deleted document's chunks
    remaining_chunks = [c for c in vector_store.chunks if c.get("doc_id") != doc_id]
    vector_store.clear()

    if remaining_chunks:
        texts = [c["text"] for c in remaining_chunks]
        embeddings = embed_texts(texts)
        vector_store.add(embeddings, remaining_chunks)

    return {"message": "Document deleted."}


@app.post("/query", response_model=QueryResponse)
def query_documents(req: QueryRequest):
    """Answer a question using RAG: retrieve relevant chunks and generate an answer with Claude."""
    if vector_store.size == 0:
        raise HTTPException(status_code=400, detail="No documents indexed. Please upload a document first.")

    # Retrieve
    q_embedding = embed_query(req.question)
    results = vector_store.search(q_embedding, top_k=req.top_k)

    # Build context
    context_parts = []
    for i, r in enumerate(results, 1):
        context_parts.append(
            f"[Source {i} | {r.get('doc_name', 'Unknown')} — Page {r['page_number']}]\n{r['text']}"
        )
    context = "\n\n---\n\n".join(context_parts)

    # Generate answer with Claude
    system_prompt = (
        "You are a helpful academic research assistant. Answer the user's question based ONLY on the "
        "provided context passages. If the context does not contain enough information to answer the "
        "question, say so clearly. Cite the source numbers (e.g., [Source 1]) when referencing information. "
        "Be concise and accurate."
    )

    user_message = f"Context:\n\n{context}\n\n---\n\nQuestion: {req.question}"

    response = claude_client.messages.create(
        model="claude-haiku-4-5-20241022",
        max_tokens=1024,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )

    answer = response.content[0].text

    # Format sources for response
    sources = [
        {
            "text": r["text"],
            "page_number": r["page_number"],
            "doc_name": r.get("doc_name", "Unknown"),
            "score": round(r["score"], 4),
        }
        for r in results
    ]

    return QueryResponse(answer=answer, sources=sources)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
