import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘신상 — 새로 나온 맛을 한눈에",
  description: "공식 발표 자료를 바탕으로 식품·음료 신상품을 찾아보는 서비스",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
