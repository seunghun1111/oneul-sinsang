import Link from "next/link";
import { categoryMeta, typeLabel } from "@/lib/product-meta";
import type { Product } from "@/types/product";
import {discoveryEvidence} from "../../chatgpt-site/lib/review/discovery-evidence";
import {ProductThumbnail} from "./product-thumbnail";
import {seoulDateKey} from "@/lib/product-window";

export function ProductCard({ product }: { product: Product }) {
  const meta = categoryMeta[product.category];
  const evidence=discoveryEvidence(product);
  const displayDate=evidence.dateLabel==="최초 발견일"?product.firstDetectedAt:evidence.date;
  return <article className="product-card">
    <Link href={`/products/${product.id}`} aria-label={`${product.brand} ${product.name} 상세 보기`} className="product-image" style={{ background: meta.color }}>
      <ProductThumbnail product={product}/><span className={`badge badge-${product.productType}`}>{typeLabel[product.productType]}</span>
    </Link>
    <div className="product-content"><div className="product-kicker"><span>{product.brand}</span><span>·</span><span>{product.subCategory ?? meta.label}</span></div>
      <Link href={`/products/${product.id}`}><h2>{product.name}</h2></Link><small>{product.detectionKind==="initial"?"초기 수집":"새로 확인된 NEW"}</small><p className="product-description">{product.description}</p><p className="product-evidence">{product.sourceType === "press_release" ? "공식 신제품 발표 확인" : "공식 메뉴·상품 목록 확인"}</p>
      <div className="product-commerce"><strong>{evidence.newLabel}</strong><span>{evidence.saleLabel}</span></div>
      <div className="product-footer"><span>{evidence.dateLabel}</span><time dateTime={displayDate}>{formatDate(displayDate)}</time></div>
    </div>
  </article>;
}

function formatDate(date?: string) { if(!date)return "날짜 미정";const localDate=seoulDateKey(date);return `${Number(localDate.slice(5,7))}월 ${Number(localDate.slice(8,10))}일`; }
