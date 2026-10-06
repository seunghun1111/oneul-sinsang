import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { categoryMeta, typeLabel } from "@/lib/product-meta";
import { getProduct, products } from "@/lib/products";
import { offersFor } from "@/lib/offers";

/* eslint-disable @next/next/no-img-element -- 공식 이미지를 복제하지 않고 원본 주소로 표시합니다. */

export function generateStaticParams() { return products.map(({ id }) => ({ id })); }

export default async function ProductDetailPage(props: PageProps<"/products/[id]">) {
  const { id } = await props.params;
  const product = getProduct(id);
  if (!product) notFound();
  const meta = categoryMeta[product.category];
  const offers = offersFor(product.id).toSorted((a,b) => a.price - b.price);
  return <><Header /><main className="detail-shell"><Link className="back-link" href="/">← 신상 목록</Link>
    <section className="detail-card"><div className="detail-visual" style={{ background: meta.color }}>{product.imageUrl ? <img src={product.imageUrl} alt={`${product.name} 상품 이미지`} referrerPolicy="no-referrer" /> : <span aria-hidden="true">{meta.emoji}</span>}<span className={`badge badge-${product.productType}`}>{typeLabel[product.productType]}</span></div>
      <div className="detail-copy"><p className="eyebrow">{product.brand} · {meta.label}</p><h1>{product.name}</h1><p className="detail-description">{product.description}</p>
        <dl className="detail-list">{product.price != null && <div><dt>공식 가격</dt><dd>{product.price.toLocaleString("ko-KR")}원</dd></div>}{product.retailer && <div><dt>판매처</dt><dd>{product.retailer}</dd></div>}{product.releaseDate && <div><dt>출시일</dt><dd>{product.releaseDate}</dd></div>}<div><dt>판매 상태</dt><dd>현재 판매 확인</dd></div>{product.availabilityCheckedAt && <div><dt>판매 확인일</dt><dd>{new Date(product.availabilityCheckedAt).toLocaleDateString("ko-KR")}</dd></div>}<div><dt>상품 유형</dt><dd>{typeLabel[product.productType]}</dd></div></dl>
        {offers.length > 0 && <section className="offer-list" aria-labelledby="offer-title"><h2 id="offer-title">온라인 판매 정보</h2>{offers.map(offer=><a key={offer.id} href={offer.url} target="_blank" rel="noopener noreferrer"><span><strong>{offer.retailer}</strong><small>{offer.quantity > 1 ? `${offer.quantity}개 묶음 · ` : ""}{offer.unit} · {new Date(offer.observedAt).toLocaleDateString("ko-KR")} 확인</small></span><span><strong>{offer.price.toLocaleString("ko-KR")}원</strong><small>{offer.stockStatus === "in_stock" ? "판매 중" : offer.stockStatus === "out_of_stock" ? "품절" : "상태 확인 필요"}</small></span></a>)}</section>}
        <a className="source-button" href={product.sourceUrl} target="_blank" rel="noopener noreferrer">공식 출처 보기</a>
      </div></section>
  </main></>;
}
