# AccessWorld — Real-Time Environment Describer for Visually Impaired 🌍

> **285 million** visually impaired people struggle with daily navigation. AccessWorld gives them a voice-first, hands-free AI companion that describes the world around them in real time.

---

## 🚀 Demo Pipeline

```
🎤 Speak → 👁️ Caption → 📦 Detect → 📏 Depth → 🌐 Translate → 🔊 Speak
```

| Step | Model | Task |
|---|---|---|
| 🎤 ASR | `openai/whisper-base` | Voice → Text (hands-free) |
| 👁️ Caption | `Salesforce/blip-image-captioning-large` | Image → Description |
| 📦 Detection | `facebook/detr-resnet-50` | Object detection + bboxes |
| 📏 Depth | `Intel/dpt-large` | 3-zone proximity map |
| 🔊 TTS | `microsoft/speecht5_tts` + `speecht5_hifigan` | Text → Natural speech |
| 🌐 Translate | `Helsinki-NLP/opus-mt-en-{hi,fr,es,de,zh}` | 5 languages |

All models are **free, open-source, and run locally** — zero API cost.

---

## 📁 Project Structure

```
Accessworld/
├── backend/
│   ├── main.py                # FastAPI app entry point
│   ├── pipeline.py            # End-to-end AI pipeline orchestrator
│   ├── download_models.py     # Pre-download all HF models
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── models/
│   │   ├── whisper.py         # Whisper ASR
│   │   ├── captioner.py       # BLIP-Large
│   │   ├── detector.py        # DETR ResNet-50
│   │   ├── depth.py           # Intel DPT-Large
│   │   ├── tts.py             # SpeechT5 + HiFiGAN
│   │   └── translator.py      # MarianMT (5 languages)
│   └── routers/
│       ├── analyze.py         # POST /analyze
│       ├── voice.py           # POST /voice
│       └── health.py          # GET /health
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx       # Main analyzer page
        │   ├── about/         # About + model info page
        │   ├── layout.tsx
        │   └── globals.css
        ├── components/
        │   ├── CameraCapture  # Webcam + file upload
        │   ├── VoiceInput     # Mic → Whisper
        │   ├── DepthZoneMap   # 3-zone depth visual
        │   ├── ResultPanel    # Full results display
        │   ├── AudioPlayer    # TTS audio playback
        │   └── LanguageSelector
        └── lib/api.ts         # Typed API client
```

---

## ⚡ Quick Start

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# (Optional) Pre-download all models
python download_models.py

# Start server
uvicorn main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`  
Swagger docs at `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`

---

## 🌐 API Reference

### `POST /analyze`
Analyze a scene image through the full AI pipeline.

**Request** (multipart/form-data):
| Field | Type | Description |
|---|---|---|
| `image` | File | JPEG / PNG / WebP image |
| `language` | string | `en`, `hi`, `fr`, `es`, `de`, `zh` |
| `query` | string | Optional spoken/typed question |

**Response** (JSON):
```json
{
  "description": "a busy street with people walking",
  "objects": [{"label": "person", "confidence": 0.98, "box": [...]}],
  "hazards": ["car", "person"],
  "depth": {
    "zones": {
      "left":   {"label": "Clear",      "percent": 12.0, "warning": "✅ Path is clear"},
      "center": {"label": "Very Close", "percent": 81.0, "warning": "🚨 STOP"},
      "right":  {"label": "Medium",     "percent": 38.0, "warning": "🟡 Stay alert"}
    },
    "safe_to_walk": false
  },
  "translated_text": "...",
  "audio_b64": "<base64 WAV>",
  "safe_to_walk": false
}
```

### `POST /voice`
Transcribe audio via Whisper.

**Request**: multipart audio file (WAV / WebM)  
**Response**: `{"transcript": "Is it safe to walk forward?"}`

### `GET /health`
Returns model load status.

---

## 🐳 Docker (HuggingFace Spaces)

```bash
cd backend
docker build -t accessworld-backend .
docker run -p 7860:7860 accessworld-backend
```

---

## ♿ Accessibility Commitments

- All interactive elements have ARIA labels
- Screen-reader friendly result announcements (`role="status"`, `aria-live`)
- Skip-to-content link for keyboard users
- High-contrast dark design (WCAG AA compliant colors)
- Full keyboard navigation support
