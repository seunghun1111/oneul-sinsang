import test from "node:test";
import assert from "node:assert/strict";
import {createPolicyPreflight} from "./lib/policy-preflight.ts";
test("정책 사전 점검은 상품 URL을 실제 요청하지 않고 캐시된 정책으로 판정한다",async()=>{
 const calls=[];const probe=createPolicyPreflight(async input=>{calls.push(String(input));return new Response("User-agent: *\nDisallow: /private");});
 assert.equal((await probe("https://official.example.com/menu")).status,"allowed");
 assert.equal((await probe("https://official.example.com/private")).status,"blocked");
 assert.equal(calls.length,1);assert.equal(calls[0],"https://official.example.com/robots.txt");
 assert.equal((await probe("https://kakao.com/menu")).status,"restricted");assert.equal(calls.length,1);
});
test("정책 미제공을 허용 판정이나 실패 판정으로 위장하지 않는다",async()=>{
 for(const [code,status] of [[404,"not_provided"],[410,"not_provided"],[403,"failed"],[503,"failed"],[302,"failed"]]){
  const probe=createPolicyPreflight(async()=>new Response("",{status:code}));
  assert.equal((await probe("https://official.example.com/menu")).status,status);
 }
});
