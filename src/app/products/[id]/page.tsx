import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { getCategoryGroupForCategory } from "@/lib/category-groups";
import { categoryMeta, typeLabel } from "@/lib/product-meta";
import { getProduct, products } from "@/lib/products";

export function generateStaticParams() { return products.map(({ id }) => ({ id })); }

export default async function ProductDetailPage(props: PageProps<"/products/[id]">) {
  const { id } = await props.params;
  const product = getProduct(id);
  if (!product) notFound();
  const meta = categoryMeta[product.category];
  const group = getCategoryGroupForCategory(product.category);
  return <><Header /><main className="detail-shell"><Link className="back-link" href={group ? `/categories/${group.slug}` : "/"}>← {group?.label ?? "신상 목록"}</Link>
    <section className="detail-card"><div className="detail-visual" style={{ background: meta.color }}>{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span aria-hidden="true">{meta.emoji}</span>}<span className={`badge badge-${product.productType}`}>{typeLabel[product.productType]}</span></div>
      <div className="detail-copy"><p className="eyebrow">{product.brand} · {meta.label}</p><h1>{product.name}</h1><p className="detail-description">{product.description}</p>
        <dl className="detail-list">{product.retailer && <div><dt>판매처</dt><dd>{product.retailer}</dd></div>}{product.brand === "CU" ? <div><dt>최초 확인일</dt><dd>{new Date(product.firstDetectedAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</dd></div> : product.releaseDate && <div><dt>출시일</dt><dd>{product.releaseDate}</dd></div>}<div><dt>확인 근거</dt><dd>{product.sourceType === "press_release" ? "공식 신제품 발표" : "공식 메뉴·상품 목록"}</dd></div><div><dt>판매 상태</dt><dd>현재 판매 확인</dd></div>{product.availabilityCheckedAt && <div><dt>판매 확인일</dt><dd>{new Date(product.availabilityCheckedAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</dd></div>}<div><dt>상품 유형</dt><dd>{typeLabel[product.productType]}</dd></div></dl>
        <a className="source-button" href={product.sourceUrl} target="_blank" rel="noopener noreferrer">공식 출처 보기</a>
      </div></section>
  </main></>;
}
