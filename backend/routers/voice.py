"""
Voice Router — POST /voice
Accepts: audio file (WAV / WebM from browser mic)
Returns: Transcribed text via Whisper
"""
from fastapi import APIRouter, File, UploadFile, Request, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()

ALLOWED_AUDIO = {
    "audio/wav", "audio/wave", "audio/x-wav",
    "audio/webm", "audio/ogg", "audio/mpeg", "audio/mp4",
    "application/octet-stream",  # Some browsers send this for WebM blobs
}


@router.post("")
async def transcribe_voice(
    request: Request,
    audio: UploadFile = File(..., description="Audio recording (WAV/WebM from microphone)"),
):
    """
    🎤 Transcribe spoken audio using Whisper-base.
    Returns the transcribed text so the frontend can display and send it to /analyze.
    """
    models = request.app.state.models
    if not models.loaded:
        raise HTTPException(status_code=503, detail="Models still loading.")

    audio_bytes = await audio.read()
    if len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="Audio file appears empty.")

    transcript = models.whisper.transcribe(audio_bytes)

    return JSONResponse(content={
        "transcript": transcript,
        "length_chars": len(transcript),
    })
