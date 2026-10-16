import {discoveryEvidence,portalSearchLinks,type DiscoveryItem} from "../../lib/review/discovery-evidence";
export function DiscoveryPanel({product}:{product:DiscoveryItem}) {
  const evidence=discoveryEvidence(product);
  return <section className="discovery-panel" aria-label={product.name+" 발견·판매 근거"}>
    <dl><div><dt>신상 근거</dt><dd>{evidence.newLabel}</dd></div><div><dt>판매 근거</dt><dd>{evidence.saleLabel}</dd></div><div><dt>{evidence.dateLabel}</dt><dd>{evidence.date||"미확인"}</dd></div></dl>
    <div className="discovery-links">{portalSearchLinks(product).map(link=><a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>)}</div>
    {evidence.references.length>0&&<ul>{evidence.references.map((r,i)=><li key={i}><a href={r.url} target="_blank" rel="noopener noreferrer">{r.kind==="launch"?"출시":"판매"} {r.verified?"확인 근거":"검색 후보"} ↗</a> · {r.checkedAt.slice(0,10)}</li>)}</ul>}
    <p>검색 결과는 확인용이며 승인 근거로 자동 저장되지 않습니다. 원문·동일 상품·날짜를 확인하세요. 기프티콘 노출은 매장 판매 증거가 아닙니다.</p>
  </section>;
}
