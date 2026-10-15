import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "신상발견 — 브랜드가 소개하는 NEW를 한곳에서",
  description: "브랜드 공식 사이트의 NEW 상품을 발견하고 모읍니다. 최초 확인일과 출시일을 구분하며 메뉴·식품·MD를 함께 소개합니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
