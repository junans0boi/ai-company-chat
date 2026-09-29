"use client";

import { useRouter } from "next/navigation";
import { RESULTS, ResultType } from "./quiz/questions";

const ALL_TYPES = Object.entries(RESULTS) as [ResultType, typeof RESULTS[ResultType]][];

export default function CompanyLandingPage() {
  const router = useRouter();
  return (
    <div style={s.root}>
      <header style={s.header}>
        <button style={s.backBtn} onClick={() => router.push("/")} aria-label="홈으로">
          ←
        </button>
        <span style={s.headerTitle}>회사 생존 테스트</span>
        <span style={{ width: 36 }} />
      </header>

      <main style={s.main}>
        <div style={s.badge}>📋 2026 직장인 생존 리포트</div>
        <span style={s.bigEmoji}>🏢</span>
        <h1 style={s.title}>
          오늘 나는<br />
          <span style={s.accent}>회사에서</span><br />
          살아남을 수 있나?
        </h1>
        <p style={s.subtitle}>
          6가지 직장 상황에 반응하면<br />
          당신의 <strong>생존 유형</strong>을 알려드립니다.<br />
          약 30초면 충분해요.
        </p>

        <div style={s.meta}>
          <div style={s.metaItem}><span style={s.metaVal}>6</span><span style={s.metaLbl}>문항</span></div>
          <div style={s.metaDivider} />
          <div style={s.metaItem}><span style={s.metaVal}>30<small style={{ fontSize: "0.7rem" }}>초</small></span><span style={s.metaLbl}>소요시간</span></div>
          <div style={s.metaDivider} />
          <div style={s.metaItem}><span style={s.metaVal}>4</span><span style={s.metaLbl}>결과유형</span></div>
        </div>

        <button style={s.cta} onClick={() => router.push("/company/quiz")}>
          테스트 시작하기 →
        </button>

        <div style={s.typeGrid}>
          {ALL_TYPES.map(([key, r]) => (
            <div key={key} style={s.typeChip}>
              <span style={s.typeEmoji}>{r.emoji}</span>
              <span style={s.typeChipName}>{r.title}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

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
    background: "rgba(13,13,26,0.88)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
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
    padding: "32px 24px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 0,
  },
  badge: {
    display: "inline-block",
    background: "rgba(233,69,96,0.15)",
    border: "1px solid rgba(233,69,96,0.35)",
    color: "#e94560",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    padding: "5px 14px",
    borderRadius: 99,
    marginBottom: 20,
  },
  bigEmoji: {
    fontSize: "3.8rem",
    lineHeight: 1,
    marginBottom: 16,
    filter: "drop-shadow(0 0 20px rgba(233,69,96,0.35))",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 900,
    color: "#ffffff",
    lineHeight: 1.3,
    marginBottom: 14,
  },
  accent: {
    color: "#e94560",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#8899aa",
    lineHeight: 1.7,
    marginBottom: 28,
    maxWidth: 300,
  },
  meta: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    marginBottom: 32,
  },
  metaItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  metaVal: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#ffffff",
  },
  metaLbl: {
    fontSize: "0.68rem",
    color: "#8899aa",
    letterSpacing: "0.04em",
  },
  metaDivider: {
    width: 1,
    height: 32,
    background: "rgba(255,255,255,0.1)",
  },
  cta: {
    display: "block",
    width: "100%",
    padding: "18px",
    background: "linear-gradient(135deg,#e94560,#c73652)",
    border: "none",
    borderRadius: 16,
    color: "#ffffff",
    fontFamily: "inherit",
    fontSize: "1.05rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 24px rgba(233,69,96,0.35)",
    marginBottom: 24,
    letterSpacing: "0.02em",
  },
  typeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    width: "100%",
  },
  typeChip: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: "12px 10px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  typeEmoji: {
    fontSize: "1.5rem",
  },
  typeChipName: {
    fontSize: "0.76rem",
    color: "#8899aa",
  },
};
