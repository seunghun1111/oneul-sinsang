import test from "node:test";
import assert from "node:assert/strict";
import {CollectionFailure,collectionFailureCode} from "./lib/collection-failure.ts";
import {createCollectionFetcher,createRobotsFetcher} from "./lib/collection-http.ts";
import {runBrandCollection} from "./lib/brand-collection-run.ts";
import {runCoffeeCollection} from "./lib/coffee-collection-run.ts";
test("전송 오류의 허용된 분류만 유지하고 비밀 원문·cause를 버린다",async()=>{
 const fetcher=createCollectionFetcher(async()=>{throw Object.assign(Error("token=secret"),{cause:{code:"CERT_HAS_EXPIRED",message:"private"}});});
 await assert.rejects(()=>fetcher("https://official.example.com/menu"),e=>{
  assert.equal(collectionFailureCode(e),"tls");assert.equal(e.cause,undefined);
  assert.ok(!JSON.stringify(e).includes("secret"));return true;
 });
 assert.equal(collectionFailureCode(Error("DNS secret")),"unknown");
});
test("정책 제한과 정책 확인 실패는 상품 요청 없이 구분한다",async()=>{
 for(const [body,status,expected] of [["User-agent: *\nDisallow: /",200,"policy_blocked"],["failure",503,"policy_unavailable"]]){
  let calls=0;
  const fetcher=createRobotsFetcher(async()=>{calls++;return new Response(body,{status});});
  await assert.rejects(()=>fetcher("https://official.example.com/menu"),e=>collectionFailureCode(e)===expected);
  assert.equal(calls,1);
 }
});
test("브랜드·카페 보고서는 원문 대신 오류 코드만 기록한다",async()=>{
 const brand=await runBrandCollection([["A",async()=>{throw new CollectionFailure("policy_blocked");}]],"2026-10-17");
 assert.equal(brand.report.results[0].failureCode,"policy_blocked");
 const coffee=await runCoffeeCollection([{id:"a",brand:"A"}],"2026-10-17",async()=>({candidates:[],verifiedUrls:[],checked:1,failed:1,failureCodes:["http"]}));
 assert.deepEqual(coffee.report.results[0].failureCodes,["http"]);
});
