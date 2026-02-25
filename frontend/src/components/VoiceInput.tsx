"use client";
import { useState, useRef } from "react";
import { transcribeVoice } from "@/lib/api";
import styles from "./VoiceInput.module.css";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

export default function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const mediaRef   = useRef<MediaRecorder | null>(null);
  const chunksRef  = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setLoading(true);
        try {
          const text = await transcribeVoice(blob);
          setTranscript(text);
          onTranscript(text);
        } catch {
          setError("Transcription failed. Please try again.");
        } finally {
          setLoading(false);
        }
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      setError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <p className="section-label">🎤 Voice Input</p>
        <p className={styles.hint}>Speak your question — Whisper will transcribe it</p>
      </div>

      <div className={styles.row}>
        {/* Mic Button */}
        <button
          className={`btn btn-icon ${recording ? styles.recBtn : "btn-secondary"}`}
          onClick={recording ? stopRecording : startRecording}
          disabled={loading}
          aria-label={recording ? "Stop recording" : "Start voice recording"}
          aria-live="polite"
        >
          {loading ? (
            <span className={styles.spinner} aria-hidden />
          ) : recording ? (
            "⏹️"
          ) : (
            "🎙️"
          )}
        </button>

        {/* Pulsing Ring (recording indicator) */}
        {recording && (
          <div className={styles.pulseRingContainer} aria-hidden>
            <span className={styles.pulseRing} />
            <span className={styles.pulseRing2} />
          </div>
        )}

        {/* Transcript */}
        <div className={styles.transcriptBox} role="status" aria-live="polite">
          {loading && <span className={styles.transcribing}>Transcribing…</span>}
          {!loading && transcript && <p className={styles.transcriptText}>"{transcript}"</p>}
          {!loading && !transcript && !recording && (
            <p className={styles.placeholder}>Press 🎙️ and speak your question</p>
          )}
          {recording && !loading && <p className={styles.listening}>Listening…</p>}
        </div>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
