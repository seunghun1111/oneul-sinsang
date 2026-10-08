import type { BrandCollectionSource } from "@/data/food-brand-sources";

export function BrandCollectionSources({ title, sources }: { title: string; sources: BrandCollectionSource[] }) {
  return <section className="brand-source-directory" aria-labelledby="brand-source-title">
    <div className="catalog-heading"><div><p className="section-kicker">OFFICIAL SOURCES</p><h2 id="brand-source-title">{title}</h2><p>공식 NEW 전용 목록은 자동 수집하고, 일반 공식 메뉴는 과거 상품 혼입을 막기 위해 검수형으로 확인합니다.</p></div></div>
    <div className="brand-source-grid">{sources.map(source => <a href={source.url} target="_blank" rel="noopener noreferrer" key={source.brand}>
      <span className={`source-status ${source.mode === "automatic" ? "" : "status-unknown"}`}>{source.mode === "automatic" ? "자동 수집" : "검수형"}</span>
      <strong>{source.brand}</strong><small>{source.label} ↗</small>
    </a>)}</div>
  </section>;
}
