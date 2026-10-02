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
  const filtered = useMemo(() => products.filter((product) => category === "all" || product.category === category).toSorted((a, b) => {
    const left = sort === "release" ? a.releaseDate ?? "" : a.firstDetectedAt;
    const right = sort === "release" ? b.releaseDate ?? "" : b.firstDetectedAt;
    return right.localeCompare(left);
  }), [category, products, sort]);

  return <section className="catalog" aria-labelledby="catalog-title">
    <div className="catalog-heading"><div><p className="section-kicker">OFFICIAL RELEASES</p><h2 id="catalog-title">공식 신상품 둘러보기</h2></div><span className="result-count" aria-live="polite">{filtered.length}개의 신상품</span></div>
    <div className="filter-row" aria-label="카테고리 필터">{filters.map((filter) => <button type="button" key={filter.value} className={category === filter.value ? "filter-chip selected" : "filter-chip"} aria-pressed={category === filter.value} onClick={() => setCategory(filter.value)}>{filter.value !== "all" && categoryMeta[filter.value].emoji} {filter.label}</button>)}</div>
    <div className="sort-row"><span>공식 발표를 기준으로 정리했습니다</span><div className="sort-options" aria-label="정렬"><button type="button" className={sort === "release" ? "selected" : ""} aria-pressed={sort === "release"} onClick={() => setSort("release")}>공식 발표일순</button><button type="button" className={sort === "detected" ? "selected" : ""} aria-pressed={sort === "detected"} onClick={() => setSort("detected")}>발견일순</button></div></div>
    {filtered.length === 0 ? <p className="empty-products">확인된 신상품이 아직 없습니다. 다음 자동 수집 후 갱신됩니다.</p> : <div className="product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} offers={offers.filter(offer => offer.productSlug === product.id)} />)}</div>}
  </section>;
}
