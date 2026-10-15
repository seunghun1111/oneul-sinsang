import { readFile, writeFile } from "node:fs/promises";
import { automatedBrandSources, collectAutomatedBrand, type BrandCandidate } from "./lib/manual-brand-collector.ts";
import { mergeProducts } from "./update-static-products.ts";
import type { Product } from "../src/types/product.ts";
import {guardEmptyNewLists} from "./lib/new-list-safety.ts";

const checkedAt=new Date().toISOString();
const statusUrl=new URL("../src/data/brand-collection-status.json",import.meta.url);
const previous=JSON.parse(await readFile(statusUrl,"utf8"));
const candidates: BrandCandidate[]=[];
const results=[];
// Sequential requests limit load on shared official-mall origins.
for(const source of automatedBrandSources) {
  try {
    const result=await collectAutomatedBrand(source,checkedAt);
    candidates.push(...result.candidates);
    results.push({brand:source.brand,sourceUrl:source.url,status:"success",newCount:result.candidates.length,robots:result.policyState,
      note:result.candidates.length ? "공식 상품별 NEW 근거 확인 (출시일 미공개는 승인 제한 사유 아님)" : "읽은 최신 목록에서 상품별 NEW 배지가 확인되지 않음 (출시일·이미지 날짜로 추정하지 않음)"});
    console.log(`${source.brand}: NEW 후보 ${result.candidates.length}개`);
  } catch {
    results.push({brand:source.brand,sourceUrl:source.url,status:"failed",newCount:0,note:"공식 출처 수집 실패 (원문 오류 저장 안 함)"});
    console.warn(`${source.brand}: 수집 실패, 기존 데이터 유지`);
  }
}
const dataUrl=new URL("../src/data/products.json",import.meta.url);
const existing=JSON.parse(await readFile(dataUrl,"utf8")) as Product[];
const guarded=guardEmptyNewLists(existing,candidates,{checkedAt,results:results.map(result=>{
  const prior=previous.results.find((item:{brand:string})=>item.brand===result.brand);
  return {...result,status:result.status as "success"|"failed",...(result.status==="failed"?{failureSince:prior?.status==="failed"&&prior.failureSince?prior.failureSince:checkedAt}:{})};
})},previous.results);
const fullCheckedBrands=new Set(guarded.results.filter(result=>result.status==="success" && ["bhc","푸라닭","네네치킨"].includes(result.brand)).map(result=>result.brand));
const currentIds=new Set(candidates.map(product=>product.slug));
const merged=mergeProducts(existing,candidates,checkedAt).map(product=>{
  // Full chicken NEW lists can prove badge disappearance. A single mall page cannot.
  if(!fullCheckedBrands.has(product.brand) || currentIds.has(product.id)) return product;
  return {...product,isActive:false,newStatus:"removed" as const,availabilityStatus:"unknown" as const,availabilityCheckedAt:checkedAt,updatedAt:checkedAt};
});
if(guarded.results.some(result=>result.status==="success")) await writeFile(dataUrl,JSON.stringify(merged,null,2)+"\n");
await writeFile(statusUrl,JSON.stringify({...guarded,scope:"최신 목록 첫 페이지의 명시적 NEW 배지"},null,2)+"\n");
