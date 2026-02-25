# AccessWorld Backend — Dockerfile
# Optimized for HuggingFace Spaces deployment
# Pre-downloads all models at build time for fast cold starts

FROM python:3.10-slim

# System dependencies (ffmpeg for audio processing)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Pre-download all HuggingFace models (cached in Docker layer)
RUN python download_models.py

# HuggingFace Spaces exposes port 7860
EXPOSE 7860

# Launch FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
