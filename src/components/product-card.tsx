import Link from "next/link";
import { categoryMeta, typeLabel } from "@/lib/product-meta";
import type { Product } from "@/types/product";
import type { Offer } from "@/types/offer";

/* eslint-disable @next/next/no-img-element -- 공식 이미지를 복제하지 않고 원본 주소로 표시합니다. */

export function ProductCard({ product, offers }: { product: Product; offers: Offer[] }) {
  const meta = categoryMeta[product.category];
  const latestOffer = offers.filter(offer => offer.stockStatus === "in_stock").toSorted((a,b) => b.observedAt.localeCompare(a.observedAt))[0];
  const saleCheckedAt = latestOffer?.observedAt ?? product.availabilityCheckedAt ?? product.lastCheckedAt;
  return <article className="product-card">
    <Link href={`/products/${product.id}`} className="product-image" style={{ background: meta.color }}>
      {product.imageUrl ? <img src={product.imageUrl} alt={`${product.name} 상품 이미지`} loading="lazy" referrerPolicy="no-referrer" /> : <span aria-hidden="true">{meta.emoji}</span>}<span className={`badge badge-${product.productType}`}>{typeLabel[product.productType]}</span>
    </Link>
    <div className="product-content"><div className="product-kicker"><span>{product.brand}</span><span>·</span><span>{product.subCategory ?? meta.label}</span></div>
      <Link href={`/products/${product.id}`}><h2>{product.name}</h2></Link><p className="product-description">{product.description}</p>
      <div className="product-commerce"><strong>현재 판매 확인</strong><span>{product.retailer ? `판매처 ${product.retailer}` : "공식 출처 기준"}</span></div>
      <div className="product-footer"><span>판매 확인</span><time dateTime={saleCheckedAt}>{formatDate(saleCheckedAt)}</time></div>
    </div>
  </article>;
}

function formatDate(date?: string) { return date ? `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일` : "날짜 미정"; }
