import test from "node:test";
import assert from "node:assert/strict";
import {CollectionFailure,collectionFailureDetail,readCollectionText} from "./lib/collection-failure.ts";
import {createCollectionFetcher,createRobotsFetcher} from "./lib/collection-http.ts";
import {collectCoffeeSource} from "./lib/coffee-collector.ts";
import {runCoffeeCollection} from "./lib/coffee-collection-run.ts";
import {runBrandCollection} from "./lib/brand-collection-run.ts";
test("상세 진단은 허용된 단계·HTTP 상태만 남긴다",()=>{
 const e=new CollectionFailure("http",{stage:"product_request",httpStatus:403,url:"secret",cookie:"secret"});
 assert.deepEqual(collectionFailureDetail(e),{stage:"product_request",httpStatus:403});
 assert.deepEqual(collectionFailureDetail(new CollectionFailure("http",{stage:"secret",httpStatus:999})),{});
 assert.deepEqual(collectionFailureDetail(Error("secret")),{});
});
test("공통 전송·정책 실패의 단계를 구분하고 상품 요청을 차단한다",async()=>{
 const transport=createCollectionFetcher(async()=>{throw Object.assign(Error("secret"),{code:"ETIMEDOUT"});});
 await assert.rejects(()=>transport("https://example.com/robots.txt"),e=>e.detail.stage==="robots_request"&&e.failureCode==="timeout");
 let calls=0;const robots=createRobotsFetcher(async()=>{calls++;return new Response("html",{status:200,headers:{"content-type":"text/html"}});});
 await assert.rejects(()=>robots("https://example.com/menu"),e=>e.detail.stage==="robots_body"&&e.detail.httpStatus===200);
 assert.equal(calls,1);
 const denied=createRobotsFetcher(async()=>new Response("no",{status:403}));
 await assert.rejects(()=>denied("https://example.com/menu"),e=>e.detail.stage==="robots_request"&&e.detail.httpStatus===403);
});
test("본문 실패와 커피 HTTP 상태는 최종 보고서에도 보존한다",async()=>{
 await assert.rejects(()=>readCollectionText({status:200,text:async()=>{throw Object.assign(Error("secret"),{name:"TimeoutError"});}}),e=>e.detail.stage==="product_body"&&e.failureCode==="timeout");
 const source={id:"test",brand:"테스트",channels:[{kind:"menu",url:"https://example.com/menu"}]};
 const result=await runCoffeeCollection([source],"2026-10-20",()=>collectCoffeeSource(source,"2026-10-20",async()=>new Response("secret",{status:429})));
 assert.deepEqual(result.report.results[0].failureDetails,[{stage:"product_request",httpStatus:429}]);
 const brand=await runBrandCollection([["테스트",async()=>{throw new CollectionFailure("http",{stage:"product_request",httpStatus:503});}]],"2026-10-20");
 assert.equal(brand.report.results[0].failureDetail.httpStatus,503);
 assert.ok(!JSON.stringify(result).includes("secret"));
});
