"""
Analyze Router — POST /analyze
Accepts: image file + optional language + optional query
Returns: Full pipeline result (description, objects, depth, translated text, audio)
"""
from fastapi import APIRouter, File, Form, UploadFile, Request, HTTPException
from fastapi.responses import JSONResponse
from pipeline import run_pipeline
import dataclasses

router = APIRouter()


@router.post("")
async def analyze_image(
    request: Request,
    image: UploadFile = File(..., description="Image to analyze (JPEG/PNG/WebP)"),
    language: str = Form("en", description="Target language code: en|hi|fr|es|de|zh"),
    query: str = Form("", description="Optional spoken/typed question about the image"),
):
    """
    🌍 Full AccessWorld pipeline:
    Upload an image → get scene description, detected objects, depth zones, and TTS audio.
    """
    models = request.app.state.models
    if not models.loaded:
        raise HTTPException(status_code=503, detail="Models are still loading. Please try again in a moment.")

    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if image.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {image.content_type}")

    image_bytes = await image.read()
    if len(image_bytes) < 100:
        raise HTTPException(status_code=400, detail="Image file appears empty.")

    result = run_pipeline(
        image_bytes=image_bytes,
        models=models,
        language=language,
        query=query,
    )

    return JSONResponse(content={
        "query":            result.query,
        "description":      result.description,
        "objects":          result.objects,
        "hazards":          result.hazards,
        "depth":            result.depth,
        "translated_text":  result.translated_text,
        "audio_b64":        result.audio_b64,
        "language":         result.language,
        "safe_to_walk":     result.safe_to_walk,
    })
