import test from "node:test";
import assert from "node:assert/strict";
import {evaluateProducts} from "./lib/auto-review.ts";
import {reviewAlerts} from "./lib/review-alerts.ts";
const now=new Date("2026-10-15T01:00:00Z");
const item={id:"bhc-test",brand:"bhc",name:"신상",normalizedName:"신상",sourceUrl:"https://www.bhc.co.kr/menu",isActive:true,availabilityStatus:"on_sale",availabilityCheckedAt:now.toISOString(),releaseDate:"2026-10-15",reviewEvidence:{sourceUrl:"https://www.bhc.co.kr/menu",checkedAt:now.toISOString(),robots:"allowed",explicitNew:true,officialDate:"2026-10-01",dateKind:"launch",saleConfirmed:true}};
const verdict=p=>evaluateProducts([p],now).products[p.id];
test("모든 근거가 유효할 때만 자동 승인",()=>assert.equal(verdict(item).decision,"approved"));
test("기존 releaseDate와 NEW만으로 승인하지 않음",()=>{const p={...item,reviewEvidence:undefined};assert.equal(verdict(p).decision,"pending");assert.ok(verdict(p).codes.includes("date"));});
test("공식 날짜 30일 경계 및 미래·잘못된 날짜",()=>{
 for(const [date,result] of [["2026-09-15","rejected"],["2026-09-16","approved"],["2026-10-16","pending"],["2026-99-01","pending"]]) assert.equal(verdict({...item,reviewEvidence:{...item.reviewEvidence,officialDate:date}}).decision,result);
});
test("출처 위조·오래된 정책·근거 URL 불일치·판매 불명은 대기",()=>{
 for(const change of [{sourceUrl:"https://www.bhc.co.kr.evil.test/menu"},{reviewEvidence:{...item.reviewEvidence,sourceUrl:"https://other.test"}},{reviewEvidence:{...item.reviewEvidence,checkedAt:"2026-10-01"}},{reviewEvidence:{...item.reviewEvidence,saleConfirmed:false}}]) assert.equal(verdict({...item,...change}).decision,"pending");
});
test("명시적 정책 제한과 판매 종료는 자동 제외, 중복 ID는 대기",()=>{
 assert.equal(verdict({...item,reviewEvidence:{...item.reviewEvidence,robots:"blocked"}}).decision,"rejected");
 assert.equal(verdict({...item,availabilityStatus:"ended"}).decision,"rejected");
 assert.ok(evaluateProducts([item,item],now).products[item.id].codes.includes("identity"));
});
test("수동 결정·기전송 알림 제외, 새 사유만 알림",()=>{
 const report=evaluateProducts([{...item,reviewEvidence:undefined}],now);
 const initial=reviewAlerts(report,{},{});assert.ok(initial.length>0);
 assert.equal(reviewAlerts(report,{[item.id]:{decision:"approved"}},{}).length,0);
 const sent=Object.fromEntries(initial.map(a=>[a.key,"2026-10-14"]));
 assert.equal(reviewAlerts(report,{},sent).length,0);
 assert.equal(reviewAlerts(report,{},sent,["bhc"]).length,1);
});
