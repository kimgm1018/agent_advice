import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Coding Cost Recommender",
  description: "프로젝트 설명만으로 AI 코딩 비용을 예측하고 추천을 제공합니다."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
