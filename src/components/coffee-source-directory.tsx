"use client";
import { useState } from "react";
import type { CoffeeBrandSource, CoffeeSourceKind } from "@/data/coffee-sources";

const kindLabel: Record<CoffeeSourceKind, string> = { menu:"메뉴", md:"MD", news:"새소식", shop:"온라인몰" };
export function CoffeeSourceDirectory({ sources }: { sources: CoffeeBrandSource[] }) {
  const [view, setView] = useState<"card" | "list">("card");
  return <section className="source-directory" id="coffee-sources" aria-labelledby="coffee-sources-title">
    <div className="catalog-heading"><div><p className="section-kicker">COFFEE WATCHLIST</p><h2 id="coffee-sources-title">커피 브랜드 수집 경로</h2><p>상품이 아직 등록되지 않은 브랜드도 메뉴·MD 공식 경로를 계속 확인합니다.</p></div><span className="result-count">{sources.length}개 브랜드</span></div>
    <div className="source-toolbar"><span>메뉴와 MD 경로를 분리해 관리합니다</span><div className="view-options" aria-label="수집 경로 표시 방식"><button type="button" className={view === "card" ? "selected" : ""} aria-pressed={view === "card"} onClick={() => setView("card")}>카드</button><button type="button" className={view === "list" ? "selected" : ""} aria-pressed={view === "list"} onClick={() => setView("list")}>리스트</button></div></div>
    <div className={`source-grid source-${view}`}>{sources.map(source => <article key={source.id} className="source-card"><div><span className="source-status">수집 대상</span><h3>{source.brand}</h3><p>{source.note}</p></div><div className="source-links">{source.channels.map(channel => <a key={`${channel.kind}-${channel.url}`} href={channel.url} target="_blank" rel="noopener noreferrer"><span>{kindLabel[channel.kind]}</span>{channel.label}</a>)}</div></article>)}</div>
  </section>;
}
