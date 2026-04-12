import faiss
import numpy as np


class VectorStore:
    """FAISS-based vector store for document chunks."""

    def __init__(self, dimension: int = 384):
        """Initialize the vector store.

        Args:
            dimension: Embedding dimension (384 for all-MiniLM-L6-v2).
        """
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)  # Inner product (cosine sim on normalized vectors)
        self.chunks: list[dict] = []

    def add(self, embeddings: np.ndarray, chunks: list[dict]):
        """Add embeddings and their associated chunk metadata to the store.

        Args:
            embeddings: numpy array of shape (n, dimension).
            chunks: List of chunk dicts with 'text', 'page_number', etc.
        """
        # Normalize for cosine similarity
        faiss.normalize_L2(embeddings)
        self.index.add(embeddings)
        self.chunks.extend(chunks)

    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> list[dict]:
        """Search for the most similar chunks to a query embedding.

        Args:
            query_embedding: numpy array of shape (1, dimension).
            top_k: Number of results to return.

        Returns:
            List of dicts with 'text', 'page_number', 'chunk_index', and 'score'.
        """
        faiss.normalize_L2(query_embedding)
        scores, indices = self.index.search(query_embedding, top_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            chunk = self.chunks[idx].copy()
            chunk["score"] = float(score)
            results.append(chunk)

        return results

    def clear(self):
        """Remove all vectors and chunks."""
        self.index.reset()
        self.chunks = []

    @property
    def size(self) -> int:
        return self.index.ntotal
