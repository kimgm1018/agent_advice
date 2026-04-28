"use client";

import { FormEvent, useState } from "react";
import { AnalyzeResponse } from "@/types/analysis";

interface AnalyzeFormProps {
  onResult: (result: AnalyzeResponse) => void;
}

const ANALYZE_ENDPOINT = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"}/api/analyze`;

export function AnalyzeForm({ onResult }: AnalyzeFormProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!input.trim()) {
      setError("프로젝트 설명을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(ANALYZE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input })
      });

      if (!response.ok) {
        throw new Error("분석 요청에 실패했습니다.");
      }

      const data = (await response.json()) as AnalyzeResponse;
      onResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-panel/80 p-6 shadow-glow backdrop-blur">
      <label className="mb-3 block text-sm font-medium text-zinc-300">프로젝트 설명</label>
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={6}
        placeholder="예) 로그인/관리자/결제가 있는 AI 기반 팀 협업 SaaS를 만들고 싶어요."
        className="w-full rounded-xl border border-line bg-ink/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-neon"
      />
      <div className="mt-4 flex items-center justify-between">
        {error ? <p className="text-sm text-rose-300">{error}</p> : <span className="text-xs text-zinc-500">응답 목표: 5초 이내</span>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-neon px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "분석 중..." : "비용 분석 시작"}
        </button>
      </div>
    </form>
  );
}
