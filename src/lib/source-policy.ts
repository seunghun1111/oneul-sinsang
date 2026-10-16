export type PolicyState="allowed"|"blocked"|"failed"|"not_provided"|"restricted"|"unknown"|"stale"|"partial";
export type PolicyReport={checkedAt:string;results:{brand:string;url:string;status:string;reason?:string}[]};
export const policyLabels:Record<PolicyState,string>={allowed:"정책상 허용",blocked:"자동 수집 보류",restricted:"접근 제한",failed:"정책 확인 실패",not_provided:"정책 미제공",unknown:"정책 점검 전",stale:"정책 재확인 필요",partial:"일부 경로 확인 필요"};
export function sourcePolicy(report:PolicyReport,brand:string,url:string,now=new Date()):{state:PolicyState;reason:string}{
 const row=report.results.find(r=>r.brand===brand&&r.url===url);
 if(!row)return {state:"unknown",reason:"이 안내 주소는 아직 정책 점검 결과가 없습니다."};
 const checked=Date.parse(report.checkedAt);
 if(!Number.isFinite(checked)||checked>now.getTime()||now.getTime()-checked>36*3600000)return {state:"stale",reason:"정책 확인 기록이 오래되었거나 유효하지 않습니다."};
 const state=["allowed","blocked","failed","not_provided","restricted"].includes(row.status)?row.status as PolicyState:"unknown";
 const reasons:Record<string,string>={allowed:"이 주소의 robots 정책상 수집 경로가 허용됩니다. 실제 수집 성공·법적 이용 허가는 별도입니다.",blocked:"robots 정책이 현재 수집 봇의 자동 접근을 제한합니다.",failed:"정책 응답 또는 네트워크 확인에 실패했습니다. 기존 상품은 보존합니다.",not_provided:"robots가 404·410으로 확인됐습니다. 수집 허가나 실제 수집 성공을 의미하지 않습니다.",restricted:"공통 수집 안전 규칙의 제한 대상입니다."};
 return {state,reason:reasons[state]??"정책 점검 결과를 확인할 수 없습니다."};
}
export function sourcePolicySummary(report:PolicyReport,brand:string,urls:string[],now=new Date()):PolicyState {
 const states=urls.map(url=>sourcePolicy(report,brand,url,now).state);
 if(!states.length||states.every(s=>s==="unknown"))return "unknown";
 return states.every(s=>s===states[0])?states[0]:"partial";
}
