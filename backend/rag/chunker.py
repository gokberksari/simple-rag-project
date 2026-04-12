from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_pages(pages: list[dict], chunk_size: int = 500, chunk_overlap: int = 50) -> list[dict]:
    """Split page texts into overlapping chunks with metadata.

    Args:
        pages: List of dicts with 'page_number' and 'text' keys.
        chunk_size: Approximate number of characters per chunk.
        chunk_overlap: Number of overlapping characters between chunks.

    Returns:
        List of dicts with 'text', 'page_number', and 'chunk_index' keys.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = []
    chunk_index = 0
    for page in pages:
        page_chunks = splitter.split_text(page["text"])
        for text in page_chunks:
            chunks.append({
                "text": text,
                "page_number": page["page_number"],
                "chunk_index": chunk_index,
            })
            chunk_index += 1

    return chunks
