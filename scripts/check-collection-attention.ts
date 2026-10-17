import {readFile,writeFile} from "node:fs/promises";
import {coffeeBrandSources} from "../src/data/coffee-sources.ts";
import {needsCollectionAttention,type CollectionHealth} from "../chatgpt-site/lib/review/collection-health.ts";
import {collectCoffeeSource} from "./lib/coffee-collector.ts";
import {collectLotteria,collectMomstouch} from "./lib/foodservice-collector.ts";
import {collectionFailureCode} from "./lib/collection-failure.ts";

// Diagnostic only: never merge products, update health timestamps, or send notifications.
const data=new URL("../src/data/",import.meta.url);
const health=JSON.parse(await readFile(new URL("collection-health.json",data),"utf8")) as CollectionHealth;
const targets=health.rows.filter(row=>needsCollectionAttention(row));
const checkedAt=new Date().toISOString();
const results=[];
for(const target of targets){
 const source=coffeeBrandSources.find(source=>source.brand===target.brand);
 const paths=[];
 if(source){
  for(const channel of source.channels.filter(channel=>["menu","md","shop"].includes(channel.kind))){
   const result=await collectCoffeeSource({...source,channels:[channel]},checkedAt);
   paths.push({url:channel.url,kind:channel.kind,status:result.failed?"failed":"checked",newCount:result.candidates.length,failureCodes:result.failureCodes});
  }
 }else{
  const collect=target.brand==="롯데리아"?collectLotteria:target.brand==="맘스터치"?collectMomstouch:undefined;
  if(collect){try{const products=await collect(checkedAt);paths.push({status:"checked",newCount:products.length});}catch(error){paths.push({status:"failed",failureCodes:[collectionFailureCode(error)]});}}
  else paths.push({status:"not_supported"});
 }
 const row={brand:target.brand,previousStatus:target.status,previousCheckedAt:target.checkedAt,paths};
 results.push(row);console.log(JSON.stringify(row));
}
await writeFile(new URL("../docs/collection-attention-current.json",import.meta.url),JSON.stringify({checkedAt,scope:"확인 필요 항목의 실제 수집기 진단. 상품·운영 상태·검수·알림 변경 없음. checked/NEW 0건은 기존 상품의 NEW 종료 근거가 아님",targetCount:targets.length,results},null,2)+"\n");
