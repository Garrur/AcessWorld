import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AccessWorld — Real-Time Environment Describer",
  description:
    "AI-powered real-time scene description for visually impaired users. Point your camera, speak your question, hear the answer.",
  keywords: ["accessibility", "AI", "vision impaired", "blind", "scene description", "TTS"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {/* Skip to content for screen readers */}
        <a href="#main" className="sr-only" style={{
          position: "absolute", left: "-9999px", zIndex: 999,
          background: "var(--teal)", color: "#000", padding: "8px 16px",
        }}>
          Skip to main content
        </a>

        {/* Navbar */}
        <nav className="navbar" role="navigation" aria-label="Main navigation">
          <Link href="/" className="navbar-logo" aria-label="AccessWorld home">
            🌍 Access<span>World</span>
          </Link>
          <ul className="navbar-links">
            <li><Link href="/">Analyze</Link></li>
            <li><Link href="/about">About</Link></li>
            <li>
              <a
                href="https://huggingface.co"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="HuggingFace (opens in new tab)"
              >
                🤗 HuggingFace
              </a>
            </li>
          </ul>
        </nav>

        {/* Page content */}
        <main id="main" role="main">
          {children}
        </main>

        {/* Footer */}
        <footer style={{
          textAlign: "center",
          padding: "32px 24px",
          color: "var(--text-muted)",
          fontSize: "13px",
          borderTop: "1px solid var(--border)",
          marginTop: "60px",
          position: "relative",
          zIndex: 1,
        }}>
          <p>
            🌍 AccessWorld — Built with{" "}
            <a href="https://huggingface.co" target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal)" }}>
              HuggingFace Free Models
            </a>
            {" "}— Empowering 285 million visually impaired people worldwide
          </p>
        </footer>
      </body>
    </html>
  );
}
