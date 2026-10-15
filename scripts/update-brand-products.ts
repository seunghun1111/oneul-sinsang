import { readFile, writeFile } from "node:fs/promises";
import { automatedBrandSources, collectAutomatedBrand, type BrandCandidate } from "./lib/manual-brand-collector.ts";
import { mergeProducts } from "./update-static-products.ts";
import type { Product } from "../src/types/product.ts";

const checkedAt=new Date().toISOString();
const candidates: BrandCandidate[]=[];
const results=[];
// Sequential requests limit load on shared official-mall origins.
for(const source of automatedBrandSources) {
  try {
    const result=await collectAutomatedBrand(source,checkedAt);
    candidates.push(...result.candidates);
    results.push({brand:source.brand,sourceUrl:source.url,status:"success",newCount:result.candidates.length,robots:result.policyState,
      note:result.candidates.length ? "NEW 근거 확인, 개별 출시일 미확인으로 검수 대기" : "읽은 최신 목록에서 상품별 NEW 배지가 확인되지 않음 (출시일·이미지 날짜로 추정하지 않음)"});
    console.log(`${source.brand}: NEW 후보 ${result.candidates.length}개`);
  } catch(error) {
    results.push({brand:source.brand,sourceUrl:source.url,status:"failed",newCount:0,note:error instanceof Error?error.message:"수집 실패"});
    console.warn(`${source.brand}: 수집 실패, 기존 데이터 유지`);
  }
}
const dataUrl=new URL("../src/data/products.json",import.meta.url);
const existing=JSON.parse(await readFile(dataUrl,"utf8")) as Product[];
if(results.every(result=>result.status==="failed")) throw new Error("추가 브랜드 수집에 모두 실패했습니다.");
const fullCheckedBrands=new Set(results.filter(result=>result.status==="success" && ["bhc","푸라닭","네네치킨"].includes(result.brand)).map(result=>result.brand));
const currentIds=new Set(candidates.map(product=>product.slug));
const merged=mergeProducts(existing,candidates,checkedAt).map(product=>{
  // Full chicken NEW lists can prove badge disappearance. A single mall page cannot.
  if(!fullCheckedBrands.has(product.brand) || currentIds.has(product.id)) return product;
  return {...product,isActive:false,availabilityStatus:"ended" as const,availabilityCheckedAt:checkedAt,updatedAt:checkedAt};
});
await writeFile(dataUrl,JSON.stringify(merged,null,2)+"\n");
await writeFile(new URL("../src/data/brand-collection-status.json",import.meta.url),JSON.stringify({checkedAt,scope:"최신 목록 첫 페이지의 명시적 NEW 배지",results},null,2)+"\n");
