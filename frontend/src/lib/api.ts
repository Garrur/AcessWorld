export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface DetectedObject {
  label: string;
  confidence: number;
  box: [number, number, number, number];
}

export interface ZoneInfo {
  label: string;
  warning: string;
  percent: number;
}

export interface DepthResult {
  zones: { left: ZoneInfo; center: ZoneInfo; right: ZoneInfo };
  overall_warning: string;
  safe_to_walk: boolean;
}

export interface AnalyzeResult {
  query: string;
  description: string;
  objects: DetectedObject[];
  hazards: string[];
  depth: DepthResult;
  translated_text: string;
  audio_b64: string;
  language: string;
  safe_to_walk: boolean;
}

export async function analyzeImage(
  imageFile: File,
  language: string,
  query: string
): Promise<AnalyzeResult> {
  const form = new FormData();
  form.append("image", imageFile);
  form.append("language", language);
  form.append("query", query);

  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Server error ${res.status}`);
  }
  return res.json();
}

export async function transcribeVoice(audioBlob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", audioBlob, "recording.wav");

  const res = await fetch(`${API_BASE}/voice`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error("Voice transcription failed");
  const data = await res.json();
  return data.transcript ?? "";
}
