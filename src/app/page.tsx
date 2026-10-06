import { Header } from "@/components/header";
import { ProductExplorer } from "@/components/product-explorer";
import { CoffeeSourceDirectory } from "@/components/coffee-source-directory";
import { coffeeBrandSources } from "@/data/coffee-sources";
import { products } from "@/lib/products";
import { offers } from "@/lib/offers";

export default function Home() {
  return <><Header /><main>
    <section className="hero"><div className="hero-copy"><span className="hero-label">공식 출처 기반 신상품</span><h1>새로운 맛을 찾는<br /><em>가장 쉬운 방법.</em></h1><p>식품 브랜드가 공식 발표한 신상품을<br className="desktop-break" /> 한곳에서 확인해 보세요.</p></div>
      <div className="hero-art" aria-hidden="true"><span className="art-orbit orbit-one">NEW</span><span className="art-orbit orbit-two">🍩</span><span className="art-main">🛍️</span><span className="art-spark spark-one">✦</span><span className="art-spark spark-two">✦</span></div>
    </section>
    <ProductExplorer products={products} offers={offers} />
    <CoffeeSourceDirectory sources={coffeeBrandSources} />
    <section className="about" id="about"><span aria-hidden="true">🔎</span><div><p className="section-kicker">ONEUL SINSANG</p><h2>공식 발표만 모아 봅니다</h2></div><p>GitHub Actions가 매일 브랜드 공식 발표를 확인하고 검증된 결과를 정적 데이터로 갱신합니다.</p></section>
  </main><footer><strong>오늘신상</strong><span>오늘의 새로움을 발견하세요.</span><small>© 2026 Oneul Sinsang</small></footer></>;
}
