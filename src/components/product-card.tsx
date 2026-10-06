import Link from "next/link";
import { categoryMeta, typeLabel } from "@/lib/product-meta";
import type { Product } from "@/types/product";
import type { Offer } from "@/types/offer";

/* eslint-disable @next/next/no-img-element -- 공식 이미지를 복제하지 않고 원본 주소로 표시합니다. */

export function ProductCard({ product, offers }: { product: Product; offers: Offer[] }) {
  const meta = categoryMeta[product.category];
  const availableOffers = offers.filter(offer => offer.stockStatus === "in_stock").toSorted((a,b) => a.price - b.price);
  const lowestOffer = availableOffers[0];
  const saleCheckedAt = lowestOffer?.observedAt ?? product.availabilityCheckedAt ?? product.lastCheckedAt;
  return <article className="product-card">
    <Link href={`/products/${product.id}`} className="product-image" style={{ background: meta.color }}>
      {product.imageUrl ? <img src={product.imageUrl} alt={`${product.name} 상품 이미지`} loading="lazy" referrerPolicy="no-referrer" /> : <span aria-hidden="true">{meta.emoji}</span>}<span className={`badge badge-${product.productType}`}>{typeLabel[product.productType]}</span>
    </Link>
    <div className="product-content"><div className="product-kicker"><span>{product.brand}</span><span>·</span><span>{product.subCategory ?? meta.label}</span></div>
      <Link href={`/products/${product.id}`}><h2>{product.name}</h2></Link><p className="product-description">{product.description}</p>
      <div className="product-commerce">{lowestOffer ? <strong>{lowestOffer.price.toLocaleString("ko-KR")}원부터</strong> : product.price != null && <strong>{product.price.toLocaleString("ko-KR")}원</strong>}{availableOffers.length > 0 ? <span>온라인 판매처 {availableOffers.length}곳</span> : product.retailer ? <span>판매처 {product.retailer}</span> : <span>판매 정보 확인 중</span>}</div>
      <div className="product-footer"><span>판매 확인</span><time dateTime={saleCheckedAt}>{formatDate(saleCheckedAt)}</time></div>
    </div>
  </article>;
}

function formatDate(date?: string) { return date ? `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일` : "날짜 미정"; }
