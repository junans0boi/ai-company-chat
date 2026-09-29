"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { RESULTS, ResultType } from "../quiz/questions";

function ResultInner() {
  const router = useRouter();
  const params = useSearchParams();
  const typeParam = params.get("type") as ResultType | null;
  const type: ResultType = typeParam && RESULTS[typeParam] ? typeParam : "guardian";
  const result = RESULTS[type];

  async function share() {
    const url = window.location.href;
    const text = `나의 회사 생존 유형은 "${result.emoji} ${result.title}" (${result.sub})! 당신은요? 👇`;
    if (navigator.share) {
      try {
        await navigator.share({ title: result.title, text, url });
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("🔗 URL이 클립보드에 복사됐어요!");
    } catch {
      showToast("주소창에서 직접 복사해주세요.");
    }
  }

  function showToast(msg: string) {
    const el = document.getElementById("result-toast");
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = "1";
    el.style.transform = "translateX(-50%) translateY(0)";
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateX(-50%) translateY(12px)";
    }, 2400);
  }

  // Score bar widths — we don't have raw totals on this page, so use a
  // qualitative illustration based on the winner type.
  const barWidths: Record<ResultType, Partial<Record<ResultType, number>>> = {
    pioneer:   { pioneer: 88, optimizer: 55, connector: 30, guardian: 22 },
    optimizer: { optimizer: 88, pioneer: 50, connector: 35, guardian: 40 },
    connector: { connector: 88, optimizer: 45, pioneer: 30, guardian: 55 },
    guardian:  { guardian: 88, connector: 50, optimizer: 40, pioneer: 25 },
  };
  const bars = barWidths[type];
  const types: ResultType[] = ["pioneer", "optimizer", "connector", "guardian"];

  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <button style={s.backBtn} onClick={() => router.push("/company/quiz")} aria-label="다시하기">
          ←
        </button>
        <span style={s.headerTitle}>결과</span>
        <span style={{ width: 36 }} />
      </header>

      <main style={s.main}>
        {/* Hero */}
        <div style={s.hero}>
          <div style={s.tag}>나의 생존 유형</div>
          <span style={s.emoji}>{result.emoji}</span>
          <h1 style={s.typeName}>{result.title}</h1>
          <p style={s.sub}>{result.sub}</p>
        </div>

        {/* Description card */}
        <div style={s.card}>
          <p style={s.desc}>{result.desc}</p>
          <div style={s.traits}>
            {result.traits.map((t, i) => (
              <div key={i} style={s.traitRow}>
                <span style={s.traitBullet}>✦</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Score bars */}
        <div style={s.scoreCard}>
          <div style={s.scoreTitle}>🔬 유형별 적합도</div>
          {types.map((t) => {
            const isWinner = t === type;
            const pct = bars[t] ?? 20;
            return (
              <div key={t} style={s.barRow}>
                <span style={s.barLabel}>{RESULTS[t].emoji} {RESULTS[t].title.split(" ").slice(-1)[0]}</span>
                <div style={s.barTrack}>
                  <div
                    style={{
                      ...s.barFill,
                      width: `${pct}%`,
                      background: isWinner
                        ? "linear-gradient(90deg,#e94560,#ff6b8a)"
                        : "linear-gradient(90deg,#533483,#7b5bb5)",
                    }}
                  />
                </div>
                <span style={s.barPct}>{pct}%</span>
              </div>
            );
          })}
        </div>

        {/* Share */}
        <div style={s.shareSection}>
          <button style={s.shareBtn} onClick={share}>
            📣 결과 공유하기
          </button>
        </div>

        {/* Retry */}
        <button style={s.retryBtn} onClick={() => router.push("/company/quiz")}>
          🔄 다시 테스트하기
        </button>
      </main>

      {/* Toast */}
      <div
        id="result-toast"
        style={s.toast}
      />
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div style={{ background: "#0d0d1a", minHeight: "100dvh" }} />}>
      <ResultInner />
    </Suspense>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100dvh",
    background: "linear-gradient(160deg,#0d0d1a 0%,#1a1a2e 100%)",
    color: "#e0e0e0",
    fontFamily: "'Noto Sans KR',-apple-system,BlinkMacSystemFont,sans-serif",
    display: "flex",
    flexDirection: "column",
    maxWidth: 480,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px 12px",
    position: "sticky",
    top: 0,
    background: "rgba(13,13,26,0.88)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    zIndex: 10,
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#e94560",
    fontSize: "1.3rem",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 8,
    lineHeight: 1,
  },
  headerTitle: {
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "#8899aa",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  main: {
    flex: 1,
    padding: "24px 20px 40px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  hero: {
    textAlign: "center",
    paddingBottom: 8,
  },
  tag: {
    display: "inline-block",
    background: "rgba(233,69,96,0.15)",
    border: "1px solid rgba(233,69,96,0.3)",
    color: "#e94560",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    padding: "5px 14px",
    borderRadius: 99,
    marginBottom: 14,
  },
  emoji: {
    display: "block",
    fontSize: "4.5rem",
    lineHeight: 1,
    marginBottom: 12,
  },
  typeName: {
    fontSize: "1.7rem",
    fontWeight: 900,
    color: "#ffffff",
    lineHeight: 1.2,
    marginBottom: 8,
  },
  sub: {
    fontSize: "1rem",
    color: "#e94560",
    fontWeight: 500,
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 16,
    padding: "20px 18px",
  },
  desc: {
    fontSize: "0.92rem",
    lineHeight: 1.75,
    marginBottom: 16,
    color: "#e0e0e0",
  },
  traits: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  traitRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: "0.82rem",
    color: "#8899aa",
  },
  traitBullet: {
    color: "#e94560",
    flexShrink: 0,
    fontSize: "0.7rem",
    marginTop: 2,
  },
  scoreCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: "18px 18px 10px",
  },
  scoreTitle: {
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#8899aa",
    textTransform: "uppercase",
    marginBottom: 14,
  },
  barRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  barLabel: {
    fontSize: "0.76rem",
    color: "#8899aa",
    width: 72,
    flexShrink: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  barTrack: {
    flex: 1,
    height: 6,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.7s ease",
  },
  barPct: {
    fontSize: "0.73rem",
    color: "#8899aa",
    width: 30,
    textAlign: "right",
    flexShrink: 0,
  },
  shareSection: {
    marginTop: 4,
  },
  shareBtn: {
    display: "block",
    width: "100%",
    padding: "17px",
    background: "linear-gradient(135deg,#e94560,#c73652)",
    border: "none",
    borderRadius: 14,
    color: "#ffffff",
    fontFamily: "inherit",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(233,69,96,0.35)",
    transition: "opacity 0.2s, transform 0.2s",
  },
  retryBtn: {
    display: "block",
    width: "100%",
    padding: "14px",
    background: "transparent",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    color: "#8899aa",
    fontFamily: "inherit",
    fontSize: "0.92rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.2s, color 0.2s",
  },
  toast: {
    position: "fixed",
    bottom: 28,
    left: "50%",
    transform: "translateX(-50%) translateY(12px)",
    background: "rgba(30,30,50,0.95)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#ffffff",
    fontSize: "0.85rem",
    fontWeight: 500,
    padding: "10px 22px",
    borderRadius: 99,
    opacity: 0,
    pointerEvents: "none",
    transition: "opacity 0.25s, transform 0.25s",
    whiteSpace: "nowrap",
    zIndex: 999,
  },
};
