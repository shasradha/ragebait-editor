"""
RageBait Editor Vector Store — ChromaDB-backed storage for code history.
Stores past code submissions with their error metadata for RAG retrieval.
"""

from __future__ import annotations

import json
import os
import uuid

import chromadb

from rag.embedder import embed_code

_client: chromadb.PersistentClient | None = None
_collection: chromadb.Collection | None = None


def get_collection() -> chromadb.Collection:
    """Return the ChromaDB collection, initializing the client on first call."""
    global _client, _collection
    if _collection is None:
        persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chromadb")
        print(f"📦 Initializing ChromaDB at {persist_dir}...")
        _client = chromadb.PersistentClient(path=persist_dir)
        _collection = _client.get_or_create_collection(
            name="python_code_history",
            metadata={"hnsw:space": "cosine"},
        )
        print(f"✅ ChromaDB collection ready! ({_collection.count()} documents)")
    return _collection


def store_code(code: str, errors: list[dict], session_id: str) -> None:
    """
    Store a code snippet and its analysis errors in ChromaDB.

    Args:
        code: The Python code string.
        errors: List of error dicts from the analysis.
        session_id: User session identifier.
    """
    collection = get_collection()
    embedding = embed_code(code)
    doc_id = str(uuid.uuid4())

    # Store errors as JSON string in metadata (ChromaDB metadata values must be str/int/float)
    errors_json = json.dumps(errors[:10])  # Limit to 10 errors to stay within metadata size

    collection.add(
        ids=[doc_id],
        embeddings=[embedding],
        documents=[code[:2000]],  # Limit doc size
        metadatas=[
            {
                "session_id": session_id,
                "error_count": len(errors),
                "errors": errors_json,
            }
        ],
    )


def retrieve_similar(code: str, n_results: int = 3) -> list[dict]:
    """
    Retrieve the most similar past code snippets from ChromaDB.

    Args:
        code: The code to find similar snippets for.
        n_results: Number of similar results to return.

    Returns:
        List of dicts with 'code' and 'errors' keys.
    """
    collection = get_collection()

    # If collection is empty, return nothing
    if collection.count() == 0:
        return []

    embedding = embed_code(code)

    # Query can't return more results than exist
    actual_n = min(n_results, collection.count())

    results = collection.query(
        query_embeddings=[embedding],
        n_results=actual_n,
        include=["documents", "metadatas"],
    )

    similar_items = []
    if results and results["documents"] and results["documents"][0]:
        for i, doc in enumerate(results["documents"][0]):
            metadata = results["metadatas"][0][i] if results["metadatas"] else {}
            errors_str = metadata.get("errors", "[]")
            try:
                errors = json.loads(errors_str)
            except json.JSONDecodeError:
                errors = []

            similar_items.append(
                {
                    "code": doc,
                    "errors": errors,
                    "error_count": metadata.get("error_count", 0),
                }
            )

    return similar_items
