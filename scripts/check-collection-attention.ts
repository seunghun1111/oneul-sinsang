import {readFile,writeFile} from "node:fs/promises";
import {coffeeBrandSources} from "../src/data/coffee-sources.ts";
import {type CollectionHealth} from "../chatgpt-site/lib/review/collection-health.ts";
import {diagnoseCoffeeSource,selectAttentionTargets} from "./lib/collection-attention.ts";
import {collectLotteria,collectMomstouch} from "./lib/foodservice-collector.ts";
import {collectionFailureCode,collectionFailureDetail} from "./lib/collection-failure.ts";
import {collectionRemediation} from "./lib/collection-remediation.ts";
import type {Product} from "../src/types/product.ts";
import {collectSevenEleven} from "./lib/convenience-collector.ts";
import {retryCollection} from "./lib/collection-retry.ts";
import {createCollectionFetcher} from "./lib/collection-http.ts";
import {diagnosePolicyResponse} from "./lib/policy-diagnosis.ts";

// Diagnostic only: never merge products, update health timestamps, or send notifications.
const data=new URL("../src/data/",import.meta.url);
const health=JSON.parse(await readFile(new URL("collection-health.json",data),"utf8")) as CollectionHealth;
const {requested,targets,skippedBrands}=selectAttentionTargets(health,process.argv.slice(2));
const existing=JSON.parse(await readFile(new URL("coffee-products-auto.json",data),"utf8")) as Product[];
const checkedAt=new Date().toISOString();
const results=[];
const transport=createCollectionFetcher(),policyChecks=new Map<string,Promise<ReturnType<typeof diagnosePolicyResponse>|{status:string}>>();
function diagnosePolicy(url:string){
 const origin=new URL(url).origin;
 if(!policyChecks.has(origin))policyChecks.set(origin,(async()=>{
  try{const response=await transport(origin+"/robots.txt");const result=diagnosePolicyResponse({status:response.status,contentType:response.headers.get("content-type"),location:response.headers.get("location")},origin);await response.body?.cancel();return result;}
  catch(error){return {status:collectionFailureCode(error)};}
 })());
 return policyChecks.get(origin)!;
}
for(const target of targets){
 const source=coffeeBrandSources.find(source=>source.brand===target.brand);
 const paths=[];
 if(source){
  // Starbucks discovers drink/food/MD together; calling its adapter per channel duplicates work.
  const channels=source.id==="starbucks"?[undefined]:source.channels.filter(channel=>["menu","md","shop"].includes(channel.kind));
  if(!channels.length)paths.push({status:"not_supported"});
  for(const channel of channels){
   const result=await diagnoseCoffeeSource(channel?{...source,channels:[channel]}:source,checkedAt,existing);
   const url=channel?.url??"https://www.starbucks.co.kr/menu/drink_list.do";
   paths.push({...(channel?{url,kind:channel.kind}:{scope:"brand"}),...result,...(result.failureCodes?.includes("policy_unavailable")?{policyDiagnosis:await diagnosePolicy(url)}:{})});
  }
 }else{
  const collect=target.brand==="롯데리아"?collectLotteria:target.brand==="맘스터치"?collectMomstouch:target.brand==="세븐일레븐"?collectSevenEleven:undefined;
  if(collect){let attempts=0;try{const products=await retryCollection<unknown[]>(()=>{attempts++;return collect(checkedAt);});paths.push({status:"checked",newCount:products.length,attempts});}catch(error){const code=collectionFailureCode(error);paths.push({status:"failed",attempts,failureCodes:[code],failureDetail:collectionFailureDetail(error),...(code==="policy_unavailable"&&target.brand==="맘스터치"?{policyDiagnosis:await diagnosePolicy("https://www.momstouch.co.kr/")}:{})});}}
  else paths.push({status:"not_supported"});
 }
 const classified=paths.map(path=>{
  const unexpectedEmpty="reasonCode" in path&&path.reasonCode==="unexpected_empty";
  const codes="failureCodes" in path?path.failureCodes??[]:[];
  return {...path,remediation:path.status==="not_supported"?{category:"not_supported",action:"개별 진단 수집기가 연결되지 않았습니다. 정상 확인으로 간주하지 않습니다."}:collectionRemediation(codes,unexpectedEmpty)};
 });
 const row={brand:target.brand,previousStatus:target.status,previousCheckedAt:target.checkedAt,paths:classified};
 results.push(row);console.log(JSON.stringify(row));
}
await writeFile(new URL(requested.length?"../docs/collection-attention-selected.json":"../docs/collection-attention-current.json",import.meta.url),JSON.stringify({checkedAt,scope:"확인 필요 항목의 실제 수집기 진단. 상품·운영 상태·검수·알림 변경 없음. checked/NEW 0건은 기존 상품의 NEW 종료 근거가 아님",...(requested.length?{selectedBrands:requested,skippedBrands}:{}),targetCount:targets.length,results},null,2)+"\n");
