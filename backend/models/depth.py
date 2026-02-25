"""
Intel DPT-Large Depth Estimator
Model: Intel/dpt-large (1.3 GB)
Task: Monocular depth estimation → 3-zone proximity warnings

Zone layout (left third | center third | right third):
┌───────┬────────┬───────┐
│  LEFT │ CENTER │ RIGHT │
└───────┴────────┴───────┘
"""
import io
import numpy as np
import torch
from PIL import Image
from transformers import DPTImageProcessor, DPTForDepthEstimation
from typing import Dict


PROXIMITY_LEVELS = [
    (70, "Very Close", "🚨 STOP — obstacle very close, do not move forward"),
    (45, "Close",      "⚠️  Caution — obstacle ahead, proceed slowly"),
    (25, "Medium",     "🟡 Some objects nearby, stay alert"),
    (0,  "Clear",      "✅ Path appears clear"),
]


def _proximity_label(pct: float) -> Dict:
    for threshold, label, warning in PROXIMITY_LEVELS:
        if pct >= threshold:
            return {"label": label, "warning": warning, "percent": round(pct, 1)}
    return {"label": "Clear", "warning": "✅ Path appears clear", "percent": 0.0}


class DepthModel:
    MODEL_ID = "Intel/dpt-large"

    def __init__(self):
        print(f"  📥 Loading DPT depth estimator ({self.MODEL_ID})...")
        self.processor = DPTImageProcessor.from_pretrained(self.MODEL_ID)
        self.model = DPTForDepthEstimation.from_pretrained(self.MODEL_ID)
        self.model.eval()
        print("  ✅ DPT depth estimator ready.")

    def analyze(self, image_bytes: bytes) -> Dict:
        """
        Run depth estimation and return 3-zone proximity results.
        
        Returns:
            {
              "zones": {
                "left":   {"label": str, "warning": str, "percent": float},
                "center": {...},
                "right":  {...},
              },
              "overall_warning": str,   # worst-case zone warning
              "safe_to_walk": bool,
            }
        """
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            inputs = self.processor(images=image, return_tensors="pt")

            with torch.no_grad():
                outputs = self.model(**inputs)

            # Interpolate to original size
            predicted_depth = outputs.predicted_depth.squeeze().numpy()

            # Normalise depth to 0–100 % where 100 = closest
            dmin, dmax = predicted_depth.min(), predicted_depth.max()
            if dmax - dmin < 1e-6:
                norm = np.zeros_like(predicted_depth)
            else:
                # DPT: larger value = closer
                norm = ((predicted_depth - dmin) / (dmax - dmin)) * 100

            h, w = norm.shape
            third = w // 3
            left_zone   = norm[:, :third]
            center_zone = norm[:, third:2*third]
            right_zone  = norm[:, 2*third:]

            # 90th percentile = robust "how close is the closest thing"
            def zone_pct(zone):
                return float(np.percentile(zone, 90))

            zones = {
                "left":   _proximity_label(zone_pct(left_zone)),
                "center": _proximity_label(zone_pct(center_zone)),
                "right":  _proximity_label(zone_pct(right_zone)),
            }

            worst_pct = max(z["percent"] for z in zones.values())
            overall = _proximity_label(worst_pct)
            safe = overall["label"] in ("Clear", "Medium")

            return {
                "zones": zones,
                "overall_warning": overall["warning"],
                "safe_to_walk": safe,
            }

        except Exception as e:
            print(f"  ⚠️  DPT depth error: {e}")
            return {
                "zones": {
                    "left":   {"label": "Unknown", "warning": "Cannot determine", "percent": 0},
                    "center": {"label": "Unknown", "warning": "Cannot determine", "percent": 0},
                    "right":  {"label": "Unknown", "warning": "Cannot determine", "percent": 0},
                },
                "overall_warning": "Depth estimation unavailable.",
                "safe_to_walk": False,
            }
