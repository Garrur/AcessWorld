"use client";
import { useState, useCallback } from "react";
import { analyzeImage, AnalyzeResult } from "@/lib/api";
import CameraCapture from "@/components/CameraCapture";
import VoiceInput from "@/components/VoiceInput";
import LanguageSelector from "@/components/LanguageSelector";
import ResultPanel from "@/components/ResultPanel";
import AudioPlayer from "@/components/AudioPlayer";
import styles from "./page.module.css";

export default function HomePage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [language,  setLanguage]  = useState("en");
  const [query,     setQuery]     = useState("");
  const [result,    setResult]    = useState<AnalyzeResult | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [isLiveAnalyzing, setIsLiveAnalyzing] = useState(false);
  const [error,     setError]     = useState("");

  const handleImageSelected = useCallback((file: File) => {
    setImageFile(file);
    setResult(null);
    setError("");
  }, []);

  const handleAnalyze = async (fileToAnalyze?: File) => {
    const targetFile = fileToAnalyze || imageFile;
    if (!targetFile) { setError("Please upload or capture an image first."); return; }
    
    const isLive = !!fileToAnalyze;
    if (isLive) {
      setIsLiveAnalyzing(true);
    } else {
      setLoading(true);
    }

    setError("");
    try {
      const res = await analyzeImage(targetFile, language, query);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
      setIsLiveAnalyzing(false);
    }
  };

  const handleLiveFrameCaptured = useCallback((file: File) => {
    setImageFile(file); // Optional, so the user sees the latest frame if they switch views
    handleAnalyze(file);
  }, [language, query]);

  return (
    <div className="container">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className="badge badge-teal">🤗 11 Free HuggingFace Models</span>
        </div>
        <h1 className={styles.heroTitle}>
          See the World<br />
          <span className={styles.heroAccent}>Through AI</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Real-time environment description for visually impaired users.<br />
          Point your camera · Speak your question · Hear your answer.
        </p>
        <div className={styles.heroPipeline}>
          {["📷 Camera", "👁️ Caption", "📦 Detect", "📏 Depth", "🌐 Translate", "🔊 Speak"].map((step, i) => (
            <div key={i} className={styles.pipelineStep}>
              <span>{step}</span>
              {i < 5 && <span className={styles.arrow} aria-hidden>→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Main Grid ──────────────────────────────────────────────────────── */}
      <div className={styles.grid}>
        {/* Left Column: Inputs */}
        <div className={styles.leftCol}>
          {/* Camera */}
          <div className="card">
            <p className="section-label">📷 Scene Input</p>
            <div style={{ marginTop: 14 }}>
              <CameraCapture 
                onImageSelected={(f) => handleImageSelected(f)} 
                onLiveFrameCaptured={handleLiveFrameCaptured}
                isLiveAnalyzing={isLiveAnalyzing}
              />
            </div>
          </div>

          {/* Voice Input */}
          <div className="card">
            <VoiceInput onTranscript={setQuery} />
            <div style={{ marginTop: 14 }}>
              <label htmlFor="query-input" className="section-label" style={{ display: "block", marginBottom: 6 }}>
                Or type your question:
              </label>
              <input
                id="query-input"
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder='e.g. "Is it safe to walk forward?"'
                className={styles.queryInput}
                aria-label="Type a question about the scene"
                onKeyDown={e => e.key === "Enter" && handleAnalyze()}
              />
            </div>
          </div>

          {/* Language */}
          <div className="card">
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>

          {/* Analyze Button */}
          <button
            className={`btn btn-primary ${styles.analyzeBtn}`}
            onClick={() => handleAnalyze()}
            disabled={loading || !imageFile || isLiveAnalyzing}
            aria-label="Analyze the scene image"
            aria-busy={loading}
          >
            {loading || isLiveAnalyzing ? (
              <>
                <span className={styles.spinnerInline} aria-hidden />
                {isLiveAnalyzing ? "Live Analyzing…" : "Analyzing…"}
              </>
            ) : (
              "🔍 Analyze Scene"
            )}
          </button>

          {error && (
            <div className={styles.errorBox} role="alert">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className={styles.rightCol}>
          {loading && (
            <div className={styles.loadingState} aria-live="polite" aria-label="Analysis in progress">
              <div className={styles.loadingSpinner} aria-hidden />
              <div>
                <p className={styles.loadingTitle}>Analyzing your scene…</p>
                <p className={styles.loadingSteps}>Running 11 AI models in sequence</p>
                {["🎤 Whisper: Processing voice query", "👁️ BLIP: Generating scene caption", "📦 DETR: Detecting objects", "📏 DPT: Estimating depth", "🌐 MarianMT: Translating", "🔊 SpeechT5: Synthesizing audio"].map((s, i) => (
                  <p key={i} className={styles.loadingStep} style={{ animationDelay: `${i * 0.4}s` }}>
                    {s}
                  </p>
                ))}
              </div>
            </div>
          )}

          {!loading && result && (
            <div className={styles.results} aria-live="polite">
              {result.audio_b64 && (
                <div className="card">
                  <AudioPlayer audioB64={result.audio_b64} autoPlay={true} />
                </div>
              )}
              <ResultPanel result={result} language={language} />
            </div>
          )}

          {!loading && !result && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon} aria-hidden>🌍</span>
              <p>Upload an image and click <strong>Analyze Scene</strong></p>
              <p className={styles.emptySub}>AccessWorld will describe what it sees, detect objects, estimate depth, and read the description aloud in your language.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
