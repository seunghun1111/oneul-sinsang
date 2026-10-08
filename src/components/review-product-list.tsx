"use client";

import { useMemo, useSyncExternalStore } from "react";
import { categoryMeta } from "@/lib/product-meta";
import type { Product } from "@/types/product";

function pendingReason(product: Product) {
  return product.releaseDate
    ? "공식 사이트의 최근 변경에서 자동 감지됐지만, 변경일이 실제 출시일과 다를 수 있어 NEW 표시와 판매 여부 확인이 필요합니다."
    : "공식 메뉴·MD 목록에서 자동 감지됐지만 개별 출시일이 없어, 최근 한 달 신상 여부와 현재 판매 여부 확인이 필요합니다.";
}

function reviewUrl(product: Product, decision: "승인" | "거절") {
  const params = new URLSearchParams({
    title: `[상품 ${decision}] ${product.id}`,
    body: `상품 ID: \`${product.id}\`\n브랜드: ${product.brand}\n상품명: ${product.name}\n\n공식 출처를 확인한 뒤 이 이슈를 등록하면 자동 검수 워크플로가 실행됩니다.`,
  });
  return `https://github.com/seunghun1111/oneul-sinsang/issues/new?${params}`;
}

function productCategory(product: Product) {
  return product.subCategory || categoryMeta[product.category].label;
}

export function ReviewProductList({ products }: { products: Product[] }) {
  const categories = useMemo(() => [...new Set(products.map(productCategory))].toSorted(), [products]);
  const search = useSyncExternalStore(
    callback => { window.addEventListener("popstate", callback); return () => window.removeEventListener("popstate", callback); },
    () => window.location.search,
    () => "",
  );
  const selected = new URLSearchParams(search).get("category");
  const category = selected && categories.includes(selected) ? selected : "all";

  const filtered = useMemo(
    () => category === "all" ? products : products.filter(product => productCategory(product) === category),
    [category, products],
  );

  function selectCategory(nextCategory: string) {
    const url = new URL(window.location.href);
    if (nextCategory === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", nextCategory);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return <>
    <section className="review-category-filter" aria-label="검수 상품 카테고리 필터">
      <div className="review-filter-heading"><strong>카테고리별 보기</strong><span aria-live="polite">{filtered.length}개 상품</span></div>
      <div className="filter-row">
        <button type="button" className={category === "all" ? "filter-chip selected" : "filter-chip"} aria-pressed={category === "all"} onClick={() => selectCategory("all")}>전체 <small>{products.length}</small></button>
        {categories.map(item => {
          const count = products.filter(product => productCategory(product) === item).length;
          return <button type="button" key={item} className={category === item ? "filter-chip selected" : "filter-chip"} aria-pressed={category === item} onClick={() => selectCategory(item)}>{item} <small>{count}</small></button>;
        })}
      </div>
    </section>
    <section className="review-list" aria-label="자동 수집 상품">
      {filtered.length === 0 ? <p className="empty-products">선택한 카테고리에 검수 상품이 없습니다.</p> : filtered.map(product => <article key={product.id}><div><span className={`review-status status-${product.reviewStatus === "pending" ? "unknown" : product.reviewStatus === "rejected" ? "ended" : product.availabilityStatus}`}>{product.reviewStatus === "pending" ? "검수 대기" : product.reviewStatus === "rejected" ? "검수 제외" : product.availabilityStatus === "ended" ? "판매 종료" : "승인됨"}</span><strong>{product.brand}</strong><span className="review-category-label">{productCategory(product)}</span><h2>{product.name}</h2></div><div><p>{product.reviewStatus === "pending" ? pendingReason(product) : product.availabilityReason ?? "공식 상품 목록에서 확인"}</p><time dateTime={product.lastCheckedAt}>확인 {product.lastCheckedAt.slice(0,10).replaceAll("-", ".")}</time><a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">공식 출처</a>{product.reviewStatus === "pending" && <span className="review-actions"><a href={reviewUrl(product, "승인")} target="_blank" rel="noopener noreferrer">GitHub에서 승인</a><a href={reviewUrl(product, "거절")} target="_blank" rel="noopener noreferrer" className="reject">제외</a></span>}</div></article>)}
    </section>
  </>;
}
