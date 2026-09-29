"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, ResultType } from "./questions";
import { Sparkles, ChevronRight } from "lucide-react";
import styles from "../../CompanyConsole.module.css";
import quizStyles from "./Quiz.module.css";

export default function QuizPage() {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scores, setScores] = useState<Record<ResultType, number>>({
    pioneer: 0,
    optimizer: 0,
    connector: 0,
    guardian: 0,
  });

  const question = QUESTIONS[currentIdx];
  const isFinished = currentIdx >= QUESTIONS.length;

  const handleChoice = (weight: Record<ResultType, number>) => {
    const nextScores = { ...scores };
    (Object.keys(weight) as ResultType[]).forEach((key) => {
      nextScores[key] += weight[key];
    });

    setScores(nextScores);

    if (currentIdx + 1 < QUESTIONS.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // Find highest score
      let maxScore = -1;
      let topType: ResultType = "pioneer";
      (Object.keys(nextScores) as ResultType[]).forEach((key) => {
        if (nextScores[key] > maxScore) {
          maxScore = nextScores[key];
          topType = key;
        }
      });
      router.push(`/company/result?type=${topType}`);
    }
  };

  if (isFinished || !question) return null; // Wait for navigation

  return (
    <div className={quizStyles.quizApp}>
      <header className={quizStyles.quizHeader}>
        <div className={quizStyles.quizBrand}>
          <span className={quizStyles.brandIcon}><Sparkles size={16} /></span>
          AI Company 생존 테스트
        </div>
        <div className={quizStyles.progressIndicator}>
          <span>{currentIdx + 1}</span> / {QUESTIONS.length}
        </div>
      </header>

      <div className={quizStyles.progressBar}>
        <div 
          className={quizStyles.progressFill} 
          style={{ width: `${((currentIdx + 1) / QUESTIONS.length) * 100}%` }} 
        />
      </div>

      <main className={quizStyles.quizMain}>
        <h1 className={quizStyles.questionText}>{question.text}</h1>
        <div className={quizStyles.choiceGrid}>
          {question.choices.map((c) => (
            <button 
              key={c.id} 
              className={quizStyles.choiceBtn} 
              onClick={() => handleChoice(c.weight)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
