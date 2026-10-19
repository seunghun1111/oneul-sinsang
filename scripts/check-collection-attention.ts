import {readFile,writeFile} from "node:fs/promises";
import {coffeeBrandSources} from "../src/data/coffee-sources.ts";
import {needsCollectionAttention,type CollectionHealth} from "../chatgpt-site/lib/review/collection-health.ts";
import {collectCoffeeSource} from "./lib/coffee-collector.ts";
import {collectLotteria,collectMomstouch} from "./lib/foodservice-collector.ts";
import {collectionFailureCode} from "./lib/collection-failure.ts";
import {collectionRemediation} from "./lib/collection-remediation.ts";
import {coffeeProducts} from "../src/data/coffee-products.ts";
import {collectSevenEleven} from "./lib/convenience-collector.ts";
import {retryCollection} from "./lib/collection-retry.ts";
import {createCollectionFetcher} from "./lib/collection-http.ts";
import {diagnosePolicyResponse} from "./lib/policy-diagnosis.ts";

// Diagnostic only: never merge products, update health timestamps, or send notifications.
const data=new URL("../src/data/",import.meta.url);
const health=JSON.parse(await readFile(new URL("collection-health.json",data),"utf8")) as CollectionHealth;
const targets=health.rows.filter(row=>needsCollectionAttention(row));
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
  for(const channel of source.channels.filter(channel=>["menu","md","shop"].includes(channel.kind))){
   const result=await retryCollection(()=>collectCoffeeSource({...source,channels:[channel]},checkedAt),result=>result.checked===0?result.failureCodes??[]:[]);
   paths.push({url:channel.url,kind:channel.kind,status:result.failed?"failed":"checked",newCount:result.candidates.length,failureCodes:result.failureCodes,...(result.failureCodes?.includes("policy_unavailable")?{policyDiagnosis:await diagnosePolicy(channel.url)}:{})});
  }
 }else{
  const collect=target.brand==="롯데리아"?collectLotteria:target.brand==="맘스터치"?collectMomstouch:target.brand==="세븐일레븐"?collectSevenEleven:undefined;
  if(collect){try{const products=await retryCollection<unknown[]>(()=>collect(checkedAt));paths.push({status:"checked",newCount:products.length});}catch(error){const code=collectionFailureCode(error);paths.push({status:"failed",failureCodes:[code],...(code==="policy_unavailable"&&target.brand==="맘스터치"?{policyDiagnosis:await diagnosePolicy("https://www.momstouch.co.kr/")}:{})});}}
  else paths.push({status:"not_supported"});
 }
 const classified=paths.map(path=>{
  const existing="url" in path&&coffeeProducts.some(product=>product.brand===target.brand&&product.sourceUrl===path.url&&product.isActive&&product.newStatus!=="removed");
  const unexpectedEmpty=!!existing&&path.status==="checked"&&path.newCount===0;
  const codes="failureCodes" in path?path.failureCodes??[]:[];
  return {...path,...(unexpectedEmpty?{status:"needs_review",reasonCode:"unexpected_empty"}:{}),remediation:collectionRemediation(codes,unexpectedEmpty)};
 });
 const row={brand:target.brand,previousStatus:target.status,previousCheckedAt:target.checkedAt,paths:classified};
 results.push(row);console.log(JSON.stringify(row));
}
await writeFile(new URL("../docs/collection-attention-current.json",import.meta.url),JSON.stringify({checkedAt,scope:"확인 필요 항목의 실제 수집기 진단. 상품·운영 상태·검수·알림 변경 없음. checked/NEW 0건은 기존 상품의 NEW 종료 근거가 아님",targetCount:targets.length,results},null,2)+"\n");
