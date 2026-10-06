import Link from "next/link";
import type { Product } from "@/types/product";

export function TodayUpdates({ products, date }: { products: Product[]; date: string }) {
  const categories = [...new Map(products.map(product => [product.subCategory ?? "기타", 0])).keys()]
    .map(label => ({ label, count: products.filter(product => (product.subCategory ?? "기타") === label).length }))
    .toSorted((left, right) => right.count - left.count);
  const featured = products.slice(0, 6);

  return <section className="today-updates" aria-labelledby="today-updates-title">
    <div className="today-update-heading">
      <div><p className="section-kicker">TODAY&apos;S UPDATE · {date}</p><h2 id="today-updates-title">오늘 확인된 NEW</h2><p>공식 목록에서 오늘 처음 발견된 상품입니다.</p></div>
      <strong><span>{products.length}</span>개</strong>
    </div>
    {products.length === 0 ? <p className="today-empty">오늘 새로 확인된 상품이 없습니다.</p> : <>
      <div className="today-category-summary" aria-label="오늘 업데이트 상품군별 건수">{categories.map(category => <span key={category.label}>{category.label} <strong>{category.count}</strong></span>)}</div>
      <div className="today-product-list">{featured.map(product => <Link href={`/products/${product.id}`} key={product.id} className="today-product">
        {product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" /> : <span aria-hidden="true">NEW</span>}
        <div><small>{product.brand} · {product.subCategory ?? "기타"}</small><strong>{product.name}</strong></div>
      </Link>)}</div>
      {products.length > featured.length && <a className="today-more" href="#catalog-title">오늘 업데이트 전체 {products.length}개 보기 →</a>}
    </>}
  </section>;
}
