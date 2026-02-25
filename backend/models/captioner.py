"""
BLIP Scene Captioner
Model: Salesforce/blip-image-captioning-large (990 MB)
Task: Image → Natural language scene description
"""
from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import torch
import io


class CaptionerModel:
    MODEL_ID = "Salesforce/blip-image-captioning-large"

    def __init__(self):
        print(f"  📥 Loading BLIP captioner ({self.MODEL_ID})...")
        self.processor = BlipProcessor.from_pretrained(self.MODEL_ID)
        self.model = BlipForConditionalGeneration.from_pretrained(
            self.MODEL_ID, torch_dtype=torch.float32
        )
        self.model.eval()
        print("  ✅ BLIP captioner ready.")

    def caption(self, image_bytes: bytes) -> str:
        """
        Generate a natural language scene description from raw image bytes.
        
        Args:
            image_bytes: Raw image file bytes (JPEG / PNG / WebP)
            
        Returns:
            Scene description string, e.g. "a busy street with people walking"
        """
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            inputs = self.processor(images=image, return_tensors="pt")

            with torch.no_grad():
                output = self.model.generate(
                    **inputs,
                    max_new_tokens=100,
                    num_beams=5,
                    early_stopping=True,
                )

            caption = self.processor.decode(output[0], skip_special_tokens=True)
            return caption.strip()

        except Exception as e:
            print(f"  ⚠️  BLIP captioner error: {e}")
            return "Unable to describe the scene."
