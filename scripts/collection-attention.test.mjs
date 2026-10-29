import test from "node:test";
import assert from "node:assert/strict";
import {selectAttentionTargets,diagnoseCoffeeSource} from "./lib/collection-attention.ts";
import {collectCoffeeBrand} from "./lib/coffee-collector.ts";
import {CollectionFailure,readCollectionJson} from "./lib/collection-failure.ts";

const source={id:"test",brand:"테스트",channels:[{kind:"menu",url:"https://official.example.com/menu"}]};
const checkedAt="2026-10-28T01:00:00Z";
const empty={candidates:[],verifiedUrls:[source.channels[0].url],checked:1,failed:0};
const old={id:"old",brand:source.brand,sourceUrl:source.channels[0].url,isActive:true,newStatus:"active"};

test("선택 진단은 중복을 제거하고 정상 브랜드 생략과 잘못된 인자를 구분한다",()=>{
 const now=new Date().toISOString();
 const health={version:1,generatedAt:now,rows:[
  {brand:"실패",status:"failed",checkedAt:now},
  {brand:"정상",status:"success",checkedAt:now},
  {brand:"오래됨",status:"success",checkedAt:"2020-01-01"},
 ]};
 const selected=selectAttentionTargets(health,["--brand=실패","--brand=실패","--brand=정상"]);
 assert.deepEqual(selected.requested,["실패","정상"]);
 assert.deepEqual(selected.targets.map(row=>row.brand),["실패"]);
 assert.deepEqual(selected.skippedBrands,["정상"]);
 assert.deepEqual(selectAttentionTargets(health,[]).targets.map(row=>row.brand),["실패","오래됨"]);
 for(const args of [["--all"],["--brand="],["--brand= "],["--brand=없는브랜드"]])assert.throws(()=>selectAttentionTargets(health,args));
});

test("진단의 예외는 원문 없이 결과로 남기고 후속 브랜드 진단을 막지 않는다",async()=>{
 const result=await diagnoseCoffeeSource(source,checkedAt,[],async()=>{throw Error("SECRET-CREDENTIAL");});
 assert.equal(result.status,"failed");
 assert.equal(result.attempts,1);
 assert.deepEqual(result.failureCodes,["unknown"]);
 assert.ok(!JSON.stringify(result).includes("SECRET"));
 assert.equal((await diagnoseCoffeeSource(source,checkedAt,[],async()=>empty)).status,"checked");
});

test("일시 오류가 복구되면 최초 실패와 2회 시도를 보존하고 최종 실패로 표시하지 않는다",async()=>{
 let calls=0;
 const result=await diagnoseCoffeeSource(source,checkedAt,[],async()=>{
  if(++calls===1)throw new CollectionFailure("timeout",{stage:"robots_request"});
  return empty;
 });
 assert.equal(result.status,"checked");assert.equal(result.attempts,2);
 assert.deepEqual(result.initialFailureCodes,["timeout"]);assert.equal(result.failureCodes,undefined);
});

test("진단은 자동 수집과 같은 빈 목록 보호를 적용하고 기존 데이터를 변경하지 않는다",async()=>{
 const existing=[{...old}],before=JSON.stringify(existing);
 const result=await diagnoseCoffeeSource(source,checkedAt,existing,async()=>empty);
 assert.equal(result.status,"needs_review");assert.equal(result.reasonCode,"unexpected_empty");
 assert.equal(JSON.stringify(existing),before);
 assert.equal((await diagnoseCoffeeSource(source,checkedAt,[{...old,isActive:false}],async()=>empty)).status,"checked");
});

test("스타벅스 진단은 세 섹션을 한 번씩 수집하고 HTTP 부분 실패를 보존한다",async()=>{
 const starbucks={...source,id:"starbucks",brand:"스타벅스"};
 let lists=0,products=0;
 const fetcher=async url=>{
  if(url.endsWith("robots.txt"))return new Response("User-agent: *\nAllow: /");
  if(url.endsWith("_list.do")){lists++;return new Response("/menu/productListAjax.do; newicon == 'Y'; result='W0000003';");}
  products++;return products===2?new Response("SECRET",{status:503}):Response.json({list:[]});
 };
 const result=await diagnoseCoffeeSource(starbucks,checkedAt,[],s=>collectCoffeeBrand(s,checkedAt,fetcher));
 assert.equal(lists,3);assert.equal(products,3);assert.equal(result.attempts,1);
 assert.equal(result.status,"partial");assert.equal(result.checked,2);assert.equal(result.failed,1);
 assert.deepEqual(result.failureCodes,["http"]);
 assert.deepEqual(result.failureDetails,[{stage:"product_request",httpStatus:503}]);
 assert.ok(!JSON.stringify(result).includes("SECRET"));
});

test("スタ벅스에서 명시적으로 NEW가 해제된 경우 빈 목록 오탐을 만들지 않는다",async()=>{
 const starbucks={...source,id:"starbucks",brand:"스타벅스"};
 const url="https://www.starbucks.co.kr/menu/drink_view.do?product_cd=1";
 const result=await diagnoseCoffeeSource(starbucks,checkedAt,[{...old,brand:"스타벅스",sourceUrl:url}],async()=>({
  ...empty,verifiedUrls:[url],confirmedNotNewUrls:[url],
 }));
 assert.equal(result.status,"checked");assert.equal(result.reasonCode,undefined);
});

test("JSON 본문 시간 초과와 잘못된 JSON을 서로 다른 안전한 오류로 기록한다",async()=>{
 await assert.rejects(()=>readCollectionJson({status:200,text:async()=>{throw Object.assign(Error("SECRET"),{name:"TimeoutError"});}}),
  e=>e.failureCode==="timeout"&&e.detail.stage==="product_body"&&!e.message.includes("SECRET"));
 await assert.rejects(()=>readCollectionJson(new Response('{"SECRET":')),
  e=>e.failureCode==="structure"&&e.detail.httpStatus===200&&!e.message.includes("SECRET"));
 assert.deepEqual(await readCollectionJson(Response.json({list:[]})),{list:[]});
});

test("스타벅스 정책 차단·구조 오류·본문 오류는 NEW 0건 성공이 아니다",async()=>{
 const starbucks={...source,id:"starbucks",brand:"스타벅스"};
 for(const mode of ["policy","html","json","schema","body"]){
  let productCalls=0;
  const fetcher=async url=>{
   if(url.endsWith("robots.txt"))return new Response("User-agent: *\n"+(mode==="policy"?"Disallow: /":"Allow: /"));
   productCalls++;
   if(url.endsWith("_list.do"))return new Response(mode==="html"?"SECRET":"/menu/productListAjax.do; newicon == 'Y'; result='W0000003';");
   if(mode==="json")return new Response("SECRET invalid JSON");
   if(mode==="body")return {ok:true,status:200,text:async()=>{throw Object.assign(Error("SECRET"),{code:"ETIMEDOUT"});}};
   return Response.json({list:[{product_CD:"1",product_NM:"상품",newicon:"UNKNOWN"}]});
  };
  // Direct adapter call avoids retry delay while checking classification of all sections.
  const result=await collectCoffeeBrand(starbucks,checkedAt,fetcher);
  assert.equal(result.checked,0);assert.equal(result.failed,3);
  assert.deepEqual(result.failureCodes,[mode==="policy"?"policy_blocked":mode==="body"?"timeout":"structure"]);
  assert.deepEqual(result.verifiedUrls,[]);assert.deepEqual(result.confirmedNotNewUrls,[]);
  assert.ok(!JSON.stringify(result).includes("SECRET"));
  if(mode==="policy")assert.equal(productCalls,0);
 }
});
