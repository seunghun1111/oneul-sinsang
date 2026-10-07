import Link from "next/link";
import { categoryGroups } from "@/lib/category-groups";
import type { Product } from "@/types/product";

export function CategoryDirectory({ products }: { products: Product[] }) {
  return <section className="category-directory" aria-labelledby="category-directory-title">
    <div className="catalog-heading"><div><p className="section-kicker">BROWSE BY CATEGORY</p><h2 id="category-directory-title">메뉴별로 신상을 확인하세요</h2><p>관심 있는 메뉴로 이동하면 해당 상품만 볼 수 있습니다.</p></div></div>
    <div className="category-directory-grid">{categoryGroups.map(group => {
      const groupProducts = products.filter(product => group.categories.includes(product.category));
      const brands = new Set(groupProducts.map(product => product.brand)).size;
      return <Link href={`/categories/${group.slug}`} className="category-directory-card" key={group.slug}>
        <span className="category-directory-icon" aria-hidden="true">{group.emoji}</span>
        <div><small>{groupProducts.length}개 신상 · {brands}개 브랜드</small><h3>{group.label}</h3><p>{group.description}</p></div><strong>보기 →</strong>
      </Link>;
    })}</div>
  </section>;
}
