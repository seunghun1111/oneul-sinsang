// Read-only local simulation. No collections, writes, publication or notifications.
import{readFile}from"node:fs/promises";
import{evaluateProducts}from"./lib/auto-review.ts";
import{buildReviewQueue}from"./lib/review-queue.ts";
const read=async(name:string)=>JSON.parse(await readFile(new URL(`../src/data/${name}`,import.meta.url),"utf8"));
const products=[...await read("products.json"),...await read("coffee-products-auto.json")];
const decisions=await read("review-decisions.json");
const report=evaluateProducts(products);
const queue=buildReviewQueue(products,report,decisions,undefined);
console.log(JSON.stringify({policy:queue.policyVersion,total:products.length,totals:queue.totals,networkRequests:0,productionChanges:false},null,2));
