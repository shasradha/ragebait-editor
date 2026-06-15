"""
RageBait Editor API — FastAPI backend for the RageBait Code Roaster.
Initializes CORS, routers, and preloads models on startup.
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from rag.embedder import get_model
from routes.analyse import router as analyse_router
from routes.embed import router as embed_router
from routes.speak import router as speak_router
from routes.idle import router as idle_router

# Load .env.local if present, else .env
if os.path.exists(".env.local"):
    load_dotenv(".env.local")
else:
    load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: preload the embedding model and initialize DB if needed."""
    print("🔥 RageBait Editor API starting up...")
    print("📦 Pre-loading sentence-transformers model...")
    get_model()
    
    backend = os.getenv("VECTOR_BACKEND", "chroma")
    if backend == "chroma":
        from rag.vectorstore_chroma import get_collection
        print("📦 Initializing ChromaDB collection...")
        get_collection()
    else:
        print("☁️ Using Supabase vector backend — skipping ChromaDB init")
        
    print("✅ RageBait Editor API ready to roast! 🔥")
    yield
    print("👋 RageBait Editor API shutting down...")


app = FastAPI(
    title="RageBait Editor API 🔥",
    description="Savage multi-language code roaster powered by AI",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend origins
# Build allowed origins list
_allowed_origins = [
    "http://localhost:3000",
    "http://frontend:3000",
]
# Add Vercel deployment origins for cloud
_vercel_url = os.getenv("VERCEL_URL", "")
if _vercel_url:
    _allowed_origins.append(f"https://{_vercel_url}")
# Always allow *.vercel.app for preview deployments
_allowed_origins.append("https://ragebait-editor.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyse_router, tags=["analyse"])
app.include_router(embed_router, tags=["embed"])
app.include_router(speak_router)
app.include_router(idle_router, tags=["idle"])


@app.get("/")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "🔥 RageBait Editor API is alive!",
        "version": "1.0.0",
        "model": "llama-3.3-70b-versatile",
    }
