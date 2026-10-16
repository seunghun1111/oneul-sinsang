import test from "node:test";
import assert from "node:assert/strict";
import {evaluateProducts} from "./lib/auto-review.ts";
import {reviewAlerts} from "./lib/review-alerts.ts";
const item={id:"nene-test",brand:"네네치킨",name:"신상",normalizedName:"신상",sourceUrl:"https://nenechicken.com/home_menu.asp",isActive:true,reviewEvidence:{sourceUrl:"https://nenechicken.com/home_menu.asp",checkedAt:"2026-10-15",robots:"not_provided",explicitNew:true}};
const verdict=p=>evaluateProducts([p]).products[p.id];
test("공식 NEW는 출시일·판매 증명이 없어도 승인",()=>assert.equal(verdict(item).decision,"approved"));
test("교촌 공식 신메뉴 탭 근거만 제한적으로 승인한다",()=>{
 const url="https://www.kyochon.com/menu/chicken.asp?code=21";
 const k={...item,brand:"교촌치킨",sourceUrl:url,reviewEvidence:{...item.reviewEvidence,sourceUrl:url,explicitNew:false,officialNewListing:"kyochon_code_21"}};
 assert.equal(verdict(k).decision,"approved");
 assert.match(verdict(k).reason,/code=21/);
 assert.equal(verdict({...k,sourceUrl:url.replace('21','4')}).decision,"pending");
 assert.equal(verdict({...k,brand:"네네치킨"}).decision,"pending");
 assert.equal(verdict({...k,reviewEvidence:{...k.reviewEvidence,robots:"blocked"}}).decision,"rejected");
});
test("오래된 날짜로 NEW를 자동 제외하지 않는다",()=>assert.equal(verdict({...item,releaseDate:"2024-01-01"}).decision,"approved"));
test("NEW 없는 단순 목록·발표를 NEW로 추정하지 않는다",()=>assert.equal(verdict({...item,reviewEvidence:{...item.reviewEvidence,explicitNew:false,officialLaunchAnnouncement:true}}).decision,"pending"));
test("재확인 보류 사유는 표시하지만 승인 근거로 대체하지 않는다",()=>{
 const p={...item,reviewEvidence:{...item.reviewEvidence,explicitNew:false,newCheckReason:"announcement_only"}};
 assert.equal(verdict(p).decision,"pending");
 assert.match(verdict(p).reason,/공식 출시 발표는 확인/);
});
test("명시적 정책 제한과 NEW 종료는 제외",()=>{
 assert.equal(verdict({...item,reviewEvidence:{...item.reviewEvidence,robots:"blocked"}}).decision,"rejected");
 assert.equal(verdict({...item,newStatus:"removed"}).decision,"rejected");
});
test("위조 출처와 중복 ID는 확인 필요",()=>{
 assert.equal(verdict({...item,sourceUrl:"https://nenechicken.com.evil.test"}).decision,"pending");
 assert.ok(evaluateProducts([item,item]).products[item.id].codes.includes("identity"));
});
test("NEW 미확인은 알림하지 않고 예외만 중복 없이 알림",()=>{
 assert.equal(reviewAlerts(evaluateProducts([{...item,reviewEvidence:undefined}]),{},{}).length,0);
 const bad=evaluateProducts([{...item,sourceUrl:"https://other.test"}]);
 const alerts=reviewAlerts(bad,{},{});assert.ok(alerts.length>0);
 assert.equal(reviewAlerts(bad,{},Object.fromEntries(alerts.map(a=>[a.key,"sent"]))).length,0);
 assert.equal(reviewAlerts(bad,{[item.id]:{}},{}).length,0);
});
