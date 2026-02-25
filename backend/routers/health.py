"""
Health Router — GET /health
Returns model load status and system info.
"""
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    """Check if AccessWorld backend is running and models are loaded."""
    models = request.app.state.models
    return JSONResponse(content={
        "status": "ok",
        "models_loaded": models.loaded,
        "services": {
            "whisper":    models.whisper    is not None,
            "captioner":  models.captioner  is not None,
            "detector":   models.detector   is not None,
            "depth":      models.depth      is not None,
            "tts":        models.tts        is not None,
            "translator": models.translator is not None,
        },
        "version": "1.0.0",
    })
