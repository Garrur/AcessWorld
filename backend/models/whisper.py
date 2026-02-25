"""
Whisper ASR Model Wrapper
Model: openai/whisper-base (145 MB)
Task: Speech → Text (hands-free input for visually impaired users)
"""
import io
import torch
import whisper
import numpy as np
import soundfile as sf


class WhisperModel:
    def __init__(self):
        print("  📥 Loading Whisper-base ASR model...")
        self.model = whisper.load_model("base")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print("  ✅ Whisper-base ready.")

    def transcribe(self, audio_bytes: bytes, audio_format: str = "wav") -> str:
        """
        Transcribe audio bytes to text.
        
        Args:
            audio_bytes: Raw audio file bytes (WAV / WebM / MP3)
            audio_format: Format hint (wav, webm, mp3)
            
        Returns:
            Transcribed text string (or empty string on failure)
        """
        try:
            # Write to a temp buffer whisper can read
            audio_buffer = io.BytesIO(audio_bytes)
            
            # Use pydub to decode WebM/MP3/WAV safely
            from pydub import AudioSegment
            audio_segment = AudioSegment.from_file(audio_buffer)
            
            # Whisper expects mono float32 at 16 kHz. We can let pydub handle resampling
            audio_segment = audio_segment.set_frame_rate(16000).set_channels(1)
            
            # Convert to float32 numpy array normalized to [-1.0, 1.0]
            samples = np.array(audio_segment.get_array_of_samples())
            audio_array = samples.astype(np.float32) / 32768.0
            
            # Resample to 16kHz if needed using whisper's pad/trim
            audio_tensor = whisper.pad_or_trim(
                torch.tensor(audio_array),
            )
            mel = whisper.log_mel_spectrogram(audio_tensor).to(self.device)
            
            options = whisper.DecodingOptions(
                language="en",
                fp16=torch.cuda.is_available(),
            )
            result = whisper.decode(self.model, mel, options)
            return result.text.strip()

        except Exception as e:
            print(f"  ⚠️  Whisper transcription error: {e}")
            return ""
