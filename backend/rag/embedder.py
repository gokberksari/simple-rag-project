import numpy as np
from sentence_transformers import SentenceTransformer

_model = None


def get_model() -> SentenceTransformer:
    """Lazy-load the sentence transformer model."""
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def embed_texts(texts: list[str]) -> np.ndarray:
    """Generate embeddings for a list of texts.

    Returns:
        numpy array of shape (n_texts, embedding_dim).
    """
    model = get_model()
    embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    return embeddings.astype("float32")


def embed_query(query: str) -> np.ndarray:
    """Generate embedding for a single query string.

    Returns:
        numpy array of shape (1, embedding_dim).
    """
    model = get_model()
    embedding = model.encode([query], show_progress_bar=False, convert_to_numpy=True)
    return embedding.astype("float32")
