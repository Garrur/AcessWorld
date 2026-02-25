import type { Metadata } from "next";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About AccessWorld — AI for Accessibility",
  description: "How AccessWorld uses 11 free HuggingFace models to help visually impaired users navigate the world.",
};

const MODELS = [
  { role: "🎤 ASR",       id: "openai/whisper-base",                        task: "Speech → Text",            size: "145 MB" },
  { role: "👁️ Caption",  id: "Salesforce/blip-image-captioning-large",      task: "Image → Description",      size: "990 MB" },
  { role: "📦 Detection", id: "facebook/detr-resnet-50",                    task: "Objects + Bounding Boxes",  size: "166 MB" },
  { role: "📏 Depth",     id: "Intel/dpt-large",                            task: "3-Zone Proximity Map",      size: "1.3 GB" },
  { role: "🔊 TTS",       id: "microsoft/speecht5_tts",                     task: "Text → Natural Speech",     size: "684 MB" },
  { role: "🎛️ Vocoder",  id: "microsoft/speecht5_hifigan",                  task: "Neural Audio Vocoder",      size: "272 MB" },
  { role: "🗣️ Speaker",  id: "Matthijs/cmu-arctic-xvectors",               task: "Voice Embeddings",          size: "~50 MB" },
  { role: "🌐 EN→HI",    id: "Helsinki-NLP/opus-mt-en-hi",                  task: "English → Hindi",           size: "~300 MB" },
  { role: "🌐 EN→FR",    id: "Helsinki-NLP/opus-mt-en-fr",                  task: "English → French",          size: "~300 MB" },
  { role: "🌐 EN→ES",    id: "Helsinki-NLP/opus-mt-en-es",                  task: "English → Spanish",         size: "~300 MB" },
  { role: "🌐 EN→DE",    id: "Helsinki-NLP/opus-mt-en-de",                  task: "English → German",          size: "~300 MB" },
];

export default function AboutPage() {
  return (
    <div className="container">
      <section className={styles.hero}>
        <h1>The Technology Behind <span className={styles.accent}>AccessWorld</span></h1>
        <p className={styles.sub}>
          285 million people worldwide live with visual impairment. AccessWorld gives them a voice-first,
          hands-free way to understand their surroundings using 11 free, open-source HuggingFace models.
        </p>
      </section>

      {/* Pipeline */}
      <section className={`card ${styles.section}`}>
        <h2>🔗 The AI Pipeline</h2>
        <div className={styles.pipeline}>
          {[
            { icon: "🎤", title: "Whisper", desc: "Converts your spoken question into text so AccessWorld stays fully hands-free." },
            { icon: "👁️", title: "BLIP Large", desc: "Analyzes the camera image and generates a natural language description of the scene." },
            { icon: "📦", title: "DETR", desc: "Detects every object in the image with bounding boxes and confidence scores." },
            { icon: "📏", title: "DPT-Large", desc: "Estimates how far away objects are in three zones: left, center, right." },
            { icon: "🌐", title: "MarianMT", desc: "Translates the English description into your native language (5 languages supported)." },
            { icon: "🔊", title: "SpeechT5", desc: "Synthesizes the answer into natural speech that auto-plays in your browser." },
          ].map((step, i) => (
            <div key={i} className={styles.pipelineCard}>
              <span className={styles.pipelineIcon}>{step.icon}</span>
              <div>
                <h3 className={styles.pipelineTitle}>{step.title}</h3>
                <p className={styles.pipelineDesc}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Model Table */}
      <section className={`card ${styles.section}`}>
        <h2>📋 All 11 HuggingFace Models</h2>
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Role</th>
                <th>Model ID</th>
                <th>Task</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map((m, i) => (
                <tr key={i}>
                  <td>{m.role}</td>
                  <td>
                    <a
                      href={`https://huggingface.co/${m.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.modelLink}
                    >
                      {m.id}
                    </a>
                  </td>
                  <td>{m.task}</td>
                  <td className={styles.size}>{m.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Impact */}
      <section className={`card ${styles.section}`}>
        <h2>🌍 Real-World Impact</h2>
        <div className={styles.statsGrid}>
          {[
            { number: "285M",  label: "People with visual impairment worldwide" },
            { number: "11",    label: "Free AI models chained end-to-end" },
            { number: "5",     label: "Languages supported" },
            { number: "0.0",   label: "API cost (100% HuggingFace free)" },
          ].map((s, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statNumber}>{s.number}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
