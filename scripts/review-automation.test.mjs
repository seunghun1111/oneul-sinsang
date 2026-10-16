import test from "node:test";
import assert from "node:assert/strict";
import{evaluateProducts}from"./lib/auto-review.ts";
import{buildReviewQueue}from"./lib/review-queue.ts";
import{reviewAlerts}from"./lib/review-alerts.ts";
const now=new Date("2026-10-16T00:00:00Z");
const url="https://news.pulmuone.co.kr/pulmuone/newsroom/viewNewsroom.do?menu=dataroom&id=1";
const product={id:"sample-launch",brand:"풀무원",name:"신상 두유",normalizedName:"신상두유",sourceType:"press_release",sourceUrl:url,isActive:true,reviewEvidence:{sourceUrl:url,robots:"not_provided",checkedAt:now.toISOString(),officialLaunchAnnouncement:true,announcementProductName:"신상 두유",officialDate:"2026-10-12",dateKind:"announcement"}};
const result=p=>evaluateProducts([p],now).products[p.id];
test("최근 공식 발표는 상품·날짜·경로 일치 시 자동 승인하며 오래된 발표는 보관한다",()=>{
 assert.equal(result(product).rule,"recent_official_announcement");assert.equal(result(product).decision,"approved");
 const old={...product,reviewEvidence:{...product.reviewEvidence,officialDate:"2026-08-01"}};
 assert.equal(result(old).action,"archive");assert.equal(result(old).decision,"pending");
 const future={...product,reviewEvidence:{...product.reviewEvidence,officialDate:"2026-10-20"}};
 assert.equal(result(future).action,"scheduled");assert.equal(result(future).decision,"pending");
});
test("이름 불일치·잘못된 날짜·목록 경로·허위 출처는 자동 승인하지 않는다",()=>{
 for(const evidence of [{announcementProductName:"다른 두유"},{officialDate:"2026-02-30"},{officialDate:""},{checkedAt:"bad"}])assert.equal(result({...product,reviewEvidence:{...product.reviewEvidence,...evidence}}).action,"manual");
 assert.equal(result({...product,sourceUrl:"https://evil.test/press"}).action,"manual");
 assert.equal(result({...product,sourceUrl:url.replace("viewNewsroom.do","listDataroom.do")}).action,"manual");
 const stale={...product,reviewEvidence:{...product.reviewEvidence,checkedAt:"2026-10-10"}};assert.equal(result(stale).action,"retry");
});
test("검색·판매 링크만 존재하는 상품과 NEW 미확인은 관찰하며 수동 승인 요청을 만들지 않는다",()=>{
 const p={...product,reviewEvidence:undefined,discoveryReferences:[{kind:"sale",verified:true,url:"https://shop.example/item",checkedAt:now.toISOString()}]};
 const report=evaluateProducts([p],now);const q=buildReviewQueue([p],report,{},undefined,now);
 assert.equal(q.products[p.id].action,"observe");assert.deepEqual(reviewAlerts(report,{}, {},[],q),[]);
});
test("재실행은 재시도 횟수를 올리지 않으며 새 실패 3회만 관리자에게 올린다",()=>{
 const p={...product,reviewEvidence:{...product.reviewEvidence,officialLaunchAnnouncement:false,newCheckReason:"source_unavailable"}};
 const report=evaluateProducts([p],now);
 let q=buildReviewQueue([p],report,{},undefined,now,{"풀무원":{status:"failed",checkedAt:"2026-10-13"}});
 assert.equal(q.products[p.id].attempts,1);
 q=buildReviewQueue([p],report,{},q,now,{"풀무원":{status:"failed",checkedAt:"2026-10-13"}});assert.equal(q.products[p.id].attempts,1);
 for(const day of [14,15])q=buildReviewQueue([p],report,{},q,now,{"풀무원":{status:"failed",checkedAt:`2026-10-${day}`}});
 assert.equal(q.products[p.id].action,"manual");assert.equal(reviewAlerts(report,{}, {},[],q).length,1);
 const manual=buildReviewQueue([p],report,{[p.id]:{decision:"rejected"}},q,now);assert.equal(manual.products[p.id].action,"manual_override");assert.equal(reviewAlerts(report,{[p.id]:{}}, {},[],manual).length,0);
});
