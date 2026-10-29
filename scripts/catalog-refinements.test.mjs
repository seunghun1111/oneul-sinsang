import test from "node:test";
import assert from "node:assert/strict";
import {catalogDefaults,searchCatalog} from "../src/lib/catalog-search.ts";
import {catalogFacetCounts,catalogFilterResets,catalogRecoveryOptions} from "../src/lib/catalog-refinements.ts";
const products=[
 {id:"a",brand:"스타벅스",category:"cafe",name:"오트 라떼",subCategory:"음료",firstDetectedAt:"2026-10-28"},
 {id:"b",brand:"스타벅스",category:"cafe",name:"머그",subCategory:"MD",firstDetectedAt:"2026-10-27"},
 {id:"c",brand:"이디야",category:"cafe",name:"오트 쿠키",subCategory:"푸드",firstDetectedAt:"2026-10-26"},
 {id:"d",brand:"CU",category:"snack",name:"오트 과자",subCategory:"과자",firstDetectedAt:"2026-10-25"},
];
test("필터 건수는 검색어에 맞추고 상위 단계에서 하위 선택을 제외한다",()=>{
 const state={...catalogDefaults,q:"오트",category:"cafe",brand:"스타벅스",sub:"음료"};
 const counts=catalogFacetCounts(products,state);
 assert.equal(counts.all,3);assert.equal(counts.categories.get("cafe"),2);
 assert.equal(counts.categories.get("snack"),1);assert.equal(counts.categoryTotal,2);
 assert.equal(counts.brands.get("이디야"),1);assert.equal(counts.brandTotal,1);
 assert.equal(counts.subcategories.get("음료"),1);assert.equal(counts.subcategories.get("MD"),undefined);
});
test("관심 목록 범위 밖의 상품이 필터 건수와 복구 안내에 섞이지 않는다",()=>{
 const saved=products.filter(p=>p.id==="b");
 const state={...catalogDefaults,q:"오트",saved:"products"};
 assert.equal(catalogFacetCounts(saved,state).all,0);
 const recovery=catalogRecoveryOptions(saved,state);
 assert.equal(recovery.length,1);assert.equal(recovery[0].count,1);
 assert.deepEqual(searchCatalog(saved,{...state,...recovery[0].patch}).map(p=>p.id),["b"]);
 assert.deepEqual(catalogRecoveryOptions([],state),[]);
});
test("분류 해제는 하위 조건도 지우고 검색어·정렬·보기 방식을 보존한다",()=>{
 const state={...catalogDefaults,q:"오트",category:"cafe",brand:"스타벅스",sub:"MD",view:"list",sort:"release",saved:"brands"};
 const cleared={...state,...catalogFilterResets.category};
 assert.equal(cleared.brand,"all");assert.equal(cleared.sub,"all");
 assert.equal(cleared.q,"오트");assert.equal(cleared.view,"list");assert.equal(cleared.sort,"release");assert.equal(cleared.saved,"brands");
 assert.equal({...state,...catalogFilterResets.brand}.category,"cafe");
 assert.equal({...state,...catalogFilterResets.sub}.brand,"스타벅스");
});
test("결과가 생기는 복구 옵션만 실제 건수와 함께 제안한다",()=>{
 const state={...catalogDefaults,q:"오트",category:"cafe",brand:"스타벅스",sub:"MD"};
 assert.equal(searchCatalog(products,state).length,0);
 const recovery=catalogRecoveryOptions(products,state);
 assert.ok(recovery.length>0&&recovery.length<=3);
 for(const option of recovery){
  const actual=searchCatalog(products,{...state,...option.patch});
  assert.equal(actual.length,option.count);assert.ok(option.count>0);
 }
 assert.equal(recovery.find(o=>o.key==="q").count,1);
 assert.equal(recovery.find(o=>o.key==="sub").count,1);
});
test("초기화와 검색어 해제가 같은 상태라면 중복 제안을 만들지 않는다",()=>{
 const recovery=catalogRecoveryOptions(products,{...catalogDefaults,q:"없는상품"});
 assert.equal(recovery.length,1);assert.equal(recovery[0].key,"q");assert.equal(recovery[0].count,4);
 assert.deepEqual(catalogRecoveryOptions(products,catalogDefaults),[]);
});
