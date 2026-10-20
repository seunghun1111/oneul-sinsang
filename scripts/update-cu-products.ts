import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Product } from "../src/types/product.ts";
import { collectCuDetailed, type CuCandidate,type CuCategoryCheck } from "./lib/cu-collector.ts";
import {categoryCompleteness} from "./lib/category-completeness.ts";
import { mergeProducts } from "./update-static-products.ts";
import {runBrandCollection} from "./lib/brand-collection-run.ts";
import {guardEmptyNewLists,safeNewListBrands} from "./lib/new-list-safety.ts";
import {seoulDateKey} from "../src/lib/product-window.ts";

const dataUrl = new URL("../src/data/products.json", import.meta.url);

export function mergeCuProducts(existing: Product[], candidates: CuCandidate[], checkedAt: string,verifiedCategories?:ReadonlySet<string>) {
  if(!safeNewListBrands(existing,candidates,["CU"]).includes("CU")) return existing;
  const currentIds = new Set(candidates.map(candidate => candidate.slug));
  return mergeProducts(existing, candidates, checkedAt).map(product => {
    if(product.brand!=="CU")return product;
    if(currentIds.has(product.id))return {...product,cuMissingChecks:0,cuMissingCheckedAt:undefined};
    // Never restore previously removed items without a new positive observation.
    const prior=existing.find(item=>item.id===product.id);
    if(!prior?.isActive||prior.newStatus==="removed")return prior??product;
    if(verifiedCategories&&!verifiedCategories.has(prior.subCategory??"기타"))return prior;
    const distinctDay=!prior.cuMissingCheckedAt||seoulDateKey(prior.cuMissingCheckedAt)!==seoulDateKey(checkedAt);
    const count=(prior.cuMissingChecks??0)+(distinctDay?1:0);
    if(count<2)return {...prior,cuMissingChecks:count,cuMissingCheckedAt:checkedAt};
    return {
      ...product,
      cuMissingChecks:count,cuMissingCheckedAt:checkedAt,
      newStatus: "removed" as const, availabilityStatus: "unknown" as const,
      availabilityCheckedAt: checkedAt,
      isActive: false,
      updatedAt: checkedAt,
    };
  });
}

async function main() {
  const checkedAt = new Date().toISOString();
  const existing = JSON.parse(await readFile(dataUrl, "utf8")) as Product[];
  const statusUrl=new URL("../src/data/cu-collection-status.json",import.meta.url);
  const previous=JSON.parse(await readFile(statusUrl,"utf8"));
  let categories:CuCategoryCheck[]=[];
  const batch=await runBrandCollection<CuCandidate>([["CU",async(time)=>{const result=await collectCuDetailed(time);categories=result.categories;return result.candidates;}]],checkedAt,previous.results);
  const {candidates}=batch;
  const safety=categoryCompleteness(existing,categories,checkedAt,previous.results.find((row:{brand:string})=>row.brand==="CU")?.categoryIssues??[]);
  const baseReport=guardEmptyNewLists(existing,candidates,batch.report,previous.results);
  const report={...baseReport,results:baseReport.results.map(row=>({...row,categories,categoryIssues:safety.issues,...(safety.issues.length?{status:"failed" as const}:{} )}))};
  await writeFile(statusUrl,JSON.stringify(report,null,2)+"\n");
  if(baseReport.results.some(result=>result.status==="failed")) {console.warn("CU: 조회 실패 또는 갑작스러운 0건, 기존 데이터 유지");return;}
  const products = mergeCuProducts(existing, candidates, checkedAt,safety.verifiedCategories);
  if(safety.issues.length)console.warn(`CU: ${safety.issues.length}개 카테고리 제외 판정 보류`);
  await writeFile(dataUrl, `${JSON.stringify(products, null, 2)}\n`, "utf8");
  console.log(`CU 공식 NEW 상품 ${candidates.length}건 반영 완료`);
}

const entry = process.argv[1] ? pathToFileURL(fileURLToPath(new URL(process.argv[1], "file:"))).href : "";
if (import.meta.url === entry) await main();
