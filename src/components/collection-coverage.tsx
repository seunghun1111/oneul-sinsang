"use client";
import Link from "next/link";
import {useId} from "react";
import health from "@/data/collection-health.json";
import {coffeeBrandSources} from "@/data/coffee-sources";
import {chickenBrandSources,icecreamBrandSources} from "@/data/food-brand-sources";
import {coverageSummary,type CoverageProduct} from "@/lib/collection-coverage";
import {usePolicyClock} from "./source-policy-badge";
export function CollectionCoverage({groups,products=[],additionalCategory}:{groups?:string[];products?:CoverageProduct[];additionalCategory?:"chicken"|"icecream"}){
 const id=useId(),clock=usePolicyClock(),now=clock?.getTime()??Date.parse(health.generatedAt);
 const additional=additionalCategory==="chicken"?chickenBrandSources:icecreamBrandSources;
 const rows=health.rows.filter(row=>(!groups||groups.includes(row.group))&&(!additionalCategory||row.group!=="additional"||additional.some(source=>source.brand===row.brand)));
 return <section className="collection-coverage" aria-labelledby={`${id}-heading`}>
  <h2 id={`${id}-heading`}>브랜드별 수집 범위·상태</h2><p>등록된 경로가 전체 메뉴 수집을 보장하지는 않습니다. 음료·푸드·MD 중 현재 공개된 분류와 수집 상태를 구분해 확인하세요.</p>
  <details><summary>{rows.length}개 수집 항목 보기</summary><p>상태는 브랜드 단위입니다. 실패·미확인·미지원은 상품이 없다는 뜻이 아닙니다. 상품과 경로 정보는 마지막 배포 시점 기준입니다.</p>
   <div className="coverage-grid">{rows.map(row=>{
    const state=coverageSummary(row,products,now),source=row.group==="coffee"?coffeeBrandSources.find(s=>s.brand===row.brand):undefined;
    const kinds=source?.channels.filter(c=>c.kind!=="news").map(c=>c.kind);
    const registered=kinds?[...new Set(kinds.map(kind=>kind==="menu"?"메뉴 경로":kind==="md"?"MD 전용 경로":"공식몰 경로 (메뉴·MD 범위 별도 확인)"))].join(" · "):row.group==="press"?"공식 발표 경로 (전체 상품 목록 아님)":row.group==="cu"?"간편식사·즉석조리·과자·아이스크림·식품·음료·생활용품":row.group==="convenience"?"공식 NEW 목록 (세부 상품군 범위 별도 확인)":"공식 신메뉴·NEW 경로 (전체 메뉴·MD 보장 아님)";
    const checked=Date.parse(row.checkedAt??""),date=Number.isFinite(checked)&&checked<=now?new Date(checked+9*3600000).toISOString().slice(0,16).replace("T"," ")+" KST":"미확인";
    return <article key={row.id}><h3>{row.brand}</h3><small>{row.groupLabel}</small><strong className={`coverage-${state.state}`}>{state.label}</strong><dl><div><dt>등록 범위</dt><dd>{registered}</dd></div><div><dt>현재 공개</dt><dd>{state.publishedCount}개 · {state.observed.length?state.observed.join(" / "):"세부 분류 없음"}</dd></div><div><dt>수집 시도</dt><dd>{date} (상품별 정상 확인일과 별도)</dd></div><div><dt>범위 한계</dt><dd>{source?.note??"목록에 없는 상품·MD까지 수집했다고 판단하지 않습니다."}{source&&!kinds?.includes("md")&&" · MD 전용 경로 미등록 (메뉴 내 MD 지원 범위도 별도 확인 필요)"}{source&&!kinds?.includes("menu")&&" · 메뉴 전용 경로 미등록"}</dd></div></dl></article>;
   })}</div>
  </details>{groups&&<Link href="/sources">전체 브랜드 수집 범위 보기 →</Link>}
 </section>;
}
