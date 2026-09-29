"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, ResultType } from "./questions";

export default function QuizPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<Record<ResultType, number>>({
    pioneer: 0,
    optimizer: 0,
    connector: 0,
    guardian: 0,
  });

  const handleChoice = (weight: Record<ResultType, number>) => {
    const newScores = { ...scores };
    (Object.keys(weight) as ResultType[]).forEach((key) => {
      newScores[key] += weight[key];
    });

    if (currentIndex < QUESTIONS.length - 1) {
      setScores(newScores);
      setCurrentIndex((prev) => prev + 1);
    } else {
      let topType = "pioneer" as ResultType;
      let maxScore = -1;
      (Object.keys(newScores) as ResultType[]).forEach((key) => {
        if (newScores[key] > maxScore) {
          maxScore = newScores[key];
          topType = key;
        }
      });
      router.push(`/company/result?type=${topType}`);
    }
  };

  const question = QUESTIONS[currentIndex];
  // 0D0D0D base, C8FF00 lime green accent based on Nuhoxy MZ principles
  return (
    <div style={{
      backgroundColor: "#0D0D0D",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      color: "white",
      fontFamily: "'Pretendard ExtraBold', sans-serif"
    }}>
      <header style={{ padding: "16px", display: "flex", alignItems: "center", borderBottom: "1px solid #333" }}>
        <h1 style={{ margin: 0, fontSize: "16px", flex: 1 }}>회사 생존 테스트</h1>
        <div style={{ fontSize: "14px", fontFamily: "'Space Grotesk', sans-serif" }}>
          {currentIndex + 1} / {QUESTIONS.length}
        </div>
      </header>
      
      {/* Progress Bar */}
      <div style={{ width: "100%", height: "4px", backgroundColor: "#333" }}>
        <div style={{
          width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%`,
          height: "100%",
          backgroundColor: "#C8FF00",
          transition: "width 0.3s ease-in-out"
        }} />
      </div>

      <main style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontSize: "24px", wordBreak: "keep-all", lineHeight: 1.4, marginBottom: "32px", flex: 1 }}>
          {question.text}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {question.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice.weight)}
              style={{
                backgroundColor: "#1A1A1A",
                color: "white",
                border: "1px solid #333",
                padding: "20px",
                borderRadius: "12px",
                textAlign: "left",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "block",
                width: "100%"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#C8FF00";
                e.currentTarget.style.color = "#C8FF00";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#333";
                e.currentTarget.style.color = "white";
              }}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}