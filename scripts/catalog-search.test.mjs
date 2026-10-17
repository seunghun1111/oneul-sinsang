import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {catalogDefaults,readCatalogState,searchCatalog} from "../src/lib/catalog-search.ts";
const products=[
 {id:"a",category:"cafe",brand:"스타벅스",name:"오트 라떼",subCategory:"음료",firstDetectedAt:"2026-10-17",releaseDate:"2026-10-01"},
 {id:"b",category:"cafe",brand:"스타벅스",name:"머그",subCategory:"MD",firstDetectedAt:"2026-10-16"},
 {id:"c",category:"snack",brand:"다른 브랜드",name:"오트 쿠키",subCategory:"과자",firstDetectedAt:"2026-10-15",releaseDate:"2026-10-15"},
];
test("상품명·브랜드 조합 검색은 띄어쓰기와 영문 대소문자를 정규화한다",()=>{
 assert.deepEqual(searchCatalog(products,{...catalogDefaults,q:"스타벅스 오트"}).map(p=>p.id),["a"]);
 assert.deepEqual(searchCatalog(products,{...catalogDefaults,q:"starbucks"}),[]);
 assert.deepEqual(searchCatalog(products,{...catalogDefaults,q:"md"}).map(p=>p.id),["b"]);
 assert.equal(searchCatalog(products,{...catalogDefaults,q:"오트"}).length,2);
});
test("카테고리·브랜드·세부 분류는 검색과 동시에 적용한다",()=>{
 const state=readCatalogState("?category=cafe&brand=스타벅스&sub=음료&q=라떼&view=list",products);
 assert.deepEqual(searchCatalog(products,state).map(p=>p.id),["a"]);assert.equal(state.view,"list");
 assert.equal(searchCatalog(products,{...state,q:"쿠키"}).length,0);
});
test("URL의 잘못된 필터는 범위 안에서 초기화하고 검색 길이를 제한한다",()=>{
 const state=readCatalogState("?category=snack&brand=스타벅스&sub=MD&view=invalid&sort=invalid&q="+"x".repeat(200),products);
 assert.equal(state.brand,"all");assert.equal(state.sub,"all");assert.equal(state.view,"compact");assert.equal(state.sort,"detected");assert.equal(state.q.length,120);
});
test("최근 발견일·출시 기록 정렬을 분리하고 출시일 미확인은 뒤에 둔다",()=>{
 assert.deepEqual(searchCatalog(products,catalogDefaults).map(p=>p.id),["a","b","c"]);
 assert.deepEqual(searchCatalog(products,{...catalogDefaults,sort:"release"}).map(p=>p.id),["c","a","b"]);
});
test("홈은 기간 탭·기존 스크롤을 유지하고 썸네일 실패 시 대체 화면을 제공한다",()=>{
 const read=name=>readFileSync(new URL(`../src/components/${name}.tsx`,import.meta.url),"utf8");
 const tabs=read("discovery-tabs");assert.ok(tabs.includes('role="tablist"'));assert.ok(tabs.includes('hidden={selected!==index}'));assert.ok(tabs.includes("ArrowRight"));
 const thumbnail=read("product-thumbnail");assert.ok(thumbnail.includes("onError="));assert.ok(thumbnail.includes("product.brand"));assert.ok(thumbnail.includes("이미지 준비 중"));
 const explorer=read("product-explorer");assert.ok(explorer.includes("useSyncExternalStore"));assert.ok(explorer.includes("aria-expanded={filtersOpen}"));
});
