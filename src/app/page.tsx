import { Header } from "@/components/header";
import { ProductExplorer } from "@/components/product-explorer";
import { CoffeeSourceDirectory } from "@/components/coffee-source-directory";
import { coffeeBrandSources } from "@/data/coffee-sources";
import { products } from "@/lib/products";

export default function Home() {
  return <><Header /><main>
    <section className="hero"><div className="hero-copy"><span className="hero-label">현재 판매 확인 신상품</span><h1>지금 살 수 있는<br /><em>새로운 상품만.</em></h1><p>최근 출시되고 현재 판매 중임이 확인된 상품을<br className="desktop-break" /> 한곳에서 확인해 보세요.</p></div>
      <div className="hero-art" aria-hidden="true"><span className="art-orbit orbit-one">NEW</span><span className="art-orbit orbit-two">🍩</span><span className="art-main">🛍️</span><span className="art-spark spark-one">✦</span><span className="art-spark spark-two">✦</span></div>
    </section>
    <ProductExplorer products={products} />
    <CoffeeSourceDirectory sources={coffeeBrandSources} />
    <section className="about" id="about"><span aria-hidden="true">🔎</span><div><p className="section-kicker">ONEUL SINSANG</p><h2>판매 중인 신상만 보여줍니다</h2></div><p>최근 90일 이내 출시·발견되고 14일 안에 판매가 다시 확인된 상품만 목록에 유지합니다.</p></section>
  </main><footer><strong>오늘신상</strong><span>비상업적 개인 프로젝트이며 각 브랜드와 제휴·후원 관계가 없습니다.</span><a href="https://github.com/seunghun1111/oneul-sinsang/issues/new?template=correction.yml" target="_blank" rel="noopener noreferrer">정정·삭제 요청</a><small>© 2026 Oneul Sinsang</small></footer></>;
}
