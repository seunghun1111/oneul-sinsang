"use client";
import { useState } from "react";
import type { CoffeeBrandSource, CoffeeSourceKind } from "@/data/coffee-sources";

const kindLabel: Record<CoffeeSourceKind, string> = { menu:"메뉴", md:"MD", news:"새소식", shop:"온라인몰" };
export function CoffeeSourceDirectory({ sources }: { sources: CoffeeBrandSource[] }) {
  const [view, setView] = useState<"card" | "list">("card");
  const webPriceCount = sources.filter(source => source.priceAccess === "web").length;
  return <section className="source-directory" id="coffee-sources" aria-labelledby="coffee-sources-title">
    <div className="catalog-heading"><div><p className="section-kicker">COFFEE WATCHLIST</p><h2 id="coffee-sources-title">커피 브랜드 수집 경로</h2><p>신상품 발견 경로와 가격 확인 경로를 분리해 관리합니다.</p></div><span className="result-count">{sources.length}개 브랜드 · 웹 가격 {webPriceCount}곳</span></div>
    <div className="source-toolbar"><span>가격은 공식몰·공식 주문 채널에서 확인된 경우만 사용합니다</span><div className="view-options" aria-label="수집 경로 표시 방식"><button type="button" className={view === "card" ? "selected" : ""} aria-pressed={view === "card"} onClick={() => setView("card")}>카드</button><button type="button" className={view === "list" ? "selected" : ""} aria-pressed={view === "list"} onClick={() => setView("list")}>리스트</button></div></div>
    <div className={`source-grid source-${view}`}>{sources.map(source => <article key={source.id} className="source-card"><div><span className={`source-status price-${source.priceAccess}`}>{source.priceAccess === "web" ? "웹 가격 확인" : source.priceAccess === "app" ? "앱 가격 확인" : "가격 미공개"}</span><h3>{source.brand}</h3><p>{source.priceNote}</p></div><div className="source-links">{source.channels.map(channel => <a key={`${channel.kind}-${channel.url}`} href={channel.url} target="_blank" rel="noopener noreferrer"><span>{channel.providesPrice ? "가격" : kindLabel[channel.kind]}</span>{channel.label}{channel.priceScope && <small>{channel.priceScope}</small>}</a>)}</div></article>)}</div>
  </section>;
}
