"""
AccessWorld Backend — FastAPI App Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.whisper import WhisperModel
from models.captioner import CaptionerModel
from models.detector import DetectorModel
from models.depth import DepthModel
from models.tts import TTSModel
from models.translator import TranslatorModel
from routers import analyze, voice, health

# ── Global model store ───────────────────────────────────────────────────────
class ModelStore:
    whisper: WhisperModel = None
    captioner: CaptionerModel = None
    detector: DetectorModel = None
    depth: DepthModel = None
    tts: TTSModel = None
    translator: TranslatorModel = None
    loaded: bool = False

store = ModelStore()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all models once at startup."""
    import traceback
    try:
        print("[INFO] Loading models - this may take several minutes on first run...")
        store.whisper    = WhisperModel()
        store.captioner  = CaptionerModel()
        store.detector   = DetectorModel()
        store.depth      = DepthModel()
        store.tts        = TTSModel()
        store.translator = TranslatorModel()
        store.loaded     = True
        print("[SUCCESS] All models loaded. AccessWorld is ready.")
    except Exception as e:
        print(f"[ERROR] LIFESPAN ERROR: {e}")
        traceback.print_exc()
        raise e
    
    yield
    print("[INFO] Shutting down AccessWorld.")


app = FastAPI(
    title="AccessWorld API",
    description="Real-Time Environment Describer for Visually Impaired Users",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach the model store to app state so routers can access it
app.state.models = store

app.include_router(health.router, tags=["Health"])
app.include_router(analyze.router, prefix="/analyze", tags=["Analyze"])
app.include_router(voice.router, prefix="/voice", tags=["Voice"])


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "AccessWorld API is running 🌍",
        "docs": "/docs",
        "health": "/health",
    }
