import test from "node:test";
import assert from "node:assert/strict";
import {createCollectionFetcher,collectionUrlAllowed} from "./lib/collection-http.ts";
test("공통 전송은 제한 도메인·IP·내부 호스트·인증 URL에 요청하지 않는다",async()=>{
 let calls=0;const fetcher=createCollectionFetcher(async()=>{calls++;return new Response("ok");});
 for(const url of ["https://kakao.com/a","https://api.daum.net/a","https://daumtools.com/a","https://10.0.0.1/a","https://192.168.1.1/a","https://127.1/a","https://[::1]/a","https://api.internal/a","http://official.example.com/a","https://user:secret@official.example.com/a"]){
  assert.equal(collectionUrlAllowed(url),false);await assert.rejects(()=>fetcher(url),/URL 제한/);
 }
 assert.equal(calls,0);
 assert.equal(collectionUrlAllowed("https://www.starbucks.co.kr/menu/drink_list.do"),true);
});
test("공통 전송은 리다이렉트를 따르지 않고 POST 조건·기존 취소 신호를 유지한다",async()=>{
 const controller=new AbortController();let calls=0,options;
 const fetcher=createCollectionFetcher(async(input,init)=>{calls++;options=init;return new Response(null,{status:302,headers:{location:"https://kakao.com"}});});
 const body=new URLSearchParams({pTab:"8"});
 const response=await fetcher("https://www.7-eleven.co.kr/product/presentList.asp",{method:"POST",body,redirect:"follow",signal:controller.signal});
 assert.equal(response.status,302);assert.equal(calls,1);assert.equal(options.redirect,"manual");assert.equal(options.credentials,"omit");assert.equal(options.method,"POST");assert.equal(options.body,body);
 assert.match(options.headers.get("user-agent"),/OneulSinsang/);
 controller.abort();assert.equal(options.signal.aborted,true);
});
test("인증 헤더는 전송하지 않고 원문 네트워크 오류도 노출하지 않는다",async()=>{
 let calls=0;const fetcher=createCollectionFetcher(async()=>{calls++;throw Error("private token=secret-value");});
 for(const header of ["Authorization","Cookie","Proxy-Authorization"])await assert.rejects(()=>fetcher("https://official.example.com",{headers:{[header]:"secret-value"}}),/인증정보 전송 제한/);
 assert.equal(calls,0);
 await assert.rejects(()=>fetcher("https://official.example.com"),error=>!error.message.includes("secret-value")&&error.message.includes("네트워크 요청 실패"));
});
