import {readFile,writeFile} from "node:fs/promises";
import {collectionFetch} from "./lib/collection-http.ts";
import {collectionFailureCode} from "./lib/collection-failure.ts";

const policy=JSON.parse(await readFile(new URL("../src/data/collection-policy-status.json",import.meta.url),"utf8"));
if(!Number.isFinite(Date.parse(policy.checkedAt))||Math.abs(Date.now()-Date.parse(policy.checkedAt))>3600000)throw Error("먼저 check:policies로 정책 점검을 갱신하세요.");
const rows=policy.results as {brand:string;url:string;status:string;reason:string;method?:string}[];
const results:Record<string,unknown>[]=[];let index=0;
async function worker(){while(index<rows.length){
 const row=rows[index++];
 if(!["allowed","not_provided"].includes(row.status)){results.push({...row,check:"policy_hold"});continue;}
 if(row.method&&row.method!=="GET"){results.push({brand:row.brand,url:row.url,method:row.method,check:"collector_method_required"});continue;}
 try{
  const response=await collectionFetch(row.url,{signal:AbortSignal.timeout(20000)});
  let redirect:string|undefined;
  const location=response.headers.get("location");
  if(location){try{const u=new URL(location,row.url);redirect=u.origin+u.pathname;}catch{/* Never store arbitrary header text. */}}
  results.push({brand:row.brand,url:row.url,check:response.ok?"reachable":"http_error",httpStatus:response.status,...(redirect?{redirect}:{}),contentType:(response.headers.get("content-type")??"").split(";")[0].slice(0,80)});
  await response.body?.cancel();
 }catch(error){results.push({brand:row.brand,url:row.url,check:"failed",failureCode:collectionFailureCode(error)});}
}}
await Promise.all(Array.from({length:4},worker));
results.sort((a,b)=>String(a.brand).localeCompare(String(b.brand),"ko")||String(a.url).localeCompare(String(b.url)));
const totals:Record<string,number>={};for(const row of results)totals[String(row.check)]=(totals[String(row.check)]??0)+1;
await writeFile(new URL("../src/data/collection-route-status.json",import.meta.url),JSON.stringify({checkedAt:new Date().toISOString(),policyCheckedAt:policy.checkedAt,scope:"등록 진입 URL의 GET 응답 진단만 수행. HTTP 200은 수집 성공·NEW 확인을 의미하지 않음. POST·동적 하위 경로 미검증. 상품·검수·알림 변경 없음",totals,results},null,2)+"\n");
console.log(JSON.stringify({brands:new Set(rows.map(r=>r.brand)).size,paths:rows.length,totals}));
for(const row of results.filter(r=>r.check!=="reachable"))console.log(JSON.stringify(row));
