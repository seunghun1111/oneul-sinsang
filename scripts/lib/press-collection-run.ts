import {collectionFetch} from "./collection-http.ts";
export type PressStatus={brand:string;status:"success"|"partial"|"failed";newCount:number;requestFailures:number;failureSince?:string};
export async function runPressCollection<T>(sources:readonly(readonly[string,(fetcher:typeof fetch)=>Promise<T[]>])[],checkedAt:string,previous:PressStatus[]=[],fetcher:typeof fetch=collectionFetch) {
  const results=await Promise.all(sources.map(async([brand,collect])=>{
    let requestFailures=0;
    const monitored:typeof fetch=async(input,init)=>{
      try {
        const response=await fetcher(input,init);
        if(!response.ok || !response.headers.get("content-type")?.toLowerCase().includes("text/html")) requestFailures++;
        return response;
      } catch {requestFailures++;throw new Error("공식 발표 요청 실패");}
    };
    let candidates:T[]=[];
    let status:PressStatus["status"]="success";
    try {candidates=await collect(monitored);if(requestFailures>0) status="partial";}
    catch {status="failed";}
    const prior=previous.find(result=>result.brand===brand);
    const result:PressStatus={brand,status,newCount:candidates.length,requestFailures,
      ...(status!=="success"?{failureSince:prior?.status!=="success"&&prior?.failureSince?prior.failureSince:checkedAt}:{})};
    return {candidates,result};
  }));
  return {candidates:results.flatMap(result=>result.candidates),report:{checkedAt,results:results.map(result=>result.result)}};
}
export function pressCollectionFailures(report:{results:PressStatus[]}) {
  return report.results.filter(result=>result.status!=="success").map(result=>`식품 발표 ${result.brand} / ${result.status==="partial"?"일부 요청 실패":"수집 실패"} / 발생 ${result.failureSince??"미확인"}`);
}
