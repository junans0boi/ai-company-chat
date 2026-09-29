"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, RESULTS, ResultType } from "./questions";

export default function QuizPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [scores, setScores] = useState<Record<ResultType, number>>({
    pioneer: 0,
    optimizer: 0,
    connector: 0,
    guardian: 0,
  });
  const [chosen, setChosen] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  const q = QUESTIONS[current];
  const total = QUESTIONS.length;
  const progress = ((current) / total) * 100;

  function pick(choiceId: string, weight: Record<ResultType, number>) {
    if (animating) return;
    setChosen(choiceId);
    setAnimating(true);

    const next: Record<ResultType, number> = { ...scores };
    for (const k of Object.keys(weight) as ResultType[]) {
      next[k] = (next[k] ?? 0) + weight[k];
    }

    setTimeout(() => {
      if (current + 1 < total) {
        setScores(next);
        setCurrent(current + 1);
        setChosen(null);
        setAnimating(false);
      } else {
        // determine winner
        const winner = (Object.entries(next) as [ResultType, number][])
          .sort((a, b) => b[1] - a[1])[0][0];
        router.push(`/company/result?type=${winner}`);
      }
    }, 380);
  }

  const choiceKeys = ["A", "B", "C", "D"];

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.push("/company")} aria-label="뒤로">
          ←
        </button>
        <span style={styles.headerTitle}>회사 생존 테스트</span>
        <span style={styles.headerCount}>{current + 1} / {total}</span>
      </header>

      {/* Progress bar */}
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      {/* Question card */}
      <main style={styles.main}>
        <div style={styles.situation}>{q.situation}</div>
        <h1 style={styles.questionText}>{q.text}</h1>

        <div style={styles.choices}>
          {q.choices.map((choice, i) => {
            const isChosen = chosen === choice.id;
            return (
              <button
                key={choice.id}
                style={{
                  ...styles.choiceBtn,
                  ...(isChosen ? styles.choiceBtnChosen : {}),
                }}
                onClick={() => pick(choice.id, choice.weight)}
                disabled={animating}
              >
                <span style={{ ...styles.choiceKey, ...(isChosen ? styles.choiceKeyChosen : {}) }}>
                  {choiceKeys[i]}
                </span>
                <span style={styles.choiceLabel}>{choice.label}</span>
              </button>
            );
          })}
        </div>
      </main>

      {/* Dot progress */}
      <div style={styles.dots}>
        {QUESTIONS.map((_, i) => (
          <span
            key={i}
            style={{
              ...styles.dot,
              ...(i < current ? styles.dotDone : {}),
              ...(i === current ? styles.dotActive : {}),
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Inline styles (no external CSS dependency) ───────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100dvh",
    background: "linear-gradient(160deg, #0d0d1a 0%, #1a1a2e 100%)",
    color: "#e0e0e0",
    fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
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
  headerCount: {
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "#e94560",
  },
  progressTrack: {
    height: 4,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #e94560, #ff6b8a)",
    transition: "width 0.4s ease",
  },
  main: {
    flex: 1,
    padding: "32px 20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  situation: {
    fontSize: "0.8rem",
    color: "#8899aa",
    marginBottom: 10,
    fontWeight: 500,
  },
  questionText: {
    fontSize: "1.18rem",
    fontWeight: 800,
    color: "#ffffff",
    lineHeight: 1.55,
    marginBottom: 28,
  },
  choices: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  choiceBtn: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    padding: "15px 18px",
    background: "rgba(255,255,255,0.04)",
    border: "1.5px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    cursor: "pointer",
    color: "#e0e0e0",
    fontFamily: "inherit",
    fontSize: "0.92rem",
    lineHeight: 1.5,
    textAlign: "left",
    transition: "border-color 0.2s, background 0.2s",
    WebkitTapHighlightColor: "transparent",
  },
  choiceBtnChosen: {
    borderColor: "#e94560",
    background: "rgba(233,69,96,0.1)",
  },
  choiceKey: {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "1.5px solid rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#8899aa",
    transition: "background 0.2s, border-color 0.2s, color 0.2s",
  },
  choiceKeyChosen: {
    background: "#e94560",
    borderColor: "#e94560",
    color: "#ffffff",
  },
  choiceLabel: {
    flex: 1,
  },
  dots: {
    display: "flex",
    justifyContent: "center",
    gap: 6,
    padding: "16px 20px 32px",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.12)",
    transition: "background 0.2s, transform 0.2s",
    display: "inline-block",
  },
  dotDone: {
    background: "#e94560",
  },
  dotActive: {
    background: "#e94560",
    transform: "scale(1.35)",
    boxShadow: "0 0 8px rgba(233,69,96,0.6)",
  },
};
