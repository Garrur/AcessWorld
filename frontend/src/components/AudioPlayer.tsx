"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./AudioPlayer.module.css";

interface AudioPlayerProps {
  audioB64: string;        // base64-encoded WAV
  autoPlay?: boolean;
}

export default function AudioPlayer({ audioB64, autoPlay = true }: AudioPlayerProps) {
  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current,  setCurrent]  = useState(0);

  // Decode base64 → blob URL whenever audioB64 changes
  useEffect(() => {
    if (!audioB64) return;
    const binary = atob(audioB64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob   = new Blob([bytes], { type: "audio/wav" });
    const url    = URL.createObjectURL(blob);

    const audio  = new Audio(url);
    audioRef.current = audio;

    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate     = () => setCurrent(audio.currentTime);
    audio.onended          = () => { setPlaying(false); setCurrent(0); };

    if (autoPlay) {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }

    return () => {
      audio.pause();
      URL.revokeObjectURL(url);
    };
  }, [audioB64, autoPlay]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className={styles.wrapper} aria-label="Audio description player">
      <p className="section-label">🔊 Audio Description</p>

      <div className={styles.player}>
        {/* Play / Pause */}
        <button
          className={`btn btn-primary btn-icon ${styles.playBtn}`}
          onClick={toggle}
          aria-label={playing ? "Pause audio" : "Play audio description"}
        >
          {playing ? "⏸" : "▶"}
        </button>

        {/* Waveform + Seek bar */}
        <div className={styles.right}>
          <div className={styles.waveform} aria-hidden>
            {Array.from({ length: 28 }).map((_, i) => (
              <span
                key={i}
                className={`${styles.bar} ${playing ? styles.animated : ""}`}
                style={{ animationDelay: `${(i * 0.05) % 0.8}s` }}
              />
            ))}
          </div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="progress-fill progress-fill-teal" style={{ width: `${pct}%` }} />
          </div>
          <div className={styles.timeRow}>
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}
