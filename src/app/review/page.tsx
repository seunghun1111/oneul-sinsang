import Link from "next/link";
import { Header } from "@/components/header";
import { ReviewProductList } from "@/components/review-product-list";
import autoProducts from "@/data/coffee-products-auto.json" with { type:"json" };
import type { Product } from "@/types/product";

export default function ReviewPage() {
  const products = autoProducts as Product[];
  const active = products.filter(product => product.reviewStatus === "approved" && product.availabilityStatus === "on_sale");
  const waiting = products.filter(product => product.reviewStatus === "pending");
  const ended = products.filter(product => product.availabilityStatus === "ended");
  return <><Header/><main className="review-shell"><div className="review-heading"><div><p className="section-kicker">COLLECTION STATUS</p><h1>공식 출처 수집 현황</h1><p>자동 감지된 커피 메뉴와 MD를 출처·상태별로 확인할 수 있습니다.</p></div><Link href="/">신상 목록으로</Link></div>
    <section className="review-summary" aria-label="수집 상태 요약"><div><strong>{active.length}</strong><span>승인·현재 확인</span></div><div><strong>{waiting.length}</strong><span>검수 대기</span></div><div><strong>{ended.length}</strong><span>판매 종료</span></div></section>
    {waiting.length > 0 && <aside className="review-guide"><strong>왜 검수 대기인가요?</strong><p>자동 수집은 공식 페이지에서 후보를 찾는 단계입니다. 상품별 NEW 표시, 실제 출시 시점, 현재 판매 여부를 사람이 확인해야 공개 목록에 노출됩니다. 승인·거절은 저장소 권한이 있는 GitHub 계정으로만 반영됩니다.</p></aside>}
    <ReviewProductList products={products}/>
  </main></>;
}
