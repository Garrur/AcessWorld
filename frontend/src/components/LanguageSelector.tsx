"use client";
import styles from "./LanguageSelector.module.css";

const LANGUAGES = [
  { code: "en", label: "🇬🇧 English", native: "English" },
  { code: "hi", label: "🇮🇳 Hindi",   native: "हिन्दी" },
  { code: "fr", label: "🇫🇷 French",  native: "Français" },
  { code: "es", label: "🇪🇸 Spanish", native: "Español" },
  { code: "de", label: "🇩🇪 German",  native: "Deutsch" },
  { code: "zh", label: "🇨🇳 Chinese", native: "中文" },
];

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
}

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className={styles.wrapper}>
      <p className="section-label">🌐 Output Language</p>
      <div className={styles.grid} role="radiogroup" aria-label="Select output language">
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            role="radio"
            aria-checked={value === lang.code}
            className={`${styles.langBtn} ${value === lang.code ? styles.active : ""}`}
            onClick={() => onChange(lang.code)}
            aria-label={`Select ${lang.label} language`}
          >
            <span className={styles.flag}>{lang.label.split(" ")[0]}</span>
            <span className={styles.name}>{lang.native}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
