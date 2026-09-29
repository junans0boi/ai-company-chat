"use client";

import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import quizStyles from "./quiz/Quiz.module.css";
import pageStyles from "./CompanyLanding.module.css";

export default function CompanyLandingPage() {
  const router = useRouter();

  const handleStart = () => {
    router.push("/company/quiz");
  };

  return (
    <div className={quizStyles.quizApp}>
      <header className={quizStyles.quizHeader}>
        <div className={quizStyles.quizBrand}>
          <span className={quizStyles.brandIcon}><Sparkles size={16} /></span>
          AI Company
        </div>
      </header>

      <main className={pageStyles.landingMain}>
        <div className={pageStyles.heroSection}>
          <div className={pageStyles.kicker}>Company Survival Test</div>
          <h1 className={pageStyles.title}>당신은 어떤 성향의<br />직장인인가요?</h1>
          <p className={pageStyles.subtitle}>
            위기의 순간, 가장 빛나는 당신의 무기를 테스트해보세요.
          </p>
        </div>

        <button className={pageStyles.startBtn} onClick={handleStart}>
          테스트 시작하기 <ArrowRight size={20} />
        </button>
      </main>
    </div>
  );
}
