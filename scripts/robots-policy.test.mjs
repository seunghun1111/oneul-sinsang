import test from "node:test";
import assert from "node:assert/strict";
import {robotsAllows} from "./lib/robots-policy.ts";
import {createCollectionFetcher,createRobotsFetcher} from "./lib/collection-http.ts";
import {runBrandCollection} from "./lib/brand-collection-run.ts";
const origin="https://official.example.com";
test("공통 robots는 구체적인 사용자 에이전트·와일드카드·쿼리·Allow 우선순위를 적용한다",()=>{
 const policy="User-agent: *\nDisallow: /\nUser-agent: OneulSinsang\nDisallow: /private*\nAllow: /private/public$\nDisallow: /*?token=*";
 assert.equal(robotsAllows(policy,origin+"/menu"),true);
 assert.equal(robotsAllows(policy,origin+"/private/a"),false);
 assert.equal(robotsAllows(policy,origin+"/private/public"),true);
 assert.equal(robotsAllows(policy,origin+"/private/public/more"),false);
 assert.equal(robotsAllows(policy,origin+"/menu?token=x"),false);
 assert.equal(robotsAllows("User-agent: OneulSinsang\nDisallow:\nUser-agent: *\nDisallow: /",origin+"/menu"),true);
});
test("병렬 상품 요청은 정책을 한 번만 읽고 차단된 상품에는 요청하지 않는다",async()=>{
 const calls=[];
 const fetcher=createRobotsFetcher(createCollectionFetcher(async(url)=>{calls.push(String(url));return String(url).endsWith("robots.txt")?new Response("User-agent: *\nDisallow: /blocked"):new Response("ok");}));
 await Promise.all([fetcher(origin+"/a"),fetcher(origin+"/b")]);
 await assert.rejects(()=>fetcher(origin+"/blocked"),/robots 수집 제한/);
 assert.equal(calls.filter(u=>u.endsWith("robots.txt")).length,1);assert.equal(calls.length,3);
});
test("404·410 정책 미제공과 조회 실패·리다이렉트·HTML 응답을 구분한다",async()=>{
 for(const status of [404,410,403,429,503,302,200]){
  let calls=0;
  const fetcher=createRobotsFetcher(createCollectionFetcher(async()=>{calls++;return new Response(status===200?"<html>error</html>":"",{status});}));
  if([404,410].includes(status)){await fetcher(origin+"/menu");assert.equal(calls,2);}
  else {await assert.rejects(()=>fetcher(origin+"/menu"));assert.equal(calls,1);}
 }
});
test("정책 오류는 브랜드 수집 실패로 분류하며 정상 NEW 0건으로 취급하지 않는다",async()=>{
 const fetcher=createRobotsFetcher(createCollectionFetcher(async()=>new Response("error",{status:503})));
 const result=await runBrandCollection([["브랜드",async()=>{await fetcher(origin+"/menu");return [];}]],"2026-10-17");
 assert.equal(result.report.results[0].status,"failed");assert.deepEqual(result.checkedBrands,[]);
});
test("오래된 정책과 실패 캐시는 만료 후 재확인한다",async()=>{
 let time=0,calls=0;
 const fetcher=createRobotsFetcher(createCollectionFetcher(async(url)=>{if(String(url).endsWith("robots.txt")){calls++;return calls===1?new Response("",{status:503}):new Response("User-agent: *\nAllow: /");}return new Response("ok");}),()=>time);
 await assert.rejects(()=>fetcher(origin+"/menu"));await assert.rejects(()=>fetcher(origin+"/menu"));assert.equal(calls,1);
 time=60001;await fetcher(origin+"/menu");assert.equal(calls,2);
 time+=3600001;await fetcher(origin+"/menu");assert.equal(calls,3);
});
