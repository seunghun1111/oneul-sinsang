"use client";
import {useMemo,useState} from "react";
import {isCollectionStale,needsCollectionAttention,type CollectionHealth} from "../../lib/review/collection-health";
const labels={success:"정상",partial:"일부 확인 필요",failed:"확인 필요",not_checked:"기록 없음"};
function time(value?:string) {
  if(!value||!Number.isFinite(Date.parse(value))) return "기록 없음";
  return new Intl.DateTimeFormat("ko-KR",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value));
}
export function CollectionHealthPanel({health,error,loading}:{health:CollectionHealth|null;error:string;loading:boolean}) {
  const [group,setGroup]=useState("all");
  const [query,setQuery]=useState("");
  const [onlyIssues,setOnlyIssues]=useState(false);
  const now=useMemo(()=>new Date(),[health]);
  const rows=health?.rows??[];
  const groups=[...new Map(rows.map(row=>[row.group,row.groupLabel])).entries()];
  const attention=rows.filter(row=>needsCollectionAttention(row,now)).length;
  const unknown=rows.filter(row=>row.status==="not_checked").length;
  const normal=rows.filter(row=>row.status==="success"&&!isCollectionStale(row,now)).length;
  const visible=rows.filter(row=>(group==="all"||row.group===group)&&row.brand.toLowerCase().includes(query.toLowerCase())&&(!onlyIssues||needsCollectionAttention(row,now)));
  return <details className="collection-health" open>
    <summary>수집 운영 현황 <span>{attention}개 확인 필요 · {unknown}개 기록 없음</span></summary>
    <p>상품 승인 상태와 별개인 수집기 상태입니다. 마지막 정상 확인은 전체 성공 기록만 표시합니다. 36시간 넘게 갱신되지 않은 결과는 재확인이 필요합니다.</p>
    {loading&&<p role="status">운영 현황 조회 중…</p>}
    {error&&<p role="alert" className="collection-warning">{error}</p>}
    {!loading&&!error&&rows.length===0&&<p>아직 수집 실행 기록이 없습니다. 다음 자동 수집 후 표시됩니다.</p>}
    {rows.length>0&&<>
      <div className="collection-counts"><span>정상 <strong>{normal}</strong></span><span>확인 필요 <strong>{attention}</strong></span><span>기록 없음 <strong>{unknown}</strong></span><small>현황 생성 {time(health?.generatedAt)} · 한국 시간</small></div>
      <div className="collection-filters"><label>수집 그룹<select value={group} onChange={event=>setGroup(event.target.value)}><option value="all">전체</option>{groups.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label>수집 브랜드 검색<input value={query} onChange={event=>setQuery(event.target.value)} placeholder="브랜드명"/></label><label className="collection-issues"><input type="checkbox" checked={onlyIssues} onChange={event=>setOnlyIssues(event.target.checked)}/>확인 필요만</label></div>
      <div className="collection-table-wrap" role="region" aria-label="브랜드별 수집 현황 표" tabIndex={0}><table><caption className="sr-only">브랜드별 수집 결과와 마지막 정상 확인 시각</caption><thead><tr><th scope="col">브랜드 / 그룹</th><th scope="col">상태 / 최근 확인</th><th scope="col">마지막 정상 확인</th><th scope="col">NEW 후보</th><th scope="col">확인 사유</th></tr></thead><tbody>{visible.map(row=><tr key={row.id}><th scope="row">{row.brand}<small>{row.groupLabel}</small></th><td><b className={`collection-state ${isCollectionStale(row,now)?"partial":row.status}`}>{isCollectionStale(row,now)?"갱신 지연":labels[row.status]}</b><small>{time(row.checkedAt)}</small></td><td>{time(row.lastSuccessfulAt)}</td><td>{row.newCount??"—"}</td><td>{isCollectionStale(row,now)&&<strong>최근 결과가 36시간 넘게 갱신되지 않았습니다. </strong>}{row.reason}</td></tr>)}</tbody></table></div>
      {visible.length===0&&<p>선택한 조건에 해당하는 수집 기록이 없습니다.</p>}
    </>}
  </details>;
}
