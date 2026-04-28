"use client";

import { AnalyzeResponse } from "@/types/analysis";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface ResultsPanelProps {
  result: AnalyzeResponse;
}

const COLORS = ["#7AF6FF", "#A88BFF", "#6EE7B7", "#F9A8D4", "#FDE047", "#94A3B8"];

export function ResultsPanel({ result }: ResultsPanelProps) {
  const topThree = result.recommendations.slice(0, 3);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="예상 토큰 범위" value={`${formatToken(result.tokens[0])} ~ ${formatToken(result.tokens[1])}`} />
        <MetricCard title="프로젝트 유형" value={result.projectType} />
        <MetricCard title="프로젝트 복잡도" value={`${result.complexityScore.toFixed(1)} / 100`} />
      </div>
      <p className="text-xs text-zinc-500">
        가격 기준일: {result.pricingEffectiveDate} (USD, 월 결제/표준 API 기준) · 추출 기능: {result.extractedFeatures.join(", ")}
      </p>
      <p className="rounded-xl border border-line bg-ink/70 px-3 py-2 text-xs text-zinc-400">
        LLM 분석 근거: {result.projectAnalysisRationale}
      </p>
      <div className="rounded-2xl border border-line bg-panel/70 p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-200">요구사항 유닛 분석</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {result.requirements.slice(0, 8).map((req) => (
            <div key={req.name} className="rounded-lg border border-line bg-ink/60 p-3">
              <p className="text-sm font-semibold text-zinc-100">{req.name}</p>
              <p className="mt-1 text-xs text-zinc-400">{req.description}</p>
              <p className="mt-1 text-xs text-zinc-500">
                난이도 {req.complexity} · in {formatToken(req.estimatedInputTokens)} · out {formatToken(req.estimatedOutputTokens)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-panel/80 p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-200">Agent 월비용 비교 (적합도 정렬 기준)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={result.recommendations}>
              <XAxis dataKey="name" tick={{ fill: "#A1A1AA", fontSize: 11 }} interval={0} angle={-15} height={65} />
              <YAxis tick={{ fill: "#A1A1AA", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#0B0E14",
                  border: "1px solid #2C3142",
                  borderRadius: "10px",
                  color: "#E4E4E7"
                }}
              />
              <Bar dataKey="monthlyCostUsd">
                {result.recommendations.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {topThree.map((item, idx) => (
          <article key={item.name} className="rounded-2xl border border-line bg-panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">추천 #{idx + 1}</span>
              {idx === 0 && <span className="rounded-full border border-neon/70 px-2 py-1 text-xs text-neon">BEST FIT</span>}
            </div>
            <h4 className="text-base font-semibold text-zinc-100">{item.name}</h4>
            <p className="mt-2 text-xs uppercase tracking-wide text-zinc-400">{item.mode} · confidence {item.confidence}</p>
            <p className="mt-2 text-xl font-bold text-violet">적합도 {item.fitScore.toFixed(1)} / 10</p>
            <p className="mt-2 text-2xl font-bold text-neon">${item.monthlyCostUsd.toFixed(2)}</p>
            <p className="mt-2 text-sm text-zinc-400">{item.reason}</p>
            <p className="mt-3 text-xs text-zinc-500">
              근거 점수: 전달적합 {item.scoreBreakdown.deliveryFit} · 자율성 {item.scoreBreakdown.autonomy} · 문맥처리{" "}
              {item.scoreBreakdown.contextHandling} · 비용안정성 {item.scoreBreakdown.costPredictability}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              비용 구성: 구현 API ${item.costBreakdown.baseBuildCostUsd.toFixed(2)} + Agent 오버헤드 API $
              {item.costBreakdown.agentOverheadCostUsd.toFixed(2)} + 구독 ${item.costBreakdown.subscriptionCostUsd.toFixed(2)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-2xl border border-line bg-panel p-4">
      <p className="text-xs text-zinc-400">{title}</p>
      <p className="mt-2 text-sm font-semibold text-zinc-100">{value}</p>
    </article>
  );
}

function formatToken(token: number) {
  if (token >= 1_000_000) {
    return `${(token / 1_000_000).toFixed(1)}M`;
  }

  return `${Math.round(token / 1000)}K`;
}
