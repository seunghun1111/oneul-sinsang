"use client";

import { useMemo, useState } from "react";
import { categoryMeta } from "@/lib/product-meta";
import type { Product, ProductCategory } from "@/types/product";
import type { Offer } from "@/types/offer";
import { ProductCard } from "./product-card";

const filters: Array<{ value: ProductCategory | "all"; label: string }> = [
  { value: "all", label: "전체" }, { value: "convenience", label: "편의점" }, { value: "cafe", label: "카페" }, { value: "drink", label: "음료" }, { value: "ramen", label: "라면" }, { value: "meal", label: "간편식" }, { value: "snack", label: "과자" }, { value: "dessert", label: "디저트" }, { value: "icecream", label: "아이스크림" }, { value: "etc", label: "기타" },
];

export function ProductExplorer({ products, offers }: { products: Product[]; offers: Offer[] }) {
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [sort, setSort] = useState<"release" | "detected">("release");
  const [view, setView] = useState<"card" | "list">("card");
  const filtered = useMemo(() => products.filter((product) => category === "all" || product.category === category).toSorted((a, b) => {
    const left = sort === "release" ? a.releaseDate ?? "" : a.firstDetectedAt;
    const right = sort === "release" ? b.releaseDate ?? "" : b.firstDetectedAt;
    return right.localeCompare(left);
  }), [category, products, sort]);

  return <section className="catalog" aria-labelledby="catalog-title">
    <div className="catalog-heading"><div><p className="section-kicker">ON SALE NOW</p><h2 id="catalog-title">지금 판매 중인 신상품</h2><p>최근 90일 이내 출시되고, 최근 14일 안에 판매가 확인된 상품만 보여드립니다.</p></div><span className="result-count" aria-live="polite">{filtered.length}개의 판매 중 신상</span></div>
    <div className="filter-row" aria-label="카테고리 필터">{filters.map((filter) => <button type="button" key={filter.value} className={category === filter.value ? "filter-chip selected" : "filter-chip"} aria-pressed={category === filter.value} onClick={() => setCategory(filter.value)}>{filter.value !== "all" && categoryMeta[filter.value].emoji} {filter.label}</button>)}</div>
    <div className="sort-row"><span>판매 여부가 확인된 상품만 정리했습니다</span><div className="catalog-controls"><div className="sort-options" aria-label="정렬"><button type="button" className={sort === "release" ? "selected" : ""} aria-pressed={sort === "release"} onClick={() => setSort("release")}>출시일순</button><button type="button" className={sort === "detected" ? "selected" : ""} aria-pressed={sort === "detected"} onClick={() => setSort("detected")}>판매 확인순</button></div><div className="view-options" aria-label="목록 표시 방식"><button type="button" className={view === "card" ? "selected" : ""} aria-pressed={view === "card"} onClick={() => setView("card")}>카드</button><button type="button" className={view === "list" ? "selected" : ""} aria-pressed={view === "list"} onClick={() => setView("list")}>리스트</button></div></div></div>
    {filtered.length === 0 ? <p className="empty-products">확인된 신상품이 아직 없습니다. 다음 자동 수집 후 갱신됩니다.</p> : <div className={`product-grid view-${view}`}>{filtered.map((product) => <ProductCard key={product.id} product={product} offers={offers.filter(offer => offer.productSlug === product.id)} />)}</div>}
  </section>;
}
