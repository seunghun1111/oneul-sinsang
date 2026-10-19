import {collectionFailureCode,type CollectionFailureCode} from "./collection-failure.ts";
import {retryCollection} from "./collection-retry.ts";
export type BrandCollectionStatus={brand:string;status:"success"|"failed";newCount:number;failureSince?:string;reasonCode?:"unexpected_empty";failureCode?:CollectionFailureCode};
export async function runBrandCollection<T>(sources:readonly (readonly [string,(checkedAt:string)=>Promise<T[]>])[],checkedAt:string,previous:BrandCollectionStatus[]=[]) {
  const settled=await Promise.allSettled(sources.map(([,collect])=>retryCollection(()=>collect(checkedAt))));
  const candidates:T[]=[];
  const checkedBrands:string[]=[];
  const results=settled.map((outcome,index):BrandCollectionStatus=>{
    const brand=sources[index][0];
    if(outcome.status==="fulfilled") {
      candidates.push(...outcome.value);checkedBrands.push(brand);
      return {brand,status:"success",newCount:outcome.value.length};
    }
    const prior=previous.find(result=>result.brand===brand);
    // Never persist raw exceptions, which may contain sensitive request information.
    return {brand,status:"failed",newCount:0,failureCode:collectionFailureCode(outcome.reason),failureSince:prior?.status==="failed"&&prior.failureSince?prior.failureSince:checkedAt};
  });
  return {candidates,checkedBrands,report:{checkedAt,results}};
}
export function brandCollectionFailures(report:{results:BrandCollectionStatus[]},group:string) {
  return report.results.filter(result=>result.status==="failed").map(result=>`${group} ${result.brand} / ${result.reasonCode==="unexpected_empty"?"기존 NEW 목록이 갑자기 0건: 구조·실제 종료 확인 필요 (기존 데이터 유지)":"수집 실패"} / 발생 ${result.failureSince??"미확인"}`);
}
