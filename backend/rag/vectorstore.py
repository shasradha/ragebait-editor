import os

backend = os.getenv("VECTOR_BACKEND", "chroma")

if backend == "supabase":
    from rag.vectorstore_supabase import (
        store_code, 
        retrieve_similar
    )
else:
    from rag.vectorstore_chroma import (
        store_code, 
        retrieve_similar
    )
