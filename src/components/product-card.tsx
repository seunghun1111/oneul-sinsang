import Link from "next/link";
import { categoryMeta, typeLabel } from "@/lib/product-meta";
import type { Product } from "@/types/product";

/* eslint-disable @next/next/no-img-element -- 공식 이미지를 복제하지 않고 원본 주소로 표시합니다. */

export function ProductCard({ product }: { product: Product }) {
  const meta = categoryMeta[product.category];
  return <article className="product-card">
    <Link href={`/products/${product.id}`} className="product-image" style={{ background: meta.color }}>
      {product.imageUrl ? <img src={product.imageUrl} alt={`${product.name} 상품 이미지`} loading="lazy" referrerPolicy="no-referrer" /> : <span aria-hidden="true">{meta.emoji}</span>}<span className={`badge badge-${product.productType}`}>{typeLabel[product.productType]}</span>
    </Link>
    <div className="product-content"><div className="product-kicker"><span>{product.brand}</span><span>·</span><span>{meta.label}</span></div>
      <Link href={`/products/${product.id}`}><h2>{product.name}</h2></Link><p className="product-description">{product.description}</p>
      <div className="product-commerce">{product.price != null && <strong>{product.price.toLocaleString("ko-KR")}원</strong>}{product.retailer && <span>판매처 {product.retailer}</span>}{product.price == null && !product.retailer && <span>가격·판매처 정보 없음</span>}</div>
      <div className="product-footer"><span>공식 발표</span><time dateTime={product.releaseDate}>{formatDate(product.releaseDate)}</time></div>
    </div>
  </article>;
}

function formatDate(date?: string) { return date ? `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일` : "날짜 미정"; }
