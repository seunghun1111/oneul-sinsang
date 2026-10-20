export const stageLabels={robots_request:"robots 요청",robots_body:"robots 본문 확인",product_request:"상품 요청",product_body:"상품 본문 읽기"};
export const categoryReasonLabels={page_limit:"페이지 상한 도달",repeated_page:"반복 페이지",structure:"상품 구조 미확인",request_failed:"요청 실패",incomplete:"완료 미확인",unexpected_empty:"기존 상품군 0건",sharp_drop:"상품 수 급감"};
export type FailureDetail={stage?:keyof typeof stageLabels;httpStatus?:number};
export type CategoryDiagnostic={label:string;pages?:number;requests?:number;newCount?:number;complete:boolean;holdReason?:keyof typeof categoryReasonLabels};
export type CollectionDiagnostics={attempts?:number;initialCodes?:string[];failures?:FailureDetail[];categories?:CategoryDiagnostic[]};
const object=(value:unknown):Record<string,unknown>=>value!==null&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
const count=(v:unknown,max=100000):number|undefined=>typeof v==="number"&&Number.isInteger(v)&&v>=0&&v<=max?v:undefined;
const codes=new Set(["dns","tls","timeout","connection","network","policy_blocked","policy_unavailable","restricted","http","structure","unknown"]);
const labels=new Set(["간편식사","즉석조리","과자류","아이스크림","식품","음료","생활용품"]);
/** Used both at report generation and the remote UI boundary; never pass raw objects through. */
export function collectionDiagnostics(value:unknown,fromHealth=false):CollectionDiagnostics|undefined{
 const raw=object(value),result:CollectionDiagnostics={};
 const attempts=count(raw.attempts,2);if(attempts&&attempts>=1)result.attempts=attempts;
 const initial=fromHealth?raw.initialCodes:[raw.initialFailureCode,...(Array.isArray(raw.initialFailureCodes)?raw.initialFailureCodes:[])];
 if(Array.isArray(initial)){const safe=[...new Set(initial.filter((v):v is string=>typeof v==="string"&&codes.has(v)))].slice(0,12);if(safe.length)result.initialCodes=safe;}
 const failures=fromHealth?raw.failures:[raw.failureDetail,...(Array.isArray(raw.failureDetails)?raw.failureDetails:[])];
 if(Array.isArray(failures)){
  const safe=failures.slice(0,16).map(object).map(row=>({...(typeof row.stage==="string"&&Object.hasOwn(stageLabels,row.stage)?{stage:row.stage as keyof typeof stageLabels}:{}),...(typeof row.httpStatus==="number"&&Number.isInteger(row.httpStatus)&&row.httpStatus>=100&&row.httpStatus<=599?{httpStatus:row.httpStatus}:{})})).filter(row=>Object.keys(row).length);
  if(safe.length)result.failures=safe;
 }
 if(Array.isArray(raw.categories)){
  const issues=Array.isArray(raw.categoryIssues)?raw.categoryIssues.map(object):[];
  const safe=raw.categories.slice(0,7).map(object).filter(row=>typeof row.label==="string"&&labels.has(row.label)&&typeof row.complete==="boolean").map(row=>{
   const reason=fromHealth?row.holdReason:issues.find(issue=>issue.label===row.label)?.reason;
   return {label:row.label as string,pages:count(row.pages,10),requests:count(row.requests,20),newCount:count(row.newCount),complete:row.complete as boolean,...(typeof reason==="string"&&Object.hasOwn(categoryReasonLabels,reason)?{holdReason:reason as keyof typeof categoryReasonLabels}:{})};
  });
  if(safe.length)result.categories=safe;
 }
 return Object.keys(result).length?result:undefined;
}
