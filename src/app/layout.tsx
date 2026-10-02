import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘신상 — 화면 미리 보기",
  description: "예시 상품으로 오늘신상의 상품 탐색 화면을 미리 살펴보세요. 표시된 상품 정보는 실제 출시 정보가 아닙니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body>{children}</body>
    </html>
  );
}
