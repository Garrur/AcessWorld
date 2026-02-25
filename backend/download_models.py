"""
Pre-download all HuggingFace models at Docker build time.
Ensures near-instant startup in HuggingFace Spaces production.
"""
from transformers import (
    BlipProcessor, BlipForConditionalGeneration,
    DetrImageProcessor, DetrForObjectDetection,
    DPTImageProcessor, DPTForDepthEstimation,
    SpeechT5Processor, SpeechT5ForTextToSpeech, SpeechT5HifiGan,
    MarianTokenizer, MarianMTModel,
)
from datasets import load_dataset
import whisper

MARIAN_LANGS = ["hi", "fr", "es", "de", "zh"]

def download_all():
    print("=== AccessWorld Model Pre-Downloader ===")

    print("\n[1/8] Whisper-base (ASR)...")
    whisper.load_model("base")

    print("\n[2/8] BLIP-Large (Captioning)...")
    BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large")
    BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large")

    print("\n[3/8] DETR ResNet-50 (Object Detection)...")
    DetrImageProcessor.from_pretrained("facebook/detr-resnet-50")
    DetrForObjectDetection.from_pretrained("facebook/detr-resnet-50")

    print("\n[4/8] Intel DPT-Large (Depth Estimation)...")
    DPTImageProcessor.from_pretrained("Intel/dpt-large")
    DPTForDepthEstimation.from_pretrained("Intel/dpt-large")

    print("\n[5/8] SpeechT5 TTS...")
    SpeechT5Processor.from_pretrained("microsoft/speecht5_tts")
    SpeechT5ForTextToSpeech.from_pretrained("microsoft/speecht5_tts")

    print("\n[6/8] SpeechT5 HiFiGAN Vocoder...")
    SpeechT5HifiGan.from_pretrained("microsoft/speecht5_hifigan")

    print("\n[7/8] CMU Arctic Xvectors (Speaker Embeddings)...")
    load_dataset("Matthijs/cmu-arctic-xvectors", split="validation")

    print("\n[8/8] MarianMT Translation Models...")
    for lang in MARIAN_LANGS:
        model_id = f"Helsinki-NLP/opus-mt-en-{lang}"
        print(f"  → {model_id}")
        MarianTokenizer.from_pretrained(model_id)
        MarianMTModel.from_pretrained(model_id)

    print("\n✅ All models downloaded successfully!")

if __name__ == "__main__":
    download_all()
