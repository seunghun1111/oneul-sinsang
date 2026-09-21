"use client";

import { useMemo, useState } from "react";
import { categoryMeta } from "@/lib/product-meta";
import type { Product, ProductCategory } from "@/types/product";
import { ProductCard } from "./product-card";

const filters: Array<{ value: ProductCategory | "all"; label: string }> = [
  { value: "all", label: "전체" }, { value: "convenience", label: "편의점" }, { value: "cafe", label: "카페" }, { value: "drink", label: "음료" }, { value: "ramen", label: "라면" }, { value: "dessert", label: "디저트" }, { value: "icecream", label: "아이스크림" },
];

export function ProductExplorer({ products }: { products: Product[] }) {
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [sort, setSort] = useState<"release" | "detected">("release");
  const filtered = useMemo(() => products.filter((product) => category === "all" || product.category === category).toSorted((a, b) => {
    const left = sort === "release" ? a.releaseDate ?? "" : a.firstDetectedAt;
    const right = sort === "release" ? b.releaseDate ?? "" : b.firstDetectedAt;
    return right.localeCompare(left);
  }), [category, products, sort]);

  return <section className="catalog" aria-labelledby="catalog-title">
    <div className="catalog-heading"><div><p className="section-kicker">JUST DROPPED</p><h2 id="catalog-title">방금 나온 신상</h2></div><span className="result-count">{filtered.length}개의 신상</span></div>
    <div className="filter-row" aria-label="카테고리 필터">{filters.map((filter) => <button type="button" key={filter.value} className={category === filter.value ? "filter-chip selected" : "filter-chip"} onClick={() => setCategory(filter.value)}>{filter.value !== "all" && categoryMeta[filter.value].emoji} {filter.label}</button>)}</div>
    <div className="sort-row"><span>새로운 맛을 발견해 보세요</span><div className="sort-options" aria-label="정렬"><button type="button" className={sort === "release" ? "selected" : ""} onClick={() => setSort("release")}>최신 출시순</button><button type="button" className={sort === "detected" ? "selected" : ""} onClick={() => setSort("detected")}>최근 발견순</button></div></div>
    <div className="product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div>
  </section>;
}

