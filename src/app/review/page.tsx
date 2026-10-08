import Link from "next/link";
import { Header } from "@/components/header";
import autoProducts from "@/data/coffee-products-auto.json" with { type:"json" };
import type { Product } from "@/types/product";

function pendingReason(product: Product) {
  return product.releaseDate
    ? "공식 사이트의 최근 변경에서 자동 감지됐지만, 변경일이 실제 출시일과 다를 수 있어 NEW 표시와 판매 여부 확인이 필요합니다."
    : "공식 메뉴·MD 목록에서 자동 감지됐지만 개별 출시일이 없어, 최근 한 달 신상 여부와 현재 판매 여부 확인이 필요합니다.";
}

function reviewUrl(product: Product, decision: "승인" | "거절") {
  const params = new URLSearchParams({
    title: `[상품 ${decision}] ${product.id}`,
    body: `상품 ID: \`${product.id}\`\n브랜드: ${product.brand}\n상품명: ${product.name}\n\n공식 출처를 확인한 뒤 이 이슈를 등록하면 자동 검수 워크플로가 실행됩니다.`,
  });
  return `https://github.com/seunghun1111/oneul-sinsang/issues/new?${params}`;
}

export default function ReviewPage() {
  const products = autoProducts as Product[];
  const active = products.filter(product => product.reviewStatus === "approved" && product.availabilityStatus === "on_sale");
  const waiting = products.filter(product => product.reviewStatus === "pending");
  const ended = products.filter(product => product.availabilityStatus === "ended");
  return <><Header/><main className="review-shell"><div className="review-heading"><div><p className="section-kicker">COLLECTION STATUS</p><h1>공식 출처 수집 현황</h1><p>자동 감지된 커피 메뉴와 MD를 출처·상태별로 확인할 수 있습니다.</p></div><Link href="/">신상 목록으로</Link></div>
    <section className="review-summary" aria-label="수집 상태 요약"><div><strong>{active.length}</strong><span>승인·현재 확인</span></div><div><strong>{waiting.length}</strong><span>검수 대기</span></div><div><strong>{ended.length}</strong><span>판매 종료</span></div></section>
    {waiting.length > 0 && <aside className="review-guide"><strong>왜 검수 대기인가요?</strong><p>자동 수집은 공식 페이지에서 후보를 찾는 단계입니다. 상품별 NEW 표시, 실제 출시 시점, 현재 판매 여부를 사람이 확인해야 공개 목록에 노출됩니다. 승인·거절은 저장소 권한이 있는 GitHub 계정으로만 반영됩니다.</p></aside>}
    <section className="review-list" aria-label="자동 수집 상품">{products.length === 0 ? <p className="empty-products">아직 자동 감지된 상품이 없습니다.</p> : products.map(product => <article key={product.id}><div><span className={`review-status status-${product.reviewStatus === "pending" ? "unknown" : product.reviewStatus === "rejected" ? "ended" : product.availabilityStatus}`}>{product.reviewStatus === "pending" ? "검수 대기" : product.reviewStatus === "rejected" ? "검수 제외" : product.availabilityStatus === "ended" ? "판매 종료" : "승인됨"}</span><strong>{product.brand}</strong><h2>{product.name}</h2></div><div><p>{product.reviewStatus === "pending" ? pendingReason(product) : product.availabilityReason ?? "공식 상품 목록에서 확인"}</p><time dateTime={product.lastCheckedAt}>확인 {product.lastCheckedAt.slice(0,10).replaceAll("-", ".")}</time><a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">공식 출처</a>{product.reviewStatus === "pending" && <span className="review-actions"><a href={reviewUrl(product, "승인")} target="_blank" rel="noopener noreferrer">GitHub에서 승인</a><a href={reviewUrl(product, "거절")} target="_blank" rel="noopener noreferrer" className="reject">제외</a></span>}</div></article>)}</section>
  </main></>;
}
