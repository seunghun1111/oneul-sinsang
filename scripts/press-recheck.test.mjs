import test from "node:test";
import assert from "node:assert/strict";
import {createPressRechecker,recheckPressArticle} from "./lib/press-recheck.ts";
const product={brand:"풀무원",name:"생만두",sourceType:"press_release",sourceUrl:"https://news.pulmuone.co.kr/pulmuone/newsroom/viewNewsroom.do?menu=dataroom&id=3925"};
const html=`<div class="news_titwrap02"><div class="news_intit"><h1>풀무원, ‘생만두’ 출시</h1></div><div class="news_indata">2026년 9월 3일</div></div><div class="news_cnt"><div class="txt_ty01">풀무원 생만두 신제품 출시</div></div>`;
test("개별 발표의 실제 날짜·상품·본문을 재검증하고 기존 날짜로 대체하지 않는다",()=>{
 const candidate=recheckPressArticle({...product,releaseDate:"2026-10-16"},html);
 assert.equal(candidate.announcedDate,"2026-09-03");
 assert.equal(candidate.reviewEvidence.announcementProductName,product.name);
 assert.equal(recheckPressArticle({...product,name:"다른 만두"},html),null);
 assert.equal(recheckPressArticle(product,html.replace("2026년 9월 3일","날짜 없음")),null);
 assert.equal(recheckPressArticle(product,html.replace("2026년 9월 3일","2026년 2월 30일")),null);
 assert.equal(recheckPressArticle(product,html.replace("풀무원 생만두 신제품 출시","상품 내용 없음")),null);
 assert.equal(recheckPressArticle({...product,sourceUrl:"https://example.com/?id=3925"},html),null);
});
test("허용된 공식 출처만 요청하며 robots 차단·리다이렉트·오류를 우회하지 않는다",async()=>{
 let requests=[];
 const denied=createPressRechecker(async url=>{requests.push(url);return new Response("User-agent: *\nDisallow: /pulmuone/");});
 await assert.rejects(()=>denied(product),/policy_restricted/);
 assert.equal(requests.length,1);
 await assert.rejects(()=>denied({...product,sourceUrl:"https://kakao.com/?id=3925"}),/unsupported_source/);
 assert.equal(requests.length,1);
 requests=[];
 const redirect=createPressRechecker(async(url,init)=>{
   requests.push(url);assert.equal(init.redirect,"manual");
   return url.endsWith("robots.txt")?new Response("",{status:404}):new Response("",{status:302,headers:{location:"https://example.com"}});
 });
 await assert.rejects(()=>redirect(product),/source_unavailable/);
 assert.equal(requests.length,2);
});
test("robots 미제공은 확인 완료로 위장하지 않으며 원문과 상품이 일치할 때만 근거를 만든다",async()=>{
 const recheck=createPressRechecker(async url=>url.endsWith("robots.txt")?new Response("",{status:404}):new Response(html,{headers:{"content-type":"text/html; charset=utf-8"}}));
 const result=await recheck(product);
 assert.equal(result.reviewEvidence.robots,"not_provided");
 assert.equal(result.reviewEvidence.officialLaunchAnnouncement,true);
});
