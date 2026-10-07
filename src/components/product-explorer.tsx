"use client";

import { useMemo, useState } from "react";
import { categoryMeta } from "@/lib/product-meta";
import type { Product, ProductCategory } from "@/types/product";
import { ProductCard } from "./product-card";

const filters: Array<{ value: ProductCategory | "all"; label: string }> = [
  { value: "all", label: "전체" }, { value: "convenience", label: "편의점" }, { value: "cafe", label: "카페" }, { value: "burger", label: "햄버거" }, { value: "pizza", label: "피자" }, { value: "chicken", label: "치킨" }, { value: "drink", label: "음료" }, { value: "ramen", label: "라면" }, { value: "meal", label: "간편식" }, { value: "snack", label: "과자" }, { value: "dessert", label: "디저트" }, { value: "icecream", label: "아이스크림" }, { value: "etc", label: "기타" },
];

export function ProductExplorer({ products }: { products: Product[] }) {
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [brand, setBrand] = useState("all");
  const [subCategory, setSubCategory] = useState("all");
  const [sort, setSort] = useState<"release" | "detected">("release");
  const [view, setView] = useState<"card" | "list">("list");
  const brands = useMemo(() => category === "all" ? [] : [...new Set(products.filter(product => product.category === category).map(product => product.brand))].toSorted(), [category, products]);
  const subCategories = useMemo(() => category !== "convenience" ? [] : [...new Set(products.filter(product => product.category === category && (brand === "all" || product.brand === brand)).map(product => product.subCategory).filter((item): item is string => Boolean(item)))].toSorted(), [brand, category, products]);
  const filtered = useMemo(() => products.filter((product) => (category === "all" || product.category === category) && (brand === "all" || product.brand === brand) && (subCategory === "all" || product.subCategory === subCategory)).toSorted((a, b) => {
    const left = sort === "release" ? a.releaseDate ?? "" : a.firstDetectedAt;
    const right = sort === "release" ? b.releaseDate ?? "" : b.firstDetectedAt;
    return right.localeCompare(left);
  }), [brand, category, products, sort, subCategory]);

  return <section className="catalog" aria-labelledby="catalog-title">
    <div className="catalog-heading"><div><p className="section-kicker">ON SALE NOW</p><h2 id="catalog-title">지금 판매 중인 신상품</h2><p>모든 상품을 공식 출시일 또는 최초 확인일부터 30일간 보여드립니다.</p></div><span className="result-count" aria-live="polite">{filtered.length}개의 판매 중 신상</span></div>
    <div className="filter-group"><span>대분류</span><div className="filter-row" aria-label="대분류 카테고리 필터">{filters.map((filter) => <button type="button" key={filter.value} className={category === filter.value ? "filter-chip selected" : "filter-chip"} aria-pressed={category === filter.value} onClick={() => { setCategory(filter.value); setBrand("all"); setSubCategory("all"); }}>{filter.value !== "all" && categoryMeta[filter.value].emoji} {filter.label}</button>)}</div></div>
    {brands.length > 0 && <div className="filter-group brand-filter"><span>브랜드</span><div className="filter-row" aria-label="중분류 브랜드 필터"><button type="button" className={brand === "all" ? "filter-chip selected" : "filter-chip"} aria-pressed={brand === "all"} onClick={() => { setBrand("all"); setSubCategory("all"); }}>전체</button>{brands.map(item => <button type="button" key={item} className={brand === item ? "filter-chip selected" : "filter-chip"} aria-pressed={brand === item} onClick={() => { setBrand(item); setSubCategory("all"); }}>{item}</button>)}</div></div>}
    {subCategories.length > 0 && <div className="filter-group"><span>상품군</span><div className="filter-row" aria-label="편의점 상품군 필터"><button type="button" className={subCategory === "all" ? "filter-chip selected" : "filter-chip"} aria-pressed={subCategory === "all"} onClick={() => setSubCategory("all")}>전체</button>{subCategories.map(item => <button type="button" key={item} className={subCategory === item ? "filter-chip selected" : "filter-chip"} aria-pressed={subCategory === item} onClick={() => setSubCategory(item)}>{item}</button>)}</div></div>}
    <div className="sort-row"><span>판매 여부가 확인된 상품만 정리했습니다</span><div className="catalog-controls"><div className="sort-options" aria-label="정렬"><button type="button" className={sort === "release" ? "selected" : ""} aria-pressed={sort === "release"} onClick={() => setSort("release")}>출시일순</button><button type="button" className={sort === "detected" ? "selected" : ""} aria-pressed={sort === "detected"} onClick={() => setSort("detected")}>판매 확인순</button></div><div className="view-options" aria-label="목록 표시 방식"><button type="button" className={view === "card" ? "selected" : ""} aria-pressed={view === "card"} onClick={() => setView("card")}>카드</button><button type="button" className={view === "list" ? "selected" : ""} aria-pressed={view === "list"} onClick={() => setView("list")}>리스트</button></div></div></div>
    {filtered.length === 0 ? <p className="empty-products">확인된 신상품이 아직 없습니다. 다음 자동 수집 후 갱신됩니다.</p> : <div className={`product-grid view-${view}`}>{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
  </section>;
}
