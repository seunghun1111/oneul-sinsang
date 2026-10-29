import type {Product} from "../../src/types/product.ts";
import {isCurrentlyOnSale} from "../../src/lib/product-window.ts";
import {catalogQuality,QUALITY_FRESHNESS_HOURS} from "./catalog-quality.ts";

export const qualityActions={
 repair_data:"상품 ID·날짜·출처 등 데이터 오류를 먼저 수정합니다.",
 refresh_snapshot:"최신 수집 실행 결과와 로컬 기록을 대조합니다. 오래된 기록만으로 운영 장애를 판단하지 않습니다.",
 inspect_collector:"최근 수집 실패·부분 실패의 상세 원인을 확인합니다.",
 recheck_products:"상품별 마지막 확인 시각과 실제 수집 범위를 대조합니다. NEW 종료로 처리하지 않습니다.",
 map_images:"공식 상품 카드의 이미지 연결을 점검합니다. 이미지 유효성 검사는 별도입니다.",
 map_categories:"공식 상품 분류를 확인해 세부 카테고리를 보완합니다.",
} as const;
type Action=keyof typeof qualityActions;
type Evidence="current"|"stale"|"missing"|"invalid";
const object=(value:unknown):Record<string,unknown>=>value!==null&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
function freshness(value:unknown,now:Date):Evidence{
 if(value===undefined||value===null)return "missing";
 if(typeof value!=="string"||!Number.isFinite(Date.parse(value))||Date.parse(value)>now.getTime())return "invalid";
 return now.getTime()-Date.parse(value)>QUALITY_FRESHNESS_HOURS*3600000?"stale":"current";
}
const count=(values:readonly string[])=>Object.fromEntries([...new Set(values)].sort().map(key=>[key,values.filter(value=>value===key).length]));

/** Local evidence only: no requests, mutations, or inference that an old snapshot is an outage. */
export function catalogQualitySummary(products:Product[],health:unknown,now=new Date()){
 const report=catalogQuality(products,now);
 const snapshot=object(health);
 const snapshotState=freshness(snapshot.generatedAt,now);
 const rows=Array.isArray(snapshot.rows)?snapshot.rows.map(object):[];
 const publicProducts=products.filter(product=>isCurrentlyOnSale(product,now));
 const brands=[...new Set([...products.map(product=>product.brand),...rows.flatMap(row=>typeof row.brand==="string"?[row.brand]:[])])].map(brand=>{
  const published=publicProducts.filter(product=>product.brand===brand);
  const errors=report.errors.filter(error=>error.brand===brand);
  const gaps=report.gaps.filter(gap=>gap.brand===brand);
  const issues=count(gaps.flatMap(gap=>gap.issues));
  const checks=rows.filter(row=>row.brand===brand);
  const statuses=[...new Set(checks.flatMap(row=>["success","partial","failed","not_checked"].includes(String(row.status))?[String(row.status)]:[]))].sort();
  const states=checks.map(row=>freshness(row.checkedAt,now));
  const evidence:Evidence=snapshotState!=="current"?snapshotState:!checks.length?"missing":states.includes("invalid")?"invalid":states.includes("missing")?"missing":states.includes("stale")?"stale":"current";
  const confirmedFailure=evidence==="current"&&statuses.some(status=>status==="partial"||status==="failed");
  const unknownStatus=statuses.length===0||statuses.includes("not_checked")||checks.some(row=>!["success","partial","failed","not_checked"].includes(String(row.status)));
  const actions:Action[]=[];
  if(errors.length)actions.push("repair_data");
  if(evidence!=="current"||unknownStatus)actions.push("refresh_snapshot");
  if(confirmedFailure)actions.push("inspect_collector");
  if(issues.stale_check)actions.push("recheck_products");
  if(issues.missing_image)actions.push("map_images");
  if(issues.missing_subcategory)actions.push("map_categories");
  const times=published.map(product=>product.lastCheckedAt).filter(value=>["current","stale"].includes(freshness(value,now))).sort((a,b)=>Date.parse(a)-Date.parse(b));
  return {brand,published:published.length,errorCount:errors.length,errorCounts:count(errors.map(error=>error.code)),affectedPublicProducts:gaps.length,issues,
   ...(times.length?{oldestProductCheckAt:times[0]}:{}),collection:{evidence,statuses},actions,
   priority:errors.length?0:confirmedFailure?1:issues.stale_check||evidence!=="current"||unknownStatus?2:actions.length?3:4};
 }).filter(row=>row.actions.length).sort((a,b)=>a.priority-b.priority||b.affectedPublicProducts-a.affectedPublicProducts||a.brand.localeCompare(b.brand,"ko"));
 return {...report,summary:{
  freshnessHours:QUALITY_FRESHNESS_HOURS,
  snapshot:{state:snapshotState,...(typeof snapshot.generatedAt==="string"&&["current","stale"].includes(snapshotState)?{generatedAt:snapshot.generatedAt}:{})},
  affectedPublicProducts:report.gaps.length,issueCounts:count(report.gaps.flatMap(gap=>gap.issues)),
  errorCounts:count(report.errors.map(error=>error.code)),brands,
 }};
}
