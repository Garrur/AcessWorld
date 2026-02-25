"""
SpeechT5 TTS + HiFiGAN Vocoder
Models:
  microsoft/speecht5_tts       (684 MB)
  microsoft/speecht5_hifigan   (272 MB)
  Matthijs/cmu-arctic-xvectors (~50 MB)
Task: Text → Natural speech WAV audio
"""
import io
import base64
import torch
import soundfile as sf
import numpy as np
from datasets import load_dataset
from transformers import SpeechT5Processor, SpeechT5ForTextToSpeech, SpeechT5HifiGan


class TTSModel:
    TTS_MODEL   = "microsoft/speecht5_tts"
    VOCODER_ID  = "microsoft/speecht5_hifigan"
    SPEAKER_DS  = "Matthijs/cmu-arctic-xvectors"

    def __init__(self):
        print(f"  📥 Loading SpeechT5 TTS ({self.TTS_MODEL})...")
        self.processor = SpeechT5Processor.from_pretrained(self.TTS_MODEL)
        self.model     = SpeechT5ForTextToSpeech.from_pretrained(self.TTS_MODEL)
        self.model.eval()

        print(f"  📥 Loading HiFiGAN vocoder ({self.VOCODER_ID})...")
        self.vocoder = SpeechT5HifiGan.from_pretrained(self.VOCODER_ID)
        self.vocoder.eval()

        print(f"  📥 Loading speaker embeddings ({self.SPEAKER_DS})...")
        from huggingface_hub import hf_hub_download
        
        # Download the zip file containing x-vector embeddings bypassing the broken `datasets` script
        import zipfile
        import io
        zip_path = hf_hub_download(
            repo_id="Matthijs/cmu-arctic-xvectors",
            filename="spkrec-xvect.zip",
            repo_type="dataset"
        )
        with zipfile.ZipFile(zip_path) as z:
            # Read a specific speaker's numpy file from the zip archive into memory
            embed_bytes = z.read("spkrec-xvect/cmu_us_slt_arctic-wav-arctic_a0001.npy")
            self.speaker_embeddings = torch.tensor(np.load(io.BytesIO(embed_bytes))).unsqueeze(0)

        print("  ✅ SpeechT5 TTS ready.")

    def synthesize(self, text: str) -> str:
        """
        Convert text to speech and return base64-encoded WAV.
        
        Args:
            text: Text to speak (max ~600 chars for quality output)
            
        Returns:
            Base64-encoded WAV string for browser Audio API consumption.
        """
        try:
            # SpeechT5 max token limit is 600; truncate politely
            if len(text) > 580:
                text = text[:577] + "..."

            inputs = self.processor(text=text, return_tensors="pt")

            with torch.no_grad():
                speech = self.model.generate_speech(
                    inputs["input_ids"],
                    self.speaker_embeddings,
                    vocoder=self.vocoder,
                )

            # Convert to WAV bytes
            wav_buffer = io.BytesIO()
            sf.write(wav_buffer, speech.numpy(), samplerate=16000, format="WAV")
            wav_bytes = wav_buffer.getvalue()

            return base64.b64encode(wav_bytes).decode("utf-8")

        except Exception as e:
            print(f"  ⚠️  TTS synthesis error: {e}")
            return ""
