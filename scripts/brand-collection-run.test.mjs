import test from "node:test";
import assert from "node:assert/strict";
import {runBrandCollection,brandCollectionFailures} from "./lib/brand-collection-run.ts";
import {mergeFoodserviceProducts} from "./update-foodservice-products.ts";
import {mergeConvenienceProducts} from "./update-convenience-products.ts";
test("0건 성공과 실패를 구분하고 원문 오류는 저장하지 않는다",async()=>{
 const result=await runBrandCollection([["성공",async()=>[]],["실패",()=>{throw Error("private request detail");}]],"2026-10-16");
 assert.deepEqual(result.checkedBrands,["성공"]);
 assert.deepEqual(result.report.results.map(r=>r.status),["success","failed"]);
 assert.equal(JSON.stringify(result.report).includes("private request"),false);
});
test("전체 실패에서도 결과를 반환해 다른 수집기의 계속 진행을 허용한다",async()=>{
 const result=await runBrandCollection([["A",async()=>{throw Error();}]],"2026-10-16");
 assert.deepEqual(result.candidates,[]);assert.deepEqual(result.checkedBrands,[]);
 assert.equal(brandCollectionFailures(result.report,"외식").length,1);
});
test("실패 지속 시 알림 키 유지, 복구 후 재실패는 새 알림",async()=>{
 const fail=[["A",async()=>{throw Error();}]];
 const one=await runBrandCollection(fail,"2026-10-16");
 const two=await runBrandCollection(fail,"2026-10-17",one.report.results);
 assert.deepEqual(brandCollectionFailures(one.report,"외식"),brandCollectionFailures(two.report,"외식"));
 const recovered=await runBrandCollection([["A",async()=>[]]],"2026-10-18",two.report.results);
 assert.deepEqual(brandCollectionFailures(recovered.report,"외식"),[]);
 const again=await runBrandCollection(fail,"2026-10-19",recovered.report.results);
 assert.notDeepEqual(brandCollectionFailures(one.report,"외식"),brandCollectionFailures(again.report,"외식"));
});
test("실패 브랜드 상품은 누락으로 종료시키지 않는다",async()=>{
 for(const [brand,merge] of [["세븐일레븐",mergeConvenienceProducts],["롯데리아",mergeFoodserviceProducts]]) {
  const result=await runBrandCollection([[brand,async()=>{throw Error();}]],"2026-10-16");
  const old={id:"test",brand,name:"상품",normalizedName:"상품",sourceType:"official_site",isActive:true};
  const [p]=merge([old],result.candidates,result.checkedBrands,"2026-10-16");
  assert.equal(p.isActive,true);assert.equal(p.newStatus,undefined);
 }
});
