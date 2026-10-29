import type {CoffeeBrandSource} from "../../src/data/coffee-sources.ts";
import type {Product} from "../../src/types/product.ts";
import {collectCoffeeBrand} from "./coffee-collector.ts";
import {guardCoffeeEmptyNewLists,runCoffeeCollection} from "./coffee-collection-run.ts";
import {needsCollectionAttention,type CollectionHealth} from "../../chatgpt-site/lib/review/collection-health.ts";

export function selectAttentionTargets(health:CollectionHealth,args:readonly string[]){
 const requested=[...new Set(args.map(arg=>{
  if(!arg.startsWith("--brand=")||!arg.slice(8).trim())throw Error("--brand=브랜드명만 지원합니다.");
  return arg.slice(8).trim();
 }))];
 if(requested.some(brand=>!health.rows.some(row=>row.brand===brand)))throw Error("등록되지 않은 브랜드입니다.");
 const targets=health.rows.filter(row=>needsCollectionAttention(row)&&(!requested.length||requested.includes(row.brand)));
 const skippedBrands=requested.filter(brand=>!targets.some(row=>row.brand===brand));
 return {requested,targets,skippedBrands};
}

/** Read-only: run the production adapter and empty-list guard without merging or saving state. */
export async function diagnoseCoffeeSource(
 source:CoffeeBrandSource,checkedAt:string,existing:Product[],
 collect:(source:CoffeeBrandSource)=>ReturnType<typeof collectCoffeeBrand>=source=>collectCoffeeBrand(source,checkedAt),
){
 const batch=await runCoffeeCollection([source],checkedAt,collect);
 const {report}=guardCoffeeEmptyNewLists(existing,batch.observed,batch.verifiedUrls,batch.report,[],batch.confirmedNotNewUrls);
 const row=report.results[0];
 return {
  status:row.reasonCode==="unexpected_empty"?"needs_review":row.status==="success"?"checked":row.status,
  newCount:row.newCount,checked:row.checked,failed:row.failed,attempts:row.attempts,
  initialFailureCodes:row.initialFailureCodes,failureCodes:row.failureCodes,
  failureDetails:row.failureDetails,...(row.reasonCode?{reasonCode:row.reasonCode}:{}),
 };
}
