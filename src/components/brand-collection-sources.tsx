import type { BrandCollectionSource } from "@/data/food-brand-sources";
import {SourcePolicyBadge} from "./source-policy-badge";

export function BrandCollectionSources({ title, sources }: { title: string; sources: BrandCollectionSource[] }) {
  return <section className="brand-source-directory" aria-labelledby="brand-source-title">
    <div className="catalog-heading"><div><p className="section-kicker">OFFICIAL SOURCES</p><h2 id="brand-source-title">{title}</h2><p>공식 NEW 근거와 수집 정책이 검증된 상품을 공개합니다. 등록된 경로가 전체 상품·MD 수집을 뜻하지 않으며 출시일·매장 재고는 별도입니다.</p></div></div>
    <div className="brand-source-grid">{sources.map(source => <a href={source.url} target="_blank" rel="noopener noreferrer" key={source.brand}>
      <SourcePolicyBadge brand={source.brand} url={source.url}/>
      <strong>{source.brand}</strong><small>{source.label} ↗ · 수집 방식: {source.mode==="automatic"?"자동":"검수형"}</small>
    </a>)}</div>
  </section>;
}
