import Link from "next/link";
import { Header } from "@/components/header";
import autoProducts from "@/data/coffee-products-auto.json" with { type:"json" };
import type { Product } from "@/types/product";

export default function ReviewPage() {
  const products = autoProducts as Product[];
  const active = products.filter(product => product.reviewStatus === "approved" && product.availabilityStatus === "on_sale");
  const waiting = products.filter(product => product.reviewStatus === "pending");
  const ended = products.filter(product => product.availabilityStatus === "ended");
  return <><Header/><main className="review-shell"><div className="review-heading"><div><p className="section-kicker">COLLECTION STATUS</p><h1>공식 출처 수집 현황</h1><p>자동 감지된 커피 메뉴와 MD를 출처·상태별로 확인할 수 있습니다.</p></div><Link href="/">신상 목록으로</Link></div>
    <section className="review-summary" aria-label="수집 상태 요약"><div><strong>{active.length}</strong><span>승인·현재 확인</span></div><div><strong>{waiting.length}</strong><span>검수 대기</span></div><div><strong>{ended.length}</strong><span>판매 종료</span></div></section>
    <section className="review-list" aria-label="자동 수집 상품">{products.length === 0 ? <p className="empty-products">아직 자동 감지된 상품이 없습니다.</p> : products.map(product => <article key={product.id}><div><span className={`review-status status-${product.reviewStatus === "pending" ? "unknown" : product.availabilityStatus}`}>{product.reviewStatus === "pending" ? "검수 대기" : product.availabilityStatus === "ended" ? "판매 종료" : "승인됨"}</span><strong>{product.brand}</strong><h2>{product.name}</h2></div><div><p>{product.availabilityReason ?? "공식 상품 목록에서 확인"}</p><time dateTime={product.lastCheckedAt}>확인 {product.lastCheckedAt.slice(0,10).replaceAll("-", ".")}</time><a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">공식 출처</a></div></article>)}</section>
  </main></>;
}
