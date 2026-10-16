import type { BrandCollectionSource } from "@/data/food-brand-sources";
import {SourcePolicyBadge} from "./source-policy-badge";

export function BrandCollectionSources({ title, sources }: { title: string; sources: BrandCollectionSource[] }) {
  return <section className="brand-source-directory" aria-labelledby="brand-source-title">
    <div className="catalog-heading"><div><p className="section-kicker">OFFICIAL SOURCES</p><h2 id="brand-source-title">{title}</h2><p>공식 목록의 NEW 표시를 매일 확인합니다. 출시일이 확인되지 않은 추가 브랜드 상품은 검수 승인 후 공개합니다.</p></div></div>
    <div className="brand-source-grid">{sources.map(source => <a href={source.url} target="_blank" rel="noopener noreferrer" key={source.brand}>
      <SourcePolicyBadge brand={source.brand} url={source.url}/>
      <strong>{source.brand}</strong><small>{source.label} ↗ · 수집 방식: {source.mode==="automatic"?"자동":"검수형"}</small>
    </a>)}</div>
  </section>;
}
