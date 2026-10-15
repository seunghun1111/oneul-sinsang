import { readFile, writeFile } from "node:fs/promises";
import { evaluateProducts } from "./lib/auto-review.ts";
const data=new URL("../src/data/",import.meta.url);
const read=async(name:string)=>JSON.parse(await readFile(new URL(name,data),"utf8"));
const products=[...await read("products.json"),...await read("coffee-products-auto.json")];
// Migrate older explicit manual reviews before automatic verdicts can override them.
const decisions=await read("review-decisions.json");
for(const product of products) if(!decisions[product.id] && product.reviewedAt && ["approved","rejected"].includes(product.reviewStatus)) {
  decisions[product.id]={decision:product.reviewStatus,reviewedAt:product.reviewedAt};
}
await writeFile(new URL("review-decisions.json",data),JSON.stringify(decisions,null,2)+"\n");
const report=evaluateProducts(products);
await writeFile(new URL("auto-review.json",data),JSON.stringify(report,null,2)+"\n");
const counts={approved:0,pending:0,rejected:0};
Object.values(report.products).forEach(p=>counts[p.decision]++);
console.log("자동 검수 결과",counts);
