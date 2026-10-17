import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { getCategoryGroupForCategory } from "@/lib/category-groups";
import { categoryMeta, typeLabel } from "@/lib/product-meta";
import { getProduct, products } from "@/lib/products";
import {discoveryEvidence} from "../../../../chatgpt-site/lib/review/discovery-evidence";
import {FavoriteButton} from "@/components/favorite-button";
import {ProductFreshness} from "@/components/product-freshness";
import {seoulDateKey} from "@/lib/product-window";

export function generateStaticParams() { return products.map(({ id }) => ({ id })); }

export default async function ProductDetailPage(props: PageProps<"/products/[id]">) {
  const { id } = await props.params;
  const product = getProduct(id);
  if (!product) notFound();
  const meta = categoryMeta[product.category];
  const group = getCategoryGroupForCategory(product.category);
  const evidence=discoveryEvidence(product);
  return <><Header /><main className="detail-shell"><Link className="back-link" href={group ? `/categories/${group.slug}` : "/"}>← {group?.label ?? "신상 목록"}</Link>
    <section className="detail-card"><div className="detail-visual" style={{ background: meta.color }}>{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span aria-hidden="true">{meta.emoji}</span>}<span className={`badge badge-${product.productType}`}>{typeLabel[product.productType]}</span></div>
      <div className="detail-copy"><p className="eyebrow">{product.brand} · {meta.label}</p><h1>{product.name}</h1><p className="detail-description">{product.description}</p>
        <dl className="detail-list"><div><dt>{evidence.dateLabel}</dt><dd>{evidence.date||"미확인"}</dd></div><div><dt>신상 근거</dt><dd>{evidence.newLabel}</dd></div><div><dt>판매 근거</dt><dd>{evidence.saleLabel}</dd></div><div><dt>최근 수집 시도</dt><dd>{seoulDateKey(product.lastCheckedAt)}</dd></div><div><dt>상품 유형</dt><dd>{typeLabel[product.productType]}</dd></div></dl>
        {evidence.saleCheckedAt&&<p>주문 가능 확인 시각: {new Date(evidence.saleCheckedAt).toLocaleString("ko-KR",{timeZone:"Asia/Seoul",hour12:false})} (한국 시간) · 확인 당시 기준입니다.</p>}
        <ProductFreshness product={{brand:product.brand,sourceUrl:product.sourceUrl,lastSeenAt:product.lastSeenAt,reviewEvidence:product.reviewEvidence,consecutiveMisses:product.consecutiveMisses}} detail/>
        <p>최초 발견일은 출시일이 아닙니다. 검색·판매 링크 노출만으로 신상이나 매장 재고를 확정하지 않습니다.</p>
        <div className="detail-favorite"><FavoriteButton kind="products" value={product.id} label={`${product.brand} ${product.name}`}/><span>관심 상품</span></div>
        <a className="source-button" href={product.sourceUrl} target="_blank" rel="noopener noreferrer">공식 출처 보기</a>
      </div></section>
  </main></>;
}
