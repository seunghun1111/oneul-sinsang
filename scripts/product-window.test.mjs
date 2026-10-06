import assert from "node:assert/strict";
import test from "node:test";
import { isCurrentlyOnSale, isDetectedToday, seoulDateKey } from "../src/lib/product-window.ts";

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

test("오늘 업데이트는 한국 날짜 기준 최초 확인일로 판정한다", () => {
  const item = product({ firstDetectedAt: "2026-10-05T15:30:00.000Z" });
  assert.equal(seoulDateKey(item.firstDetectedAt), "2026-10-06");
  assert.equal(isDetectedToday(item, new Date("2026-10-06T10:00:00+09:00")), true);
});
