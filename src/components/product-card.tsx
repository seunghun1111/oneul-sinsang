import Link from "next/link";
import { categoryMeta, typeLabel } from "@/lib/product-meta";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  const meta = categoryMeta[product.category];
  return <article className="product-card">
    <Link href={`/products/${product.id}`} className="product-image" style={{ background: meta.color }}>
      <span aria-hidden="true">{meta.emoji}</span><span className={`badge badge-${product.productType}`}>{typeLabel[product.productType]}</span>
    </Link>
    <div className="product-content"><div className="product-kicker"><span>{product.brand}</span><span>·</span><span>{meta.label}</span></div>
      <Link href={`/products/${product.id}`}><h2>{product.name}</h2></Link><p className="product-description">{product.description}</p>
      <div className="product-footer"><strong>{product.price ? `${product.price.toLocaleString("ko-KR")}원` : "가격 미정"}</strong><time dateTime={product.releaseDate}>{formatDate(product.releaseDate)}</time></div>
    </div>
  </article>;
}

function formatDate(date?: string) { return date ? `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일 출시` : "출시일 미정"; }

