// Read-only audit: emits evidence, never changes approvals or sends notifications.
import {readFile} from "node:fs/promises";
import {robotsAllows} from "./lib/manual-brand-collector.ts";
import {extractOfficialProductNames} from "./lib/coffee-collector.ts";
import {normalizeProductName} from "../src/lib/normalize-product-name.ts";
import type {Product} from "../src/types/product.ts";

const read=async(name:string)=>JSON.parse(await readFile(new URL(`../src/data/${name}`,import.meta.url),"utf8"));
const automatic=await read("auto-review.json"), manual=await read("review-decisions.json");
const pending=([...(await read("products.json")),...(await read("coffee-products-auto.json"))] as Product[])
  .filter(p=>(manual[p.id]?.decision??automatic.products[p.id]?.decision??p.reviewStatus??"approved")==="pending");
const urls=[...new Set(pending.map(p=>p.sourceUrl))];
const origins=new Set(urls.map(url=>new URL(url).origin));
// Incoming URLs may not expand network access beyond this reviewed public-host allowlist.
const hosts=new Set(["news.pulmuone.co.kr","www.7-eleven.co.kr","www.baskinrobbins.co.kr","www.orionworld.com","www.maeil.com","samyangfoods.com","www.bing.co.kr","www.starbucks.co.kr","www.hollys.co.kr","paikdabang.com","www.ediya.com"]);
const checkedAt=new Date().toISOString();
async function request(url:string) {
  const target=new URL(url);
  if(target.protocol!=="https:"||!hosts.has(target.hostname)||target.username||target.password||target.port) throw Error("unapproved_host");
  const response=await fetch(target,{redirect:"manual",headers:{"user-agent":"OneulSinsang/1.0 (+non-commercial product index)"},signal:AbortSignal.timeout(12000)});
  return {status:response.status,type:response.headers.get("content-type")??"",body:await response.text()};
}
const policies=new Map<string,{state:string;text:string}>();
await Promise.all([...origins].map(async origin=>{
  try {
    const response=await request(origin+"/robots.txt");
    policies.set(origin,response.status===404?{state:"not_provided",text:""}:response.status===200&&!response.type.includes("html")?{state:"allowed",text:response.body}:{state:"policy_unavailable",text:""});
  } catch {policies.set(origin,{state:"policy_unavailable",text:""});}
}));
const results=[];
for(let i=0;i<urls.length;i+=6) {
  results.push(...await Promise.all(urls.slice(i,i+6).map(async url=>{
    const products=pending.filter(p=>p.sourceUrl===url),brand=products[0].brand;
    const policy=policies.get(new URL(url).origin)!;
    const base={url,brand,ids:products.map(p=>p.id)};
    if(policy.state==="policy_unavailable"||!robotsAllows(policy.text,url))return {...base,status:policy.state==="policy_unavailable"?policy.state:"blocked"};
    try {
      const response=await request(url);
      if(response.status!==200||!response.type.includes("html"))return {...base,status:`HTTP_${response.status}`};
      const html=response.body.replace(/<!--[\s\S]*?-->/g,comment=>/^<!--\s*고메/.test(comment)?"<!-- 고메 -->":"");
      const text=html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,"").replace(/<[^>]+>/g," ").replace(/\s+/g," ");
      const names=products[0].category==="cafe"?extractOfficialProductNames(html,url,checkedAt,true):[];
      return {...base,status:"checked",robots:policy.state,title:html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],
        markedNames:names,
        launchSnippets:products[0].sourceType==="press_release"?text.match(/.{0,80}(?:출시|신제품).{0,100}/g)?.slice(0,4):undefined,
        products:products.map(p=>({id:p.id,name:p.name,matchedNew:names.some(n=>normalizeProductName(n)===p.normalizedName),nameInText:text.includes(p.name)}))};
    } catch {return {...base,status:"request_failed"};}
  })));
}
console.log(JSON.stringify({checkedAt,total:pending.length,results},null,2));
