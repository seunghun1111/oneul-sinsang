import Link from "next/link";
import { categoryMeta, typeLabel } from "@/lib/product-meta";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  const meta = categoryMeta[product.category];
  const saleCheckedAt = product.availabilityCheckedAt ?? product.lastCheckedAt;
  return <article className="product-card">
    <Link href={`/products/${product.id}`} className="product-image" style={{ background: meta.color }}>
      <span aria-hidden="true">{meta.emoji}</span><span className={`badge badge-${product.productType}`}>{typeLabel[product.productType]}</span>
    </Link>
    <div className="product-content"><div className="product-kicker"><span>{product.brand}</span><span>·</span><span>{product.subCategory ?? meta.label}</span></div>
      <Link href={`/products/${product.id}`}><h2>{product.name}</h2></Link><p className="product-description">{product.description}</p><p className="product-evidence">{product.sourceType === "press_release" ? "공식 신제품 발표 확인" : "공식 메뉴·상품 목록 확인"}</p>
      <div className="product-commerce"><strong>현재 판매 확인</strong><span>{product.retailer ? `판매처 ${product.retailer}` : "공식 출처 기준"}</span></div>
      <div className="product-footer"><span>판매 확인</span><time dateTime={saleCheckedAt}>{formatDate(saleCheckedAt)}</time></div>
    </div>
  </article>;
}

function formatDate(date?: string) { return date ? `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일` : "날짜 미정"; }
