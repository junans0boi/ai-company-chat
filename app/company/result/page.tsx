"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { RESULTS, ResultType } from "../quiz/questions";
import { Suspense } from "react";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const typeParam = searchParams.get("type");
  const type = (typeParam && RESULTS[typeParam as ResultType]) ? (typeParam as ResultType) : "pioneer";
  const result = RESULTS[type];

  const handleShare = async () => {
    const shareData = {
      title: "회사 생존 테스트 결과",
      text: `나는 ${result.title}입니다! 당신의 유형도 알아보세요.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("공유 실패:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("결과 링크가 클립보드에 복사되었습니다!");
      } catch (err) {
        console.error("클립보드 복사 실패:", err);
      }
    }
  };

  return (
    <div style={{
      backgroundColor: "#0D0D0D",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      color: "white",
      fontFamily: "'Pretendard ExtraBold', sans-serif",
      padding: "24px"
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontSize: "72px", marginBottom: "16px" }}>
          {result.emoji}
        </div>
        <div style={{ color: "#C8FF00", fontSize: "14px", marginBottom: "8px" }}>
          당신의 생존 유형은
        </div>
        <h1 style={{ fontSize: "32px", marginBottom: "24px", wordBreak: "keep-all" }}>
          {result.title}
        </h1>
        <p style={{ fontSize: "16px", lineHeight: 1.6, color: "#CCCCCC", wordBreak: "keep-all", backgroundColor: "#1A1A1A", padding: "24px", borderRadius: "16px" }}>
          {result.desc}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "32px" }}>
        <button
          onClick={handleShare}
          style={{
            backgroundColor: "#C8FF00",
            color: "#0D0D0D",
            border: "none",
            padding: "18px",
            borderRadius: "12px",
            fontSize: "18px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          결과 공유하기
        </button>
        <button
          onClick={() => router.push("/company/quiz")}
          style={{
            backgroundColor: "transparent",
            color: "white",
            border: "1px solid #333",
            padding: "18px",
            borderRadius: "12px",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          다시 테스트하기
        </button>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: "#0D0D0D", minHeight: "100vh", color: "white" }}>Loading...</div>}>
      <ResultContent />
    </Suspense>
  );
}