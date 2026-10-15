import test from "node:test";
import assert from "node:assert/strict";
import {runPressCollection,pressCollectionFailures} from "./lib/press-collection-run.ts";
test("수집기가 삼킨 HTTP 실패도 부분 실패로 기록하고 성공한 후보를 유지한다",async()=>{
 const collector=async(fetcher)=>{await fetcher("https://example.com/fail");return [{id:"good"}];};
 const result=await runPressCollection([["A",collector]],"2026-10-16",[],async()=>new Response("private detail",{status:503}));
 assert.equal(result.report.results[0].status,"partial");
 assert.equal(result.report.results[0].requestFailures,1);
 assert.equal(result.candidates[0].id,"good");
 assert.equal(JSON.stringify(result.report).includes("private detail"),false);
});
test("정상 0건은 성공이고 한 브랜드 예외는 다른 브랜드에 영향을 주지 않는다",async()=>{
 const result=await runPressCollection([["A",async()=>[]],["B",async()=>{throw Error("secret");}]],"2026-10-16");
 assert.deepEqual(result.report.results.map(r=>r.status),["success","failed"]);
 assert.equal(pressCollectionFailures(result.report).length,1);
 assert.equal(JSON.stringify(result.report).includes("secret"),false);
});
test("통신 실패의 지속·복구·재발을 구분한다",async()=>{
 const sources=[["A",async(fetcher)=>{try{await fetcher("https://example.com");}catch{}return [];}]];
 const bad=async()=>{throw Error("private");};
 const one=await runPressCollection(sources,"2026-10-16",[],bad);
 const two=await runPressCollection(sources,"2026-10-17",one.report.results,bad);
 assert.deepEqual(pressCollectionFailures(one.report),pressCollectionFailures(two.report));
 const recovered=await runPressCollection(sources,"2026-10-18",two.report.results,async()=>new Response("ok",{headers:{"content-type":"text/html"}}));
 assert.equal(pressCollectionFailures(recovered.report).length,0);
 const again=await runPressCollection(sources,"2026-10-19",recovered.report.results,bad);
 assert.notDeepEqual(pressCollectionFailures(one.report),pressCollectionFailures(again.report));
});
