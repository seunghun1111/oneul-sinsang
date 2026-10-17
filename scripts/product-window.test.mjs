import assert from "node:assert/strict";
import test from "node:test";
import {discoveryEvidence} from "../chatgpt-site/lib/review/discovery-evidence.ts";
import {evaluateProducts} from "./lib/auto-review.ts";
import { isCurrentlyOnSale, isDetectedOn, isDetectedToday, seoulDateKey, seoulMonthKey, seoulWeekDateKeys } from "../src/lib/product-window.ts";

function product(overrides = {}) {
  return {
    id: "cu-1", brand: "CU", name: "신상품", normalizedName: "신상품", category: "convenience",
    reviewEvidence:{explicitNew:true}, productType: "new", currency: "KRW", sourceUrl: "https://cu.bgfretail.com/product/view.do?gdIdx=1",
    sourceType: "official_site", firstDetectedAt: "2026-09-07T00:00:00.000Z", lastCheckedAt: "2026-10-06T00:00:00.000Z",
    availabilityStatus: "on_sale", availabilityCheckedAt: "2026-10-06T00:00:00.000Z", isActive: true,
    createdAt: "2026-09-07T00:00:00.000Z", updatedAt: "2026-10-06T00:00:00.000Z", ...overrides,
  };
}
test("검증된 교촌 신메뉴 탭은 자동 검수·공개 목록·근거 표시가 일치한다",()=>{
 const url="https://www.kyochon.com/menu/chicken.asp?code=21";
 const item=product({brand:"교촌치킨",category:"chicken",sourceUrl:url,reviewEvidence:{sourceUrl:url,officialNewListing:"kyochon_code_21"}});
 assert.equal(evaluateProducts([item]).products[item.id].decision,"approved");
 assert.equal(isCurrentlyOnSale(item),true);assert.equal(discoveryEvidence(item).newLabel,"공식 NEW 확인");
 for(const invalid of [{...item,brand:"다른 브랜드"},{...item,sourceUrl:url+"0"},{...item,reviewEvidence:{...item.reviewEvidence,officialNewListing:"invented"}}]){
  assert.equal(isCurrentlyOnSale(invalid),false);assert.equal(discoveryEvidence(invalid).newLabel,"공식 근거 참조");
 }
 assert.equal(isCurrentlyOnSale({...item,reviewStatus:"pending"}),false);
 assert.equal(isCurrentlyOnSale({...item,isActive:false}),false);
});

test("CU는 NEW가 유지되는 동안 30일 제한 없이 표시한다", () => {
  assert.equal(isCurrentlyOnSale(product(), new Date("2026-10-06T00:00:00.000Z")), true);
  assert.equal(isCurrentlyOnSale(product({ firstDetectedAt: "2026-09-06T00:00:00.000Z" }), new Date("2026-10-06T00:00:00.000Z")), true);
});

test("다른 편의점도 NEW 유지 기간 동안 표시한다", () => {
  for (const brand of ["세븐일레븐", "이마트24"]) {
    assert.equal(isCurrentlyOnSale(product({ brand, firstDetectedAt: "2026-09-07T00:00:00.000Z" }), new Date("2026-10-06T00:00:00.000Z")), true);
    assert.equal(isCurrentlyOnSale(product({ brand, firstDetectedAt: "2026-09-06T00:00:00.000Z" }), new Date("2026-10-06T00:00:00.000Z")), true);
  }
});

test("출시일이 오래되어도 공식 NEW 유지 상품은 표시한다", () => {
  const coffee = product({ brand: "스타벅스", category: "cafe", releaseDate: "2026-09-07", firstDetectedAt: "2026-08-01T00:00:00.000Z" });
  assert.equal(isCurrentlyOnSale(coffee, new Date("2026-10-06T00:00:00.000Z")), true);
  assert.equal(isCurrentlyOnSale({ ...coffee, releaseDate: "2026-09-06" }, new Date("2026-10-06T00:00:00.000Z")), true);
});

test("오늘 업데이트는 한국 날짜 기준 최초 확인일로 판정한다", () => {
  const item = product({ firstDetectedAt: "2026-10-05T15:30:00.000Z" });
  assert.equal(seoulDateKey(item.firstDetectedAt), "2026-10-06");
  assert.equal(isDetectedToday(item, new Date("2026-10-06T10:00:00+09:00")), true);
});

test("이번 주는 한국 시간 기준 월요일부터 일요일까지 계산한다", () => {
  assert.deepEqual(seoulWeekDateKeys(new Date("2026-10-08T10:00:00+09:00")), [
    "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11",
  ]);
  assert.equal(isDetectedOn(product({ firstDetectedAt: "2026-10-06T14:59:59.000Z" }), "2026-10-06"), true);
  assert.equal(isDetectedOn(product({ firstDetectedAt: "2026-10-06T15:00:00.000Z" }), "2026-10-07"), true);
});

test("이번 달은 한국 시간의 연월을 기준으로 계산한다", () => {
  assert.equal(seoulMonthKey("2026-09-30T14:59:59.000Z"), "2026-09");
  assert.equal(seoulMonthKey("2026-09-30T15:00:00.000Z"), "2026-10");
});
test("NEW 종료는 목록에서 제외하고 판매 상태 불명만으로 NEW를 숨기지 않는다",()=>{
 assert.equal(isCurrentlyOnSale(product({newStatus:"removed"})),false);
 assert.equal(isCurrentlyOnSale(product({availabilityStatus:"unknown"})),true);
 assert.equal(isCurrentlyOnSale(product({reviewEvidence:undefined})),false);
});
