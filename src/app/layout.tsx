import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘신상 — 공식 출처 기반 신상품 목록",
  description: "브랜드 공식 발표와 공식 상품 목록에서 현재 판매가 확인된 신상품을 정리합니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
