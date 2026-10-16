import {createCollectionFetcher,createRobotsFetcher,collectionUrlAllowed} from "./collection-http.ts";
import {networkFailure,networkFailureLabels,type NetworkFailure} from "./network-failure.ts";
import {collectionFailureCode} from "./collection-failure.ts";
export function createPolicyPreflight(fetcher:typeof fetch=fetch){
 const policies=new Map<string,number>();
 const failures=new Map<string,NetworkFailure>();
 const transport=createCollectionFetcher(async(input,init)=>{
   const url=new URL(input instanceof Request?input.url:String(input));
   // Never request a product endpoint during a preflight: only fetch robots.txt.
   if(url.pathname!=="/robots.txt")return new Response(null,{status:204});
   try{const response=await fetcher(input,init);policies.set(url.origin,response.status);failures.delete(url.origin);return response;}
   catch(error){policies.delete(url.origin);failures.set(url.origin,networkFailure(error));throw error;}
 });
 const probe=createRobotsFetcher(transport);
 return async(url:string)=>{
   if(!collectionUrlAllowed(url))return {status:"restricted",reason:"수집 대상 URL 제한"};
   try{
     await probe(url);
     const policyHttpStatus=policies.get(new URL(url).origin);
     return {status:[404,410].includes(policyHttpStatus??0)?"not_provided":"allowed",reason:"",policyHttpStatus};
   }catch(error){
     const blocked=collectionFailureCode(error)==="policy_blocked";
     const policyHttpStatus=policies.get(new URL(url).origin);
     const failureKind=failures.get(new URL(url).origin);
     const reason=blocked?"robots 명시적 차단":policyHttpStatus&&!([200,204].includes(policyHttpStatus))?`정책 HTTP ${policyHttpStatus}`:policyHttpStatus?"정책 형식·본문 검증 실패":networkFailureLabels[failureKind??"network"];
     return {status:blocked?"blocked":"failed",reason,policyHttpStatus,...(failureKind?{failureKind}:{})};
   }
 };
}
