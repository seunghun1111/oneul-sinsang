import assert from "node:assert/strict";
import test from "node:test";
import { mergeReviewCatalog, reviewReason } from "../chatgpt-site/lib/review/catalog.ts";
test("전체 카테고리의 검수 결정이 재수집 결과보다 우선하며 커피 대기 상태를 유지한다", () => {
 const base={brand:"브랜드",name:"상품",sourceUrl:"https://example.com",firstDetectedAt:"2026-10-15",lastCheckedAt:"2026-10-15"};
 const catalog=[{...base,id:"chicken-test",category:"chicken"},{...base,id:"icecream-test",category:"icecream"}];
 const coffee=[{...base,id:"coffee-test",category:"cafe",reviewStatus:"pending"}];
 const merged=mergeReviewCatalog(catalog,coffee,{"chicken-test":{decision:"rejected",reviewedAt:"2026-10-15"}});
 assert.deepEqual(merged.map(p=>p.reviewStatus),["rejected","approved","pending"]);
 assert.match(reviewReason(merged[2]),/공식 NEW/);
 assert.match(reviewReason({...merged[2],releaseDate:"2026-10-15"}),/실제 출시일/);
 assert.equal(mergeReviewCatalog(catalog,catalog,{}).length,2);
});
test("자동 판정 사유를 노출하고 관리자 결정이 우선한다",()=>{
 const p={id:"test",name:"상품",category:"cafe",brand:"브랜드",sourceUrl:"https://example.com",firstDetectedAt:"2026-10-15",lastCheckedAt:"2026-10-15"};
 const auto={products:{test:{decision:"pending",reason:"출시일 불명",checkedAt:"2026-10-15"}}};
 const automatic=mergeReviewCatalog([p],[],{},auto)[0];
 assert.equal(automatic.reviewStatus,"pending");assert.equal(reviewReason(automatic),"출시일 불명");
 const manual=mergeReviewCatalog([p],[],{test:{decision:"approved",reviewedAt:"2026-10-15"}},auto)[0];
 assert.equal(manual.reviewStatus,"approved");assert.equal(manual.decisionSource,"manual");assert.match(reviewReason(manual),/관리자/);
});
