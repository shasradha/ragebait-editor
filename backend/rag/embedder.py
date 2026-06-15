"""
RageBait Editor Embedder — Singleton loader for sentence-transformers model.
Uses all-MiniLM-L6-v2 for fast, lightweight code embeddings.
"""

from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    """Return the singleton SentenceTransformer model, loading it on first call."""
    global _model
    if _model is None:
        print("⏳ Loading sentence-transformers model (all-MiniLM-L6-v2)...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("✅ Model loaded successfully!")
    return _model


def embed_code(code: str) -> list[float]:
    """Embed a code string into a vector using the sentence-transformer model."""
    model = get_model()
    embedding = model.encode(code, normalize_embeddings=True)
    return embedding.tolist()
