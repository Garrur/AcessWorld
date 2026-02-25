"use client";
import { AnalyzeResult } from "@/lib/api";
import DepthZoneMap from "./DepthZoneMap";
import styles from "./ResultPanel.module.css";

interface ResultPanelProps {
  result: AnalyzeResult;
  language: string;
}

const LANG_LABELS: Record<string, string> = {
  en: "English", hi: "Hindi", fr: "French",
  es: "Spanish", de: "German", zh: "Chinese",
};

export default function ResultPanel({ result, language }: ResultPanelProps) {
  return (
    <div className={styles.wrapper}>
      {/* Scene Description */}
      <section className={`card ${styles.section} animate-fade-in-up`} aria-label="Scene description">
        <p className="section-label">👁️ Scene Description</p>
        <p className={styles.description}>{result.description}</p>
      </section>

      {/* Detected Objects */}
      {result.objects.length > 0 && (
        <section className={`card ${styles.section} animate-fade-in-up`} aria-label="Detected objects">
          <p className="section-label">📦 Detected Objects ({result.objects.length})</p>
          <div className={styles.objectGrid}>
            {result.objects.map((obj, i) => (
              <div key={i} className={styles.objectItem} role="listitem">
                <div className={styles.objectHeader}>
                  <span className={styles.objectLabel}>{obj.label}</span>
                  <span className={styles.objectConf}>{(obj.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill progress-fill-teal"
                    style={{ width: `${obj.confidence * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hazards */}
      {result.hazards.length > 0 && (
        <section className={`card ${styles.section} ${styles.hazardCard} animate-fade-in-up`} role="alert" aria-label="Detected hazards">
          <p className="section-label">⚠️ Hazards Detected</p>
          <div className={styles.hazardList}>
            {result.hazards.map((h, i) => (
              <span key={i} className="badge badge-red">{h}</span>
            ))}
          </div>
        </section>
      )}

      {/* Depth Zones */}
      <section className={`card ${styles.section} animate-fade-in-up`} aria-label="Depth zone analysis">
        <DepthZoneMap depth={result.depth} />
      </section>

      {/* Translation */}
      {language !== "en" && result.translated_text && (
        <section className={`card ${styles.section} animate-fade-in-up`} aria-label={`Translation in ${LANG_LABELS[language]}`}>
          <div className={styles.translateHeader}>
            <p className="section-label">🌐 Translation</p>
            <span className="badge badge-teal">{LANG_LABELS[language] ?? language}</span>
          </div>
          <p className={styles.translatedText}>{result.translated_text}</p>
        </section>
      )}
    </div>
  );
}
