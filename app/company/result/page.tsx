"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { RESULTS, ResultType } from "../quiz/questions";
import { Sparkles, Share2, RotateCcw } from "lucide-react";
import quizStyles from "../quiz/Quiz.module.css";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<{ title: string; desc: string; emoji: string } | null>(null);

  useEffect(() => {
    const typeQuery = searchParams?.get("type") as ResultType;
    if (typeQuery && RESULTS[typeQuery]) {
      setResult(RESULTS[typeQuery]);
    } else {
      router.replace("/company");
    }
  }, [searchParams, router]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: "AI Company 생존 테스트 결과",
        text: `나의 직장 생존 유형은 [${result?.title}] 입니다! 너의 유형도 알아보세요.`,
        url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url)
        .then(() => alert("결과 링크가 클립보드에 복사되었습니다!"))
        .catch(() => alert("링크 복사에 실패했습니다."));
    }
  };

  const handleRetry = () => {
    router.push("/company/quiz");
  };

  if (!result) return null;

  return (
    <div className={quizStyles.quizApp}>
      <header className={quizStyles.quizHeader}>
        <div className={quizStyles.quizBrand}>
          <span className={quizStyles.brandIcon}><Sparkles size={16} /></span>
          테스트 결과
        </div>
      </header>

      <main className={quizStyles.resultMain}>
        <div className={quizStyles.resultCard}>
          <div className={quizStyles.resultEmoji}>{result.emoji}</div>
          <h1 className={quizStyles.resultTitle}>{result.title}</h1>
          <p className={quizStyles.resultDesc}>{result.desc}</p>
        </div>

        <div className={quizStyles.actionGroup}>
          <button className={quizStyles.shareBtn} onClick={handleShare}>
            <Share2 size={18} />
            친구에게 결과 공유하기
          </button>
          <button className={quizStyles.retryBtn} onClick={handleRetry}>
            <RotateCcw size={18} />
            테스트 다시하기
          </button>
        </div>
      </main>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className={quizStyles.quizApp} />}>
      <ResultContent />
    </Suspense>
  );
}
