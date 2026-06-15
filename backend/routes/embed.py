"""
RageBait Editor Embed Route — Endpoint for storing code snippets directly in ChromaDB.
"""

from fastapi import APIRouter, HTTPException
from models.schemas import EmbedRequest, EmbedResponse
from rag.vectorstore import store_code

router = APIRouter()


@router.post("/api/embed", response_model=EmbedResponse)
async def embed_code_route(request: EmbedRequest):
    """
    Store code directly in the ChromaDB vector store.
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    try:
        # Since EmbedRequest does not provide errors, we store it with an empty errors list
        store_code(request.code, [], request.session_id)
        return EmbedResponse(stored=True)
    except Exception as e:
        print(f"⚠️ Failed to store code in ChromaDB: {e}")
        return EmbedResponse(stored=False)
