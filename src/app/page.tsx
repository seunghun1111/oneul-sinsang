import { Header } from "@/components/header";
import { ProductExplorer } from "@/components/product-explorer";
import { products } from "@/lib/products";

export default function Home() {
  return <><Header /><main>
    <section className="hero"><div className="hero-copy"><span className="hero-label">오늘신상 화면 미리 보기</span><h1>새로운 맛을 찾는<br /><em>화면을 살펴보세요.</em></h1><p>카테고리 필터와 상품 상세 화면을<br className="desktop-break" /> 예시 상품으로 미리 둘러볼 수 있습니다.</p></div>
      <div className="hero-art" aria-hidden="true"><span className="art-orbit orbit-one">NEW</span><span className="art-orbit orbit-two">🍩</span><span className="art-main">🛍️</span><span className="art-spark spark-one">✦</span><span className="art-spark spark-two">✦</span></div>
    </section>
    <ProductExplorer products={products} />
    <section className="about" id="about"><span aria-hidden="true">🔎</span><div><p className="section-kicker">ONEUL SINSANG</p><h2>새로운 맛을 찾는 가장 쉬운 방법</h2></div><p>이 페이지는 디자인과 탐색 기능을 확인하는 미리 보기입니다. 실제 상품 정보는 공식 출처를 확인한 뒤 별도 서버 사이트에 제공합니다.</p></section>
  </main><footer><strong>오늘신상</strong><span>오늘의 새로움을 발견하세요.</span><small>© 2026 Oneul Sinsang</small></footer></>;
}
