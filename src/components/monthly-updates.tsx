import Link from "next/link";
import type { Product } from "@/types/product";
import { seoulDateKey } from "@/lib/product-window";
import { getCategoryGroupForProducts } from "@/lib/category-groups";

export function MonthlyUpdates({ products, month }: { products: Product[]; month: string }) {
  const categories = [...new Set(products.map(product => product.subCategory ?? "기타"))]
    .map(label => {
      const categoryProducts = products.filter(product => (product.subCategory ?? "기타") === label);
      return { label, count: categoryProducts.length, group: getCategoryGroupForProducts(categoryProducts) };
    })
    .toSorted((left, right) => right.count - left.count);
  const featured = products
    .toSorted((left, right) => right.firstDetectedAt.localeCompare(left.firstDetectedAt))
    .slice(0, 6);

  return <section className="monthly-updates" aria-labelledby="monthly-updates-title">
    <div className="monthly-update-heading">
      <div><p className="section-kicker">THIS MONTH&apos;S NEW · {month.replace("-", ".")}</p><h2 id="monthly-updates-title">이번 달 신상</h2><p>이번 달 공식 목록에서 처음 확인된 상품을 모았습니다.</p></div>
      <strong><span>{products.length}</span>개</strong>
    </div>
    {products.length === 0 ? <p className="monthly-empty">이번 달 새로 확인된 상품이 없습니다.</p> : <>
      <div className="monthly-category-summary" aria-label="이번 달 상품군별 건수">
        {categories.map(category => category.group && <Link href={`/categories/${category.group.slug}`} key={category.label} aria-label={`${category.label} ${category.count}개, ${category.group.label}으로 이동`}>{category.label} <strong>{category.count}</strong></Link>)}
      </div>
      <div className="monthly-product-list">{featured.map(product => <Link href={`/products/${product.id}`} key={product.id} className="monthly-product">
        {product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" /> : <span aria-hidden="true">NEW</span>}
        <div><small>{seoulDateKey(product.firstDetectedAt).slice(5).replace("-", ".")} · {product.brand}</small><strong>{product.name}</strong><em>{product.subCategory ?? "기타"}</em></div>
      </Link>)}</div>
      {products.length > featured.length && <a className="monthly-more" href="#category-directory-title">이번 달 신상 {products.length}개를 메뉴별로 보기 →</a>}
    </>}
  </section>;
}
