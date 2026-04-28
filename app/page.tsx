"use client";

import { useState } from "react";
import { AnalyzeForm } from "@/components/analyze-form";
import { ResultsPanel } from "@/components/results-panel";
import { AnalyzeResponse } from "@/types/analysis";

export default function HomePage() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  return (
    <main className="min-h-screen bg-hero-grid text-zinc-100">
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-20">
        <header className="mb-12">
          <p className="mb-4 inline-flex rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs text-neon">
            AI Coding Cost Advisor · MVP
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
            프로젝트 설명만 입력하면
            <br />
            가장 합리적인 AI 코딩 비용을 추천합니다.
          </h1>
          <p className="mt-5 max-w-2xl text-zinc-400">
            기능 추출, 토큰 범위 추정, API/구독형 비용 비교를 한 번에 처리해 의사결정을 빠르게 만듭니다.
          </p>
        </header>

        <section className="grid gap-8">
          <AnalyzeForm onResult={setResult} />
          {result ? (
            <ResultsPanel result={result} />
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-panel/40 p-6 text-sm text-zinc-500">
              분석 결과가 여기에 표시됩니다.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
