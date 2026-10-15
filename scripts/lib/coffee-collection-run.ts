import type { CoffeeBrandSource } from "../../src/data/coffee-sources.ts";
import type { Product } from "../../src/types/product.ts";

type Result={candidates:Product[];verifiedUrls:string[];checked:number;failed:number};
export type CoffeeCollectionStatus={brand:string;sourceId:string;status:"success"|"partial"|"failed";checked:number;failed:number;newCount:number;failureSince?:string};
export async function runCoffeeCollection(sources:CoffeeBrandSource[],checkedAt:string,collect:(source:CoffeeBrandSource)=>Promise<Result>,previous:CoffeeCollectionStatus[]=[]) {
  const settled=await Promise.allSettled(sources.map(source=>Promise.resolve().then(()=>collect(source))));
  const observed:Product[]=[];
  const verifiedUrls=new Set<string>();
  const results=settled.map((outcome,index):CoffeeCollectionStatus=>{
    const source=sources[index];
    const result=outcome.status==="fulfilled"?outcome.value:undefined;
    if(result) {observed.push(...result.candidates);result.verifiedUrls.forEach(url=>verifiedUrls.add(url));}
    const status=result && result.checked>0 ? result.failed>0?"partial":"success" : "failed";
    const prior=previous.find(item=>item.sourceId===source.id);
    return {brand:source.brand,sourceId:source.id,status,checked:result?.checked??0,failed:result?.failed??1,newCount:result?.candidates.length??0,
      ...(status!=="success"?{failureSince:prior?.status!=="success" && prior?.failureSince?prior.failureSince:checkedAt}:{})};
  });
  return {observed,verifiedUrls,report:{checkedAt,results}};
}
export function coffeeCollectionFailures(report:{results:CoffeeCollectionStatus[]}) {
  return report.results.filter(result=>result.status!=="success").map(result=>`커피 ${result.brand} / ${result.status==="partial"?"일부 경로 실패":"수집 실패"} / 발생 ${result.failureSince??"미확인"}`);
}
