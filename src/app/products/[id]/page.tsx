import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { categoryMeta, typeLabel } from "@/lib/product-meta";
import { getProduct, products } from "@/lib/products";

export function generateStaticParams() { return products.map(({ id }) => ({ id })); }

export default async function ProductDetailPage(props: PageProps<"/products/[id]">) {
  const { id } = await props.params;
  const product = getProduct(id);
  if (!product) notFound();
  const meta = categoryMeta[product.category];
  return <><Header /><main className="detail-shell"><Link className="back-link" href="/">← 신상 목록</Link>
    <section className="detail-card"><div className="detail-visual" style={{ background: meta.color }}><span aria-hidden="true">{meta.emoji}</span><span className={`badge badge-${product.productType}`}>{typeLabel[product.productType]}</span></div>
      <div className="detail-copy"><p className="eyebrow">{product.brand} · {meta.label}</p><h1>{product.name}</h1><p className="detail-description">{product.description}</p>
        <dl className="detail-list"><div><dt>가격</dt><dd>{product.price?.toLocaleString("ko-KR")}원</dd></div><div><dt>출시일</dt><dd>{product.releaseDate}</dd></div><div><dt>판매처</dt><dd>{product.retailer}</dd></div><div><dt>상품 유형</dt><dd>{typeLabel[product.productType]}</dd></div></dl>
        <a className="source-button" href={product.sourceUrl} target="_blank" rel="noreferrer">공식 페이지 보기 ↗</a>
      </div></section>
  </main></>;
}

