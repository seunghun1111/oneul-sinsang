"use client";
import { useState } from "react";
import type { CoffeeBrandSource, CoffeeSourceKind } from "@/data/coffee-sources";

const kindLabel: Record<CoffeeSourceKind, string> = { menu:"메뉴", md:"MD", news:"새소식", shop:"온라인몰" };
export function CoffeeSourceDirectory({ sources }: { sources: CoffeeBrandSource[] }) {
  const [view, setView] = useState<"card" | "list">("list");
  return <section className="source-directory" id="coffee-sources" aria-labelledby="coffee-sources-title">
    <div className="catalog-heading"><div><p className="section-kicker">COFFEE WATCHLIST</p><h2 id="coffee-sources-title">커피 브랜드 수집 경로</h2><p>메뉴·MD·공식 소식에서 현재 판매 중인 신상품을 확인합니다.</p></div><span className="result-count">{sources.length}개 브랜드</span></div>
    <div className="source-toolbar"><span>공식 발표와 공식 상품 목록을 우선 확인합니다</span><div className="view-options" aria-label="수집 경로 표시 방식"><button type="button" className={view === "card" ? "selected" : ""} aria-pressed={view === "card"} onClick={() => setView("card")}>카드</button><button type="button" className={view === "list" ? "selected" : ""} aria-pressed={view === "list"} onClick={() => setView("list")}>리스트</button></div></div>
    <div className={`source-grid source-${view}`}>{sources.map(source => <article key={source.id} className="source-card"><div><span className="source-status">수집 대상</span><h3>{source.brand}</h3><p>{source.note}</p></div><div className="source-links">{source.channels.map(channel => <a key={`${channel.kind}-${channel.url}`} href={channel.url} target="_blank" rel="noopener noreferrer"><span>{kindLabel[channel.kind]}</span>{channel.label}</a>)}</div></article>)}</div>
  </section>;
}
