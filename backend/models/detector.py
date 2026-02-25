"""
DETR Object Detector
Model: facebook/detr-resnet-50 (166 MB)
Task: Object detection + bounding boxes
"""
from transformers import DetrImageProcessor, DetrForObjectDetection
from PIL import Image
import torch
import io
from typing import List, Dict


CONFIDENCE_THRESHOLD = 0.70


class DetectorModel:
    MODEL_ID = "facebook/detr-resnet-50"

    def __init__(self):
        print(f"  📥 Loading DETR detector ({self.MODEL_ID})...")
        self.processor = DetrImageProcessor.from_pretrained(self.MODEL_ID)
        self.model = DetrForObjectDetection.from_pretrained(self.MODEL_ID)
        self.model.eval()
        print("  ✅ DETR detector ready.")

    def detect(self, image_bytes: bytes) -> List[Dict]:
        """
        Detect objects in an image.
        
        Args:
            image_bytes: Raw image bytes.
            
        Returns:
            List of dicts:
              { "label": str, "confidence": float (0–1), "box": [x0,y0,x1,y1] }
            Sorted by confidence descending, top 10 results.
        """
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            inputs = self.processor(images=image, return_tensors="pt")

            with torch.no_grad():
                outputs = self.model(**inputs)

            target_sizes = torch.tensor([image.size[::-1]])
            results = self.processor.post_process_object_detection(
                outputs,
                threshold=CONFIDENCE_THRESHOLD,
                target_sizes=target_sizes,
            )[0]

            detections = []
            for score, label, box in zip(
                results["scores"], results["labels"], results["boxes"]
            ):
                detections.append({
                    "label": self.model.config.id2label[label.item()],
                    "confidence": round(score.item(), 3),
                    "box": [round(v, 1) for v in box.tolist()],
                })

            # Sort by confidence, return top 10
            detections.sort(key=lambda d: d["confidence"], reverse=True)
            return detections[:10]

        except Exception as e:
            print(f"  ⚠️  DETR detector error: {e}")
            return []

    def hazardous_objects(self, detections: List[Dict]) -> List[str]:
        """Return labels of detected hazard-class objects."""
        HAZARDS = {
            "car", "truck", "bus", "motorcycle", "bicycle", "train",
            "fire hydrant", "stop sign", "traffic light",
            "person", "dog", "cat", "horse",
            "stairs", "step",
        }
        return [d["label"] for d in detections if d["label"].lower() in HAZARDS]
