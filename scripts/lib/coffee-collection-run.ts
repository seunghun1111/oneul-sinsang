import type { CoffeeBrandSource } from "../../src/data/coffee-sources.ts";
import type { Product } from "../../src/types/product.ts";
import {collectionFailureCode,type CollectionFailureCode} from "./collection-failure.ts";
import {retryCollection} from "./collection-retry.ts";

type Result={candidates:Product[];verifiedUrls:string[];confirmedNotNewUrls?:string[];checked:number;failed:number;failureCodes?:CollectionFailureCode[]};
export type CoffeeCollectionStatus={brand:string;sourceId:string;checkedAt?:string;status:"success"|"partial"|"failed";checked:number;failed:number;newCount:number;failureSince?:string;reasonCode?:"unexpected_empty";failureCodes?:CollectionFailureCode[]};
export function mergeCoffeeReports(previous:{checkedAt:string;results:CoffeeCollectionStatus[]},current:{checkedAt:string;results:CoffeeCollectionStatus[]}) {
 const refreshed=new Map(current.results.map(row=>[row.sourceId,{...row,checkedAt:current.checkedAt}]));
 return {...current,results:[...previous.results.map(row=>refreshed.get(row.sourceId)??{...row,checkedAt:row.checkedAt??previous.checkedAt}),...current.results.filter(row=>!previous.results.some(prior=>prior.sourceId===row.sourceId)).map(row=>({...row,checkedAt:current.checkedAt}))]};
}
export function safeCoffeeVerifiedUrls(existing:Product[],observed:Product[],verifiedUrls:Set<string>) {
  const seen=new Set(observed.map(product=>`${product.brand}:${product.sourceUrl}`));
  const blocked=existing.filter(product=>product.isActive&&verifiedUrls.has(product.sourceUrl)&&!seen.has(`${product.brand}:${product.sourceUrl}`));
  const unsafe=new Set(blocked.map(product=>product.sourceUrl));
  return {verifiedUrls:new Set([...verifiedUrls].filter(url=>!unsafe.has(url))),blockedBrands:new Set(blocked.map(product=>product.brand))};
}
export function guardCoffeeEmptyNewLists(existing:Product[],observed:Product[],verifiedUrls:Set<string>,report:{checkedAt:string;results:CoffeeCollectionStatus[]},previous:CoffeeCollectionStatus[]=[],confirmedNotNewUrls=new Set<string>()) {
  const safe=safeCoffeeVerifiedUrls(existing.filter(p=>!(p.brand==="스타벅스"&&confirmedNotNewUrls.has(p.sourceUrl))),observed,verifiedUrls);
  return {verifiedUrls:safe.verifiedUrls,report:{...report,results:report.results.map(result=>{
    if(!safe.blockedBrands.has(result.brand)) return result;
    const prior=previous.find(item=>item.sourceId===result.sourceId);
    return {...result,status:result.status==="failed"?"failed" as const:"partial" as const,reasonCode:"unexpected_empty" as const,
      failureSince:prior?.status!=="success"&&prior?.failureSince?prior.failureSince:report.checkedAt};
  })}};
}
export async function runCoffeeCollection(sources:CoffeeBrandSource[],checkedAt:string,collect:(source:CoffeeBrandSource)=>Promise<Result>,previous:CoffeeCollectionStatus[]=[]) {
  const settled=await Promise.allSettled(sources.map(source=>retryCollection(()=>collect(source),result=>result.checked===0&&result.failed>0?result.failureCodes??[]:[])));
  const observed:Product[]=[];
  const verifiedUrls=new Set<string>();
  const confirmedNotNewUrls=new Set<string>();
  const results=settled.map((outcome,index):CoffeeCollectionStatus=>{
    const source=sources[index];
    const result=outcome.status==="fulfilled"?outcome.value:undefined;
    if(result) {observed.push(...result.candidates);result.verifiedUrls.forEach(url=>verifiedUrls.add(url));result.confirmedNotNewUrls?.forEach(url=>confirmedNotNewUrls.add(url));}
    const status=result && result.checked>0 ? result.failed>0?"partial":"success" : "failed";
    const prior=previous.find(item=>item.sourceId===source.id);
    return {brand:source.brand,sourceId:source.id,checkedAt,status,checked:result?.checked??0,failed:result?.failed??1,newCount:result?.candidates.length??0,
      ...(outcome.status==="rejected"?{failureCodes:[collectionFailureCode(outcome.reason)]}:result?.failureCodes?.length?{failureCodes:result.failureCodes}:{}),
      ...(status!=="success"?{failureSince:prior?.status!=="success" && prior?.failureSince?prior.failureSince:checkedAt}:{})};
  });
  return {observed,verifiedUrls,confirmedNotNewUrls,report:{checkedAt,results}};
}
export function coffeeCollectionFailures(report:{results:CoffeeCollectionStatus[]}) {
  return report.results.filter(result=>result.status!=="success").map(result=>`커피 ${result.brand} / ${result.reasonCode==="unexpected_empty"?"기존 경로 NEW가 갑자기 0건: 확인 필요 (기존 데이터 유지)":result.status==="partial"?"일부 경로 실패":"수집 실패"} / 발생 ${result.failureSince??"미확인"}`);
}
