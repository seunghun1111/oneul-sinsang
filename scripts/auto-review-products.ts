import { readFile, writeFile } from "node:fs/promises";
import { evaluateProducts } from "./lib/auto-review.ts";
import {trackNewProducts} from "./lib/new-history.ts";
import {buildReviewQueue,type ReviewQueue} from "./lib/review-queue.ts";
const data=new URL("../src/data/",import.meta.url);
const read=async(name:string)=>JSON.parse(await readFile(new URL(name,data),"utf8"));
const catalog=await read("products.json");
const coffee=await read("coffee-products-auto.json");
const tracked=trackNewProducts([...catalog,...coffee],await read("new-history.json"),new Date().toISOString());
// A successfully checked empty NEW list is also a baseline, not an unobserved brand.
const collection=await read("brand-collection-status.json");
for(const result of collection.results) if(result.status==="success") tracked.history.brands[result.brand]??=collection.checkedAt;
// Collectors must supply structured evidence; prose containing NEW is not sufficient proof.
const products=tracked.products;
await writeFile(new URL("products.json",data),JSON.stringify(products.slice(0,catalog.length),null,2)+"\n");
await writeFile(new URL("coffee-products-auto.json",data),JSON.stringify(products.slice(catalog.length),null,2)+"\n");
await writeFile(new URL("new-history.json",data),JSON.stringify(tracked.history,null,2)+"\n");
// Migrate older explicit manual reviews before automatic verdicts can override them.
const decisions=await read("review-decisions.json");
for(const product of products) if(!decisions[product.id] && product.reviewedAt && ["approved","rejected"].includes(product.reviewStatus??"")) {
  decisions[product.id]={decision:product.reviewStatus,reviewedAt:product.reviewedAt};
}
await writeFile(new URL("review-decisions.json",data),JSON.stringify(decisions,null,2)+"\n");
const report=evaluateProducts(products);
let previousQueue:ReviewQueue|undefined;
try {previousQueue=await read("review-queue.json");}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
const health=await read("collection-health.json");
const observations:Record<string,{checkedAt?:string;status:string}>={};
for(const row of health.rows??[])if(row.checkedAt)observations[row.brand]={checkedAt:row.checkedAt,status:row.status};
const queue=buildReviewQueue(products,report,decisions,previousQueue,new Date(),observations);
for(const [id,entry] of Object.entries(queue.products))if(entry.action==="manual"&&report.products[id].action==="retry"){
  report.products[id]={...report.products[id],action:"manual",rule:"retry_exhausted",reason:entry.reason};
}
await writeFile(new URL("auto-review.json",data),JSON.stringify(report,null,2)+"\n");
await writeFile(new URL("review-queue.json",data),JSON.stringify(queue,null,2)+"\n");
console.log("자동 처리 구분",queue.totals);
const counts={approved:0,pending:0,rejected:0};
Object.values(report.products).forEach(p=>counts[p.decision]++);
console.log("자동 검수 결과",counts);
