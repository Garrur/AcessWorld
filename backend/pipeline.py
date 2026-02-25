"""
AccessWorld Pipeline Orchestrator
Chains: Whisper → BLIP → DETR → DPT → MarianMT → SpeechT5
Intelligently routes based on the spoken/typed query.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional
import re


# ── Result Schema ────────────────────────────────────────────────────────────
@dataclass
class ZoneInfo:
    label: str
    warning: str
    percent: float


@dataclass
class PipelineResult:
    query: str                          # Original (transcribed) query
    description: str                    # BLIP scene caption (English)
    objects: List[Dict]                 # DETR detections
    hazards: List[str]                  # Filtered hazard labels
    depth: Dict                         # DPT zone map
    translated_text: str                # Final text in target language
    audio_b64: str                      # Base64 WAV from SpeechT5
    language: str                       # Target language code
    safe_to_walk: bool                  # Combined depth+hazard verdict


# ── Query intent classifier ──────────────────────────────────────────────────
INTENT_PATTERNS = {
    "full":        r"(what|describe|tell me|scene|around|front|see)",
    "objects":     r"(object|thing|item|what.*(there|here))",
    "vehicles":    r"(car|truck|bus|vehicle|traffic|road|street)",
    "depth":       r"(safe|walk|forward|close|near|far|step|distance|obstacle|move)",
    "translate":   r"(translat|hindi|french|spanish|german|chinese)",
}

def classify_intent(query: str) -> str:
    q = query.lower()
    for intent, pattern in INTENT_PATTERNS.items():
        if re.search(pattern, q):
            return intent
    return "full"


def _compose_answer(
    intent: str,
    description: str,
    objects: List[Dict],
    hazards: List[str],
    depth: Dict,
    safe: bool,
) -> str:
    """Build a readable spoken answer from pipeline outputs."""
    parts = []

    if intent in ("full", "objects", "vehicles"):
        parts.append(description.capitalize() + ".")

    if objects and intent in ("full", "objects", "vehicles"):
        obj_names = list({o["label"] for o in objects[:5]})
        parts.append(f"I can see: {', '.join(obj_names)}.")

    if hazards:
        parts.append(f"Warning: {', '.join(hazards)} detected nearby.")

    if intent in ("full", "depth"):
        center = depth.get("zones", {}).get("center", {})
        left   = depth.get("zones", {}).get("left", {})
        right  = depth.get("zones", {}).get("right", {})
        parts.append(
            f"Depth analysis — "
            f"Left: {left.get('label','Unknown')}. "
            f"Center: {center.get('label','Unknown')}. "
            f"Right: {right.get('label','Unknown')}."
        )
        verdict = "It appears safe to walk forward." if safe else "Do not walk forward — obstacle detected."
        parts.append(verdict)

    return " ".join(parts) if parts else description


# ── Main pipeline function ───────────────────────────────────────────────────
def run_pipeline(
    image_bytes: bytes,
    models,                   # app.state.models
    language: str = "en",
    query: str = "",
) -> PipelineResult:
    """
    Full AccessWorld pipeline:
    1. Scene caption (BLIP)
    2. Object detection (DETR)
    3. Depth estimation (DPT)
    4. Compose spoken answer
    5. Translate (MarianMT)
    6. TTS (SpeechT5)
    """
    intent = classify_intent(query) if query else "full"

    # ── 1. Caption ────────────────────────────────────────────────────────────
    description = models.captioner.caption(image_bytes)

    # ── 2. Object detection ──────────────────────────────────────────────────
    objects = models.detector.detect(image_bytes)
    hazards = models.detector.hazardous_objects(objects)

    # ── 3. Depth estimation ──────────────────────────────────────────────────
    depth = models.depth.analyze(image_bytes)
    safe  = depth.get("safe_to_walk", True) and len(hazards) == 0

    # ── 4. Compose the English answer ────────────────────────────────────────
    english_answer = _compose_answer(intent, description, objects, hazards, depth, safe)

    # ── 5. Translate ─────────────────────────────────────────────────────────
    translated = models.translator.translate(english_answer, language) or english_answer

    # ── 6. TTS — speak the translated text ───────────────────────────────────
    # SpeechT5 is English only; speak English if translation chosen
    speak_text = english_answer  # always TTS in English (model limitation)
    audio_b64  = models.tts.synthesize(speak_text)

    return PipelineResult(
        query=query,
        description=description,
        objects=objects,
        hazards=hazards,
        depth=depth,
        translated_text=translated,
        audio_b64=audio_b64,
        language=language,
        safe_to_walk=safe,
    )
