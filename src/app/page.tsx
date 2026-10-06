import { Header } from "@/components/header";
import { ProductExplorer } from "@/components/product-explorer";
import { CoffeeSourceDirectory } from "@/components/coffee-source-directory";
import { TodayUpdates } from "@/components/today-updates";
import { coffeeBrandSources } from "@/data/coffee-sources";
import { getTodayProducts, products, seoulDateKey } from "@/lib/products";

export default function Home() {
  const now = new Date();
  const todayProducts = getTodayProducts(now);
  return <><Header /><main>
    <section className="hero"><div className="hero-copy"><span className="hero-label">현재 판매 확인 신상품</span><h1>지금 살 수 있는<br /><em>새로운 상품만.</em></h1><p>최근 출시되고 현재 판매 중임이 확인된 상품을<br className="desktop-break" /> 한곳에서 확인해 보세요.</p></div>
      <div className="hero-art" aria-hidden="true"><span className="art-orbit orbit-one">NEW</span><span className="art-orbit orbit-two">🍩</span><span className="art-main">🛍️</span><span className="art-spark spark-one">✦</span><span className="art-spark spark-two">✦</span></div>
    </section>
    <TodayUpdates products={todayProducts} date={seoulDateKey(now).replaceAll("-", ".")} />
    <ProductExplorer products={products} />
    <CoffeeSourceDirectory sources={coffeeBrandSources} />
    <section className="about" id="about"><span aria-hidden="true">🔎</span><div><p className="section-kicker">ONEUL SINSANG</p><h2>판매 중인 신상만 보여줍니다</h2></div><p>모든 상품은 공식 출시일을 기준으로 최근 30일간 표시하며, 출시일이 공개되지 않은 편의점 상품은 최초 확인일부터 30일간 표시합니다.</p></section>
  </main><footer><strong>오늘신상</strong><span>비상업적 개인 프로젝트이며 각 브랜드와 제휴·후원 관계가 없습니다.</span><a href="https://github.com/seunghun1111/oneul-sinsang/issues/new?template=correction.yml" target="_blank" rel="noopener noreferrer">정정·삭제 요청</a><small>© 2026 Oneul Sinsang</small></footer></>;
}
