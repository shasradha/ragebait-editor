import os
from supabase import create_client
from rag.embedder import embed_code
import json

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def store_code(code: str, errors: list, session_id: str):
    embedding = embed_code(code)
    supabase.table("code_embeddings").insert({
        "session_id": session_id,
        "code": code,
        "errors": json.dumps(errors),
        "embedding": embedding
    }).execute()

def retrieve_similar(code: str, n_results: int = 3):
    embedding = embed_code(code)
    result = supabase.rpc("match_code_embeddings", {
        "query_embedding": embedding,
        "match_count": n_results
    }).execute()
    
    similar_items = []
    if result and result.data:
        for item in result.data:
            errors_str = item.get("errors", "[]")
            try:
                errors = json.loads(errors_str)
            except json.JSONDecodeError:
                errors = []
            similar_items.append({
                "code": item.get("code", ""),
                "errors": errors,
                "error_count": len(errors)
            })
    return similar_items
