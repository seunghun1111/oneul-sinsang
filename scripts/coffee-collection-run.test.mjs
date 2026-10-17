import assert from "node:assert/strict";
import test from "node:test";
import {runCoffeeCollection,coffeeCollectionFailures,mergeCoffeeReports} from "./lib/coffee-collection-run.ts";
const sources=[{id:"a",brand:"A"},{id:"b",brand:"B"},{id:"c",brand:"C"}];
test("일부 브랜드 재수집은 다른 브랜드의 확인 시각을 갱신하지 않는다",()=>{
 const previous={checkedAt:"2026-10-15",results:[{sourceId:"a",brand:"A"},{sourceId:"b",brand:"B"},{sourceId:"c",brand:"C",checkedAt:"2026-10-14"}]};
 const report=mergeCoffeeReports(previous,{checkedAt:"2026-10-17",results:[{sourceId:"b",brand:"B",status:"success"}]});
 assert.deepEqual(report.results.map(r=>r.checkedAt),["2026-10-15","2026-10-17","2026-10-14"]);
});
test("브랜드 예외를 격리하고 성공 경로만 누락 판정에 전달한다",async()=>{
 const result=await runCoffeeCollection(sources,"2026-10-16",async(source)=>{
  if(source.id==="a") throw new Error("private diagnostic must not enter report");
  return {candidates:[{id:source.id}],verifiedUrls:[`https://${source.id}.example`],checked:1,failed:source.id==="b"?1:0};
 });
 assert.deepEqual(result.report.results.map(r=>r.status),["failed","partial","success"]);
 assert.deepEqual(result.observed.map(p=>p.id),["b","c"]);
 assert.equal(result.verifiedUrls.has("https://a.example"),false);
 assert.equal(JSON.stringify(result.report).includes("private diagnostic"),false);
 assert.equal(coffeeCollectionFailures(result.report).length,2);
});
test("지속 실패 알림은 유지하고 복구 후 재실패는 새로운 발생으로 구분한다",async()=>{
 const fail=async()=>{throw new Error("failure");};
 const one=await runCoffeeCollection(sources.slice(0,1),"2026-10-16",fail);
 const two=await runCoffeeCollection(sources.slice(0,1),"2026-10-17",fail,one.report.results);
 assert.deepEqual(coffeeCollectionFailures(one.report),coffeeCollectionFailures(two.report));
 const recovered=await runCoffeeCollection(sources.slice(0,1),"2026-10-18",async()=>({candidates:[],verifiedUrls:[],checked:1,failed:0}),two.report.results);
 assert.equal(coffeeCollectionFailures(recovered.report).length,0);
 const again=await runCoffeeCollection(sources.slice(0,1),"2026-10-19",fail,recovered.report.results);
 assert.notDeepEqual(coffeeCollectionFailures(one.report),coffeeCollectionFailures(again.report));
});
