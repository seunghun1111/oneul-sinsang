import { Header } from "@/components/header";
import { CategoryDirectory } from "@/components/category-directory";
import {HomeDiscovery} from "@/components/home-discovery";
import Link from "next/link";
import {products} from "@/lib/products";

export default function Home() {
  const now = new Date();
  return <><Header /><main>
    <section className="hero"><div className="hero-copy"><span className="hero-label">신상발견</span><h1>브랜드가 소개하는<br /><em>NEW를 한곳에서.</em></h1><p>공식 사이트에서 NEW로 소개하는 상품을<br className="desktop-break" /> 한곳에서 발견해 보세요.</p><Link href="/search" className="hero-search-link">상품명·브랜드로 찾아보기 <span aria-hidden="true">→</span></Link></div>
      <div className="hero-art" aria-hidden="true"><span className="art-orbit orbit-one">NEW</span><span className="art-orbit orbit-two">🍩</span><span className="art-main">🛍️</span><span className="art-spark spark-one">✦</span><span className="art-spark spark-two">✦</span></div>
    </section>
    <HomeDiscovery products={products} builtAt={now.toISOString()}/>
    <CategoryDirectory products={products} />
    <section className="about" id="about"><span aria-hidden="true">🔎</span><div><p className="section-kicker">SINSANG DISCOVERY</p><h2>공식 NEW 표시를 추적합니다</h2></div><p>출시일과 무관하게 공식 NEW 상품을 모읍니다. 초기 수집과 새로 발견한 상품을 구분하며, 기간별 집계 기준은 각 목록의 안내를 확인하세요. NEW 표시 종료는 판매 종료를 의미하지 않습니다.</p></section>
  </main><footer><strong>신상발견</strong><span>비상업적 개인 프로젝트이며 각 브랜드와 제휴·후원 관계가 없습니다.</span><a href="https://github.com/seunghun1111/oneul-sinsang/issues/new?template=correction.yml" target="_blank" rel="noopener noreferrer">정정·삭제 요청</a><small>© 2026 Sinsang Discovery</small></footer></>;
}
