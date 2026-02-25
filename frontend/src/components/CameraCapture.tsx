"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import styles from "./CameraCapture.module.css";

interface CameraCaptureProps {
  onImageSelected: (file: File, previewUrl: string) => void;
  onLiveFrameCaptured?: (file: File) => void;
  isLiveAnalyzing?: boolean;
}

export default function CameraCapture({ onImageSelected, onLiveFrameCaptured, isLiveAnalyzing }: CameraCaptureProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [liveModeActive, setLiveModeActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onImageSelected(file, url);
  }, [onImageSelected]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // Attach stream once the video element mounts
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.error("Error playing video:", e));
    }
  }, [cameraActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraActive(true); // This mounts the <video> element, triggering the useEffect
    } catch {
      alert("Camera access denied or unavailable.");
    }
  };

  const captureFrame = (silent = false) => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      const url = canvas.toDataURL("image/jpeg");
      
      if (silent && onLiveFrameCaptured) {
        onLiveFrameCaptured(file);
      } else {
        setPreviewUrl(url);
        onImageSelected(file, url);
        stopCamera();
      }
    }, "image/jpeg", 0.92);
  };

  const toggleLiveMode = () => {
    if (liveModeActive) {
      setLiveModeActive(false);
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    } else {
      setLiveModeActive(true);
      // Immediately capture first frame, then interval
      captureFrame(true); 
      liveIntervalRef.current = setInterval(() => {
        // Only capture next frame if parent is not currently analyzing
        if (!isLiveAnalyzing) {
            captureFrame(true);
        }
      }, 5000); // 5 sec fallback interval if backend responds faster than that
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraActive(false);
    setLiveModeActive(false);
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
  };

  return (
    <div className={styles.wrapper}>
      {/* Upload / Drop Zone */}
      {!cameraActive && (
        <div
          className={`${styles.dropZone} ${dragOver ? styles.dragOver : ""} ${previewUrl ? styles.hasPreview : ""}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !previewUrl && fileInputRef.current?.click()}
          role="button"
          aria-label="Upload image for analysis"
          tabIndex={0}
          onKeyDown={e => e.key === "Enter" && fileInputRef.current?.click()}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Selected scene for analysis" className={styles.preview} />
          ) : (
            <div className={styles.placeholder}>
              <span className={styles.uploadIcon} aria-hidden>📷</span>
              <p className={styles.uploadTitle}>Drop an image or click to upload</p>
              <p className={styles.uploadSub}>JPEG · PNG · WebP</p>
            </div>
          )}
        </div>
      )}

      {/* Live Camera View */}
      {cameraActive && (
        <div className={styles.cameraView}>
          <video ref={videoRef} className={styles.video} autoPlay playsInline muted aria-label="Live camera feed" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className={styles.hiddenInput}
        onChange={handleInputChange}
        aria-label="Select image file"
      />

      {/* Action Buttons */}
      <div className={styles.actions}>
        {!cameraActive ? (
          <>
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} aria-label="Upload an image from your device">
              📂 Upload Image
            </button>
            <button className="btn btn-secondary" onClick={startCamera} aria-label="Open live camera">
              📹 Use Camera
            </button>
            {previewUrl && (
              <button className="btn btn-danger" onClick={() => setPreviewUrl(null)} aria-label="Remove selected image">
                ✕ Remove
              </button>
            )}
          </>
        ) : (
          <>
            {!liveModeActive && (
              <button className="btn btn-primary" onClick={() => captureFrame(false)} aria-label="Capture single photo">
                📸 Photograph
              </button>
            )}
            
            <button 
              className={`btn ${liveModeActive ? "btn-danger" : "btn-secondary"}`} 
              onClick={toggleLiveMode} 
              aria-label="Toggle live continuous description mode"
            >
              {liveModeActive ? "🔴 Stop Live Mode" : "🟢 Start Live Mode"}
            </button>
            <button className="btn btn-danger" onClick={stopCamera} aria-label="Close camera">
              ✕ Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
