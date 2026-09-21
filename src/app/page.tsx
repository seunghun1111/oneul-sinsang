import { Header } from "@/components/header";
import { ProductExplorer } from "@/components/product-explorer";
import { products } from "@/lib/products";

export default function Home() {
  return <><Header /><main>
    <section className="hero"><div className="hero-copy"><span className="hero-label">매일 업데이트되는 맛있는 소식</span><h1>오늘 나온 신상,<br /><em>놓치지 마세요.</em></h1><p>편의점부터 카페까지, 궁금했던 신상품을<br className="desktop-break" /> 가장 빠르고 보기 쉽게 모아드려요.</p></div>
      <div className="hero-art" aria-hidden="true"><span className="art-orbit orbit-one">NEW</span><span className="art-orbit orbit-two">🍩</span><span className="art-main">🛍️</span><span className="art-spark spark-one">✦</span><span className="art-spark spark-two">✦</span></div>
    </section>
    <ProductExplorer products={products} />
    <section className="about" id="about"><span aria-hidden="true">🔎</span><div><p className="section-kicker">ONEUL SINSANG</p><h2>새로운 맛을 찾는 가장 쉬운 방법</h2></div><p>공식 채널의 신제품 소식을 모아 중복은 줄이고, 꼭 필요한 출시 정보만 전해드려요.</p></section>
  </main><footer><strong>오늘신상</strong><span>오늘의 새로움을 발견하세요.</span><small>© 2026 Oneul Sinsang</small></footer></>;
}
