"use client";
import { useState } from "react";
import type { CoffeeBrandSource, CoffeeSourceKind } from "@/data/coffee-sources";
import report from "@/data/collection-policy-status.json";
import {policyLabels,sourcePolicySummary} from "@/lib/source-policy";
import {SourcePolicyBadge,usePolicyClock} from "./source-policy-badge";

const kindLabel: Record<CoffeeSourceKind, string> = { menu:"메뉴", md:"MD", news:"새소식", shop:"온라인몰" };
const policyCheckedAt=new Date(report.checkedAt).toLocaleString("ko-KR",{timeZone:"Asia/Seoul",hour12:false});
export function CoffeeSourceDirectory({ sources }: { sources: CoffeeBrandSource[] }) {
  const [view, setView] = useState<"card" | "list">("list");
  const now=usePolicyClock();
  return <section className="source-directory" id="coffee-sources" aria-labelledby="coffee-sources-title">
    <div className="catalog-heading"><div><p className="section-kicker">COFFEE WATCHLIST</p><h2 id="coffee-sources-title">커피 브랜드 수집 경로</h2><p>등록된 메뉴·MD·공식 소식 경로입니다. 경로 등록은 전체 수집 성공이나 현재 판매를 보장하지 않습니다.</p></div><span className="result-count">{sources.length}개 브랜드</span></div>
    <div className="source-toolbar"><span>공식 발표와 공식 상품 목록을 우선 확인합니다</span><div className="view-options" aria-label="수집 경로 표시 방식"><button type="button" className={view === "card" ? "selected" : ""} aria-pressed={view === "card"} onClick={() => setView("card")}>카드</button><button type="button" className={view === "list" ? "selected" : ""} aria-pressed={view === "list"} onClick={() => setView("list")}>리스트</button></div></div>
    <p className="policy-help">아래 표시는 robots 정책 점검 결과이며 실제 수집 성공·NEW 확인 여부와는 별개입니다. 정책 확인 {policyCheckedAt} (한국 시간).</p>
    <div className={`source-grid source-${view}`}>{sources.map(source => {
      const state=now?sourcePolicySummary(report,source.brand,source.channels.filter(c=>c.kind!=="news").map(c=>c.url),now):"unknown";
      return <article key={source.id} className="source-card"><div><span className={`source-status policy-${state}`}>{now?policyLabels[state]:"정책 확인 중"}</span><h3>{source.brand}</h3><p>{source.note}</p></div><div className="source-links">{source.channels.map(channel => <a key={`${channel.kind}-${channel.url}`} href={channel.url} target="_blank" rel="noopener noreferrer"><span>{kindLabel[channel.kind]}</span>{channel.label}<small><SourcePolicyBadge brand={source.brand} url={channel.url}/></small></a>)}</div></article>;
    })}</div>
  </section>;
}
