import {readFile,writeFile} from "node:fs/promises";
import {createPressRechecker} from "./lib/press-recheck.ts";
import type {Product} from "../src/types/product.ts";
const dataUrl=new URL("../src/data/products.json",import.meta.url);
const products=JSON.parse(await readFile(dataUrl,"utf8")) as Product[];
const recheck=createPressRechecker();
let checked=0,matched=0,unresolved=0;
// Refresh evidence daily, oldest first, without repeatedly fetching fresh latest-list results.
const now=Date.now();
for(const product of products.filter(p=>p.sourceType==="press_release"&&p.isActive&&(!p.reviewEvidence?.officialLaunchAnnouncement||!Number.isFinite(Date.parse(p.reviewEvidence.checkedAt))||now-Date.parse(p.reviewEvidence.checkedAt)>=24*3600000)).sort((a,b)=>(Date.parse(a.reviewEvidence?.checkedAt??"")||0)-(Date.parse(b.reviewEvidence?.checkedAt??"")||0)).slice(0,20)){
  checked++;
  try{
    const candidate=await recheck(product);
    if(!candidate){unresolved++;continue;}
    product.reviewEvidence=candidate.reviewEvidence;
    product.lastCheckedAt=candidate.reviewEvidence.checkedAt;
    product.updatedAt=candidate.reviewEvidence.checkedAt;
    matched++;
  }catch{unresolved++;} // Preserve all existing data; do not guess approval or sale status.
}
if(matched)await writeFile(dataUrl,JSON.stringify(products,null,2)+"\n");
console.log(`공식 개별 발표 재확인 ${checked}건, 상품·발표일 일치 ${matched}건, 기존 상태 보존 ${unresolved}건`);
