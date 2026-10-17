export type CollectionGroup={id:string;label:string;brands:string[]};
export type CollectionHealthRow={id:string;group:string;groupLabel:string;brand:string;status:"success"|"partial"|"failed"|"not_checked";checkedAt?:string;lastSuccessfulAt?:string;newCount?:number;reason:string};
export type CollectionHealth={version:1;generatedAt:string;rows:CollectionHealthRow[]};
const validDate=(value:unknown,now:Date):value is string=>typeof value==="string"&&Number.isFinite(Date.parse(value))&&Date.parse(value)<=now.getTime();
const object=(value:unknown):Record<string,unknown>=>value!==null&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
const failureLabels:Record<string,string>={dns:"DNS 조회 실패",tls:"TLS 인증서 검증 실패",timeout:"요청 시간 초과",connection:"연결 실패",network:"네트워크 실패",policy_blocked:"robots 명시적 제한",policy_unavailable:"robots 정책 확인 실패",restricted:"접근 대상 제한",http:"공식 경로 HTTP 오류",structure:"상품 구조 확인 실패",unknown:"상세 원인 미확인"};
export function buildCollectionHealth(groups:CollectionGroup[],reports:Record<string,unknown>,previous:CollectionHealth|undefined,now=new Date()):CollectionHealth {
  const rows=groups.flatMap(group=>group.brands.map(brand=>{
    const id=`${group.id}:${brand}`;
    const report=object(reports[group.id]);
    const results=Array.isArray(report.results)?report.results.map(object):[];
    const result=results.find(result=>result.brand===brand);
    const priorRows=Array.isArray(previous?.rows)?previous.rows:[];
    const prior=priorRows.find(row=>row&&row.id===id);
    const checkedAt=validDate(report.checkedAt,now)?report.checkedAt:undefined;
    const recognized=result&&["success","partial","failed"].includes(String(result.status));
    const status:CollectionHealthRow["status"]=checkedAt&&recognized?result.status as CollectionHealthRow["status"]:"not_checked";
    const previousSuccess=validDate(prior?.lastSuccessfulAt,now)?prior.lastSuccessfulAt:undefined;
    const success=status==="success"?checkedAt:undefined;
    const lastSuccessfulAt=[previousSuccess,success].filter((v):v is string=>!!v).sort((a,b)=>Date.parse(b)-Date.parse(a))[0];
    const empty=result?.reasonCode==="unexpected_empty";
    const codes=[result?.failureCode,...(Array.isArray(result?.failureCodes)?result.failureCodes:[])];
    const detail=[...new Set(codes.filter((v):v is string=>typeof v==="string"&&Object.hasOwn(failureLabels,v)).map(v=>failureLabels[v]))].join(" · ");
    const reason=status==="not_checked"?"수집 결과 기록 없음 또는 유효한 확인 시각 없음":empty?"기존 NEW가 갑자기 0건입니다. 기존 상품을 유지하며 공식 목록·수집 구조 확인이 필요합니다.":status==="failed"?`${detail?detail+". ":""}수집에 실패했습니다. 기존 상품은 유지됩니다.`:status==="partial"?`${detail?detail+". ":""}일부 경로·기사 요청이 실패했습니다. 성공한 결과만 반영합니다.`:"정상 확인 (NEW 0건도 정상 결과일 수 있습니다)";
    const newCount=status!=="not_checked"&&typeof result?.newCount==="number"&&Number.isInteger(result.newCount)&&result.newCount>=0?result.newCount:undefined;
    return {id,group:group.id,groupLabel:group.label,brand,status,checkedAt:status!=="not_checked"?checkedAt:undefined,lastSuccessfulAt,newCount,reason};
  }));
  return {version:1,generatedAt:now.toISOString(),rows};
}
export function isCollectionStale(row:CollectionHealthRow,now=new Date()) {
  return !!row.checkedAt&&now.getTime()-Date.parse(row.checkedAt)>36*3600000;
}
export function needsCollectionAttention(row:CollectionHealthRow,now=new Date()) {
  return row.status==="not_checked"||row.status==="failed"||row.status==="partial"||isCollectionStale(row,now);
}
