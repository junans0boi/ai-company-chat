"use client";

import { useRouter } from "next/navigation";

export default function CompanyLandingPage() {
  const router = useRouter();
  
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
        <h1 style={{ fontSize: "36px", marginBottom: "16px", wordBreak: "keep-all" }}>
          오늘의 회사 생존 테스트
        </h1>
        <p style={{ fontSize: "18px", color: "#CCCCCC", wordBreak: "keep-all", marginBottom: "40px" }}>
          나의 생존 유형은 무엇일까?<br/>
          간단한 테스트로 알아보세요.
        </p>
        
        <button
          onClick={() => router.push("/company/quiz")}
          style={{
            backgroundColor: "#C8FF00",
            color: "#0D0D0D",
            border: "none",
            padding: "20px 48px",
            borderRadius: "99px",
            fontSize: "20px",
            cursor: "pointer",
            fontWeight: "bold",
            width: "100%",
            maxWidth: "320px",
            boxShadow: "0 4px 12px rgba(200, 255, 0, 0.2)"
          }}
        >
          테스트 시작하기
        </button>
      </div>
    </div>
  );
}
