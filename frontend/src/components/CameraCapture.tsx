"use client";
import { useState, useRef, useCallback } from "react";
import styles from "./CameraCapture.module.css";

interface CameraCaptureProps {
  onImageSelected: (file: File, previewUrl: string) => void;
}

export default function CameraCapture({ onImageSelected }: CameraCaptureProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

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

  // ── Live Camera ────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      alert("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      const url = canvas.toDataURL("image/jpeg");
      setPreviewUrl(url);
      onImageSelected(file, url);
      stopCamera();
    }, "image/jpeg", 0.92);
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
            <button className="btn btn-primary" onClick={captureFrame} aria-label="Capture current camera frame">
              📸 Capture
            </button>
            <button className="btn btn-danger" onClick={stopCamera} aria-label="Close camera">
              ✕ Stop Camera
            </button>
          </>
        )}
      </div>
    </div>
  );
}
