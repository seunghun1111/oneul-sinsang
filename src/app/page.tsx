import { Header } from "@/components/header";
import { CategoryDirectory } from "@/components/category-directory";
import { TodayUpdates } from "@/components/today-updates";
import { MonthlyUpdates } from "@/components/monthly-updates";
import {DiscoveryTabs} from "@/components/discovery-tabs";
import Link from "next/link";
import { INITIAL_SUMMARY_CUTOFF } from "@/lib/product-window";
import { getMonthProducts, getWeekProducts, products, seoulDateKey, seoulMonthKey, seoulWeekDateKeys } from "@/lib/products";

export default function Home() {
  const now = new Date();
  const weekProducts = getWeekProducts(now);
  const monthProducts = getMonthProducts(now);
  return <><Header /><main>
    <section className="hero"><div className="hero-copy"><span className="hero-label">신상발견</span><h1>브랜드가 소개하는<br /><em>NEW를 한곳에서.</em></h1><p>공식 사이트에서 NEW로 소개하는 상품을<br className="desktop-break" /> 한곳에서 발견해 보세요.</p><Link href="/search" className="hero-search-link">상품명·브랜드로 찾아보기 <span aria-hidden="true">→</span></Link></div>
      <div className="hero-art" aria-hidden="true"><span className="art-orbit orbit-one">NEW</span><span className="art-orbit orbit-two">🍩</span><span className="art-main">🛍️</span><span className="art-spark spark-one">✦</span><span className="art-spark spark-two">✦</span></div>
    </section>
    <DiscoveryTabs weekCount={weekProducts.length} monthCount={monthProducts.length} week={<TodayUpdates products={weekProducts} today={seoulDateKey(now)} dates={seoulWeekDateKeys(now)} />} month={<MonthlyUpdates products={monthProducts} month={seoulMonthKey(now)} includeInitial={seoulDateKey(now) < INITIAL_SUMMARY_CUTOFF} />} />
    <CategoryDirectory products={products} />
    <section className="about" id="about"><span aria-hidden="true">🔎</span><div><p className="section-kicker">SINSANG DISCOVERY</p><h2>공식 NEW 표시를 추적합니다</h2></div><p>출시일과 무관하게 공식 NEW 상품을 모읍니다. 이번 주에는 초기 수집도 집계하며, 10월 19일부터 초기 수집을 제외한 신규 발견 기준으로 전환합니다. NEW 표시 종료는 판매 종료를 의미하지 않습니다.</p></section>
  </main><footer><strong>신상발견</strong><span>비상업적 개인 프로젝트이며 각 브랜드와 제휴·후원 관계가 없습니다.</span><a href="https://github.com/seunghun1111/oneul-sinsang/issues/new?template=correction.yml" target="_blank" rel="noopener noreferrer">정정·삭제 요청</a><small>© 2026 Sinsang Discovery</small></footer></>;
}
