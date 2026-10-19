import Link from "next/link";
import { categoryGroups,productInCategoryGroup } from "@/lib/category-groups";
import type { Product } from "@/types/product";

export function CategoryDirectory({ products }: { products: Product[] }) {
  return <section className="category-directory" aria-labelledby="category-directory-title">
    <div className="catalog-heading"><div><p className="section-kicker">BROWSE BY CATEGORY</p><h2 id="category-directory-title">메뉴별로 신상을 확인하세요</h2><p>공식 분류가 명확한 CU 상품은 편의점과 용도별 메뉴에 함께 표시합니다. 메뉴별 건수 합계는 전체 상품 수와 다를 수 있습니다.</p></div></div>
    <div className="category-directory-grid">{categoryGroups.map(group => {
      const groupProducts = products.filter(product => productInCategoryGroup(product,group.slug));
      const brands = new Set(groupProducts.map(product => product.brand)).size;
      return <Link href={`/categories/${group.slug}`} className="category-directory-card" key={group.slug}>
        <span className="category-directory-icon" aria-hidden="true">{group.emoji}</span>
        <div><small>{groupProducts.length}개 신상 · {brands}개 브랜드</small><h3>{group.label}</h3><p>{group.description}</p></div><strong>보기 →</strong>
      </Link>;
    })}</div>
  </section>;
}
