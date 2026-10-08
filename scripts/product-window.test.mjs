import assert from "node:assert/strict";
import test from "node:test";
import { isCurrentlyOnSale, isDetectedOn, isDetectedToday, seoulDateKey, seoulMonthKey, seoulWeekDateKeys } from "../src/lib/product-window.ts";

function product(overrides = {}) {
  return {
    id: "cu-1", brand: "CU", name: "신상품", normalizedName: "신상품", category: "convenience",
    productType: "new", currency: "KRW", sourceUrl: "https://cu.bgfretail.com/product/view.do?gdIdx=1",
    sourceType: "official_site", firstDetectedAt: "2026-09-07T00:00:00.000Z", lastCheckedAt: "2026-10-06T00:00:00.000Z",
    availabilityStatus: "on_sale", availabilityCheckedAt: "2026-10-06T00:00:00.000Z", isActive: true,
    createdAt: "2026-09-07T00:00:00.000Z", updatedAt: "2026-10-06T00:00:00.000Z", ...overrides,
  };
}

test("CU 상품은 최초 확인일부터 30일 미만인 경우만 표시한다", () => {
  assert.equal(isCurrentlyOnSale(product(), new Date("2026-10-06T00:00:00.000Z")), true);
  assert.equal(isCurrentlyOnSale(product({ firstDetectedAt: "2026-09-06T00:00:00.000Z" }), new Date("2026-10-06T00:00:00.000Z")), false);
});

test("세븐일레븐과 이마트24도 최초 확인일부터 30일 동안 표시한다", () => {
  for (const brand of ["세븐일레븐", "이마트24"]) {
    assert.equal(isCurrentlyOnSale(product({ brand, firstDetectedAt: "2026-09-07T00:00:00.000Z" }), new Date("2026-10-06T00:00:00.000Z")), true);
    assert.equal(isCurrentlyOnSale(product({ brand, firstDetectedAt: "2026-09-06T00:00:00.000Z" }), new Date("2026-10-06T00:00:00.000Z")), false);
  }
});

test("다른 상품도 공식 출시일부터 30일 미만인 경우만 표시한다", () => {
  const coffee = product({ brand: "스타벅스", category: "cafe", releaseDate: "2026-09-07", firstDetectedAt: "2026-08-01T00:00:00.000Z" });
  assert.equal(isCurrentlyOnSale(coffee, new Date("2026-10-06T00:00:00.000Z")), true);
  assert.equal(isCurrentlyOnSale({ ...coffee, releaseDate: "2026-09-06" }, new Date("2026-10-06T00:00:00.000Z")), false);
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
