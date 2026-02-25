"use client";
import { DepthResult } from "@/lib/api";
import styles from "./DepthZoneMap.module.css";

interface DepthZoneMapProps {
  depth: DepthResult;
}

const ZONE_COLOR: Record<string, string> = {
  "Very Close": "red",
  "Close":      "yellow",
  "Medium":     "yellow",
  "Clear":      "green",
  "Unknown":    "muted",
};

function Zone({ name, info }: { name: string; info: { label: string; warning: string; percent: number } }) {
  const color = ZONE_COLOR[info.label] ?? "muted";
  return (
    <div className={`${styles.zone} ${styles[`zone_${color}`]}`} role="status" aria-label={`${name} zone: ${info.label}. ${info.warning}`}>
      <div className={styles.zoneName}>{name}</div>
      <div className={styles.zonePercent}>{info.percent.toFixed(0)}%</div>
      <div className={styles.zoneLabel}>{info.label}</div>
      <div className={styles.progressBar}>
        <div
          className={`${styles.progressFill} ${styles[`fill_${color}`]}`}
          style={{ width: `${info.percent}%` }}
        />
      </div>
    </div>
  );
}

export default function DepthZoneMap({ depth }: DepthZoneMapProps) {
  const { zones, overall_warning, safe_to_walk } = depth;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <p className="section-label">📏 Depth Analysis</p>
        <span className={`badge ${safe_to_walk ? "badge-green" : "badge-red"}`}>
          {safe_to_walk ? "✅ Safe to Walk" : "🚨 Hazard Detected"}
        </span>
      </div>

      {/* 3-Zone Map */}
      <div className={styles.zonesRow} role="group" aria-label="Depth zone map: left, center, right">
        <Zone name="LEFT"   info={zones.left}   />
        <Zone name="CENTER" info={zones.center} />
        <Zone name="RIGHT"  info={zones.right}  />
      </div>

      {/* Overall Warning */}
      <div className={`${styles.overallWarning} ${safe_to_walk ? styles.safe : styles.danger}`} role="alert">
        {overall_warning}
      </div>
    </div>
  );
}
