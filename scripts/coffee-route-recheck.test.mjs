import test from "node:test";
import assert from "node:assert/strict";
import {coffeeBrandSources} from "../src/data/coffee-sources.ts";
import {extractOfficialProductNames} from "./lib/coffee-collector.ts";
test("확인된 공식 개편 경로를 사용하고 메뉴·MD를 혼동하지 않는다",()=>{
 const source=id=>coffeeBrandSources.find(s=>s.id===id);
 assert.equal(new URL(source("compose").channels[0].url).searchParams.get("act"),"dispCafemenuGalleryList");
 assert.equal(new URL(source("gongcha").channels.find(c=>c.kind==="md").url).searchParams.get("category"),"003001");
 assert.deepEqual(source("terarosa").channels.filter(c=>c.kind!=="news").map(c=>c.kind),["shop","md"]);
});
test("새 경로의 일반·추천 상품은 NEW로 승격하지 않는다",()=>{
 for(const id of ["compose","gongcha","terarosa"]){
  const source=coffeeBrandSources.find(s=>s.id===id);
  assert.deepEqual(extractOfficialProductNames('<h2>추천메뉴</h2><li><strong>카라멜 라떼</strong></li>',source.channels[0].url,undefined,true),[]);
 }
});
