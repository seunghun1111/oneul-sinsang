import {readFile,writeFile} from "node:fs/promises";
import {reviewAlerts,alertMarker} from "./lib/review-alerts.ts";
import {coffeeCollectionFailures} from "./lib/coffee-collection-run.ts";
import {brandCollectionFailures} from "./lib/brand-collection-run.ts";
import {pressCollectionFailures} from "./lib/press-collection-run.ts";
const base=new URL("../src/data/",import.meta.url);
const read=async(name:string)=>JSON.parse(await readFile(new URL(name,base),"utf8"));
const report=await read("auto-review.json");
const state=await read("review-notification-state.json");
const decisions=await read("review-decisions.json");
let queue;
try {queue=await read("review-queue.json");}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
const brand=await read("brand-collection-status.json");
const failures=brandCollectionFailures(brand,"추가 브랜드");
failures.push(...coffeeCollectionFailures(await read("coffee-collection-status.json")));
failures.push(...brandCollectionFailures(await read("convenience-collection-status.json"),"편의점"));
failures.push(...brandCollectionFailures(await read("foodservice-collection-status.json"),"외식"));
failures.push(...brandCollectionFailures(await read("cu-collection-status.json"),"편의점"));
failures.push(...brandCollectionFailures(await read("icecream-collection-status.json"),"아이스크림"));
failures.push(...pressCollectionFailures(await read("press-collection-status.json")));
if(process.env.COLLECTION_FAILED==="true") failures.push("일일 수집·검수 작업 실패 (Actions 실행 기록 확인)");
const alerts=reviewAlerts(report,decisions,state.sent,failures,queue);
if(!alerts.length) {console.log("새 확인 필요 항목 없음");process.exit(0);}
// Local execution is always a dry run unless --send is explicitly supplied.
if(!process.argv.includes("--send")) {console.log(`새 확인 필요 항목 ${alerts.length}건 (알림 전송 안 함)`);process.exit(0);}
const repository=process.env.GITHUB_REPOSITORY;
if(!repository || !/^[\w.-]+\/[\w.-]+$/.test(repository) || !process.env.GH_TOKEN) throw new Error("GitHub notification configuration missing");
const api=async(path:string,method="GET",body?:unknown)=>{
  const response=await fetch(`https://api.github.com/repos/${repository}${path}`,{method,headers:{Authorization:`Bearer ${process.env.GH_TOKEN}`,Accept:"application/vnd.github+json",...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
  if(!response.ok) throw new Error(`GitHub notification HTTP ${response.status}`);
  return response.json();
};
const today=new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Seoul"});
const title=`[자동 검수 알림] ${today}`;
// Search all recent daily digests before retrying, including closed issues.
const issues=await api("/issues?state=all&per_page=100&sort=created&direction=desc");
const existing=issues.find((issue:{title:string;user:{login:string}})=>issue.title===title && issue.user.login==="github-actions[bot]");
for(const alert of alerts) if(issues.some((issue:{title:string;body?:string;user:{login:string}})=>issue.title.startsWith("[자동 검수 알림]") && issue.user.login==="github-actions[bot]" && issue.body?.includes(alertMarker(alert.key)))) state.sent[alert.key]=today;
// One digest per Seoul day. Overflow/new same-day items remain unsent for tomorrow.
if(existing) {
  for(const alert of alerts) if(existing.body?.includes(alertMarker(alert.key))) state.sent[alert.key]=today;
} else {
  const selected:typeof alerts=[];let body="자동 승인·자동 제외 건은 생략하고 새 확인 필요 사유만 알립니다.\n\n[통합 검수함](https://oneul-sinsang.dnalsgh2.chatgpt.site/)\n";
  for(const alert of alerts.filter(a=>!state.sent[a.key])) {const line=`\n- ${alert.text.replace(/[\r\n]/g," ")} ${alertMarker(alert.key)}`;if(body.length+line.length>55000) break;body+=line;selected.push(alert);}
  if(selected.length) await api("/issues","POST",{title,body});
  selected.forEach(alert=>state.sent[alert.key]=today);
}
await writeFile(new URL("review-notification-state.json",base),JSON.stringify(state,null,2)+"\n");
