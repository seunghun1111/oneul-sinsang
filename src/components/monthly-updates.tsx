import Link from "next/link";
import type { Product } from "@/types/product";
import { seoulDateKey } from "@/lib/product-window";
import { getCategoryGroupForProducts } from "@/lib/category-groups";
import { SummaryViewport } from "./summary-viewport";
import {ProductThumbnail} from "./product-thumbnail";

export function MonthlyUpdates({ products, month, includeInitial = false }: { products: Product[]; month: string; includeInitial?: boolean }) {
  const categories = [...new Set(products.map(product => product.subCategory ?? "기타"))]
    .map(label => {
      const categoryProducts = products.filter(product => (product.subCategory ?? "기타") === label);
      return { label, count: categoryProducts.length, group: getCategoryGroupForProducts(categoryProducts) };
    })
    .toSorted((left, right) => right.count - left.count);
  const featured = products
    .toSorted((left, right) => right.firstDetectedAt.localeCompare(left.firstDetectedAt));

  return <section className="monthly-updates" aria-labelledby="monthly-updates-title">
    <div className="monthly-update-heading">
      <div><p className="section-kicker">THIS MONTH&apos;S NEW · {month.replace("-", ".")}</p><h2 id="monthly-updates-title">이번 달 신상</h2><p>{includeInitial ? "이번 주에는 초기 수집을 포함해 이번 달 처음 확인된 공식 NEW를 보여줍니다." : "초기 수집을 제외하고 이번 달 새로 확인된 NEW를 모았습니다."}</p></div>
      <strong><span>{products.length}</span>개</strong>
    </div>
    {products.length === 0 ? <p className="monthly-empty">이번 달 새로 확인된 상품이 없습니다.</p> : <>
      <div className="monthly-category-summary" aria-label="이번 달 상품군별 건수">
        {categories.map(category => category.group && <Link href={`/categories/${category.group.slug}`} key={category.label} aria-label={`${category.label} ${category.count}개, ${category.group.label}으로 이동`}>{category.label} <strong>{category.count}</strong></Link>)}
      </div>
      <SummaryViewport key={month} label="이번 달 신상"><div className="monthly-product-list">{featured.map(product => <Link href={`/products/${product.id}`} key={product.id} className="monthly-product">
        <ProductThumbnail product={product}/>
        <div><small>{seoulDateKey(product.firstDetectedAt).slice(5).replace("-", ".")} · {product.brand}</small><strong>{product.name}</strong><em>{product.subCategory ?? "기타"}</em></div>
      </Link>)}</div></SummaryViewport>
    </>}
  </section>;
}
