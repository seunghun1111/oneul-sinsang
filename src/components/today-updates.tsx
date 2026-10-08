"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/types/product";
import { seoulDateKey } from "@/lib/product-window";
import { getCategoryGroupForProducts } from "@/lib/category-groups";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

export function TodayUpdates({ products, today, dates }: { products: Product[]; today: string; dates: string[] }) {
  const [selectedDate, setSelectedDate] = useState(today);
  const selectedProducts = useMemo(() => products.filter(product => seoulDateKey(product.firstDetectedAt) === selectedDate), [products, selectedDate]);
  const categories = [...new Map(selectedProducts.map(product => [product.subCategory ?? "기타", 0])).keys()]
    .map(label => {
      const categoryProducts = selectedProducts.filter(product => (product.subCategory ?? "기타") === label);
      return { label, count: categoryProducts.length, group: getCategoryGroupForProducts(categoryProducts) };
    })
    .toSorted((left, right) => right.count - left.count);
  const featured = selectedProducts.slice(0, 6);
  const weekRange = `${dates[0].slice(5).replace("-", ".")}–${dates[6].slice(5).replace("-", ".")}`;

  return <section className="today-updates" aria-labelledby="today-updates-title">
    <div className="today-update-heading">
      <div><p className="section-kicker">THIS WEEK&apos;S NEW · {weekRange}</p><h2 id="today-updates-title">이번 주 신상</h2><p>공식 목록에서 이번 주 처음 확인된 상품을 날짜별로 보여줍니다.</p></div>
      <strong><span>{products.length}</span>개</strong>
    </div>
    <div className="week-date-tabs" role="tablist" aria-label="이번 주 날짜별 신상">
      {dates.map((date, index) => {
        const count = products.filter(product => seoulDateKey(product.firstDetectedAt) === date).length;
        const selected = date === selectedDate;
        return <button type="button" role="tab" aria-selected={selected} className={selected ? "is-active" : ""} onClick={() => setSelectedDate(date)} key={date}>
          <span>{DAY_LABELS[index]}</span><strong>{Number(date.slice(8))}</strong><small>{count}</small>
        </button>;
      })}
    </div>
    {selectedProducts.length === 0 ? <p className="today-empty">{selectedDate === today ? "오늘" : `${Number(selectedDate.slice(5, 7))}월 ${Number(selectedDate.slice(8))}일`} 새로 확인된 상품이 없습니다.</p> : <>
      <div className="today-category-summary" aria-label="선택한 날짜의 상품군별 건수">{categories.map(category => category.group && <Link href={`/categories/${category.group.slug}`} key={category.label} aria-label={`${category.label} ${category.count}개, ${category.group.label}으로 이동`}>{category.label} <strong>{category.count}</strong></Link>)}</div>
      <div className="today-product-list">{featured.map(product => <Link href={`/products/${product.id}`} key={product.id} className="today-product">
        {product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" /> : <span aria-hidden="true">NEW</span>}
        <div><small>{product.brand} · {product.subCategory ?? "기타"}</small><strong>{product.name}</strong></div>
      </Link>)}</div>
      {selectedProducts.length > featured.length && <a className="today-more" href="#category-directory-title">이날 확인된 {selectedProducts.length}개를 메뉴별로 보기 →</a>}
    </>}
  </section>;
}
