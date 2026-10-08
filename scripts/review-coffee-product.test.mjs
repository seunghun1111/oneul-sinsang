import assert from "node:assert/strict";
import test from "node:test";
import { reviewCoffeeProduct } from "./review-coffee-product.ts";

const pending = {
  id: "coffee-test-product", brand: "테스트", name: "신메뉴", normalizedName: "신메뉴", category: "cafe",
  productType: "new", currency: "KRW", sourceUrl: "https://example.com", sourceType: "official_site",
  firstDetectedAt: "2026-10-08T00:00:00.000Z", lastCheckedAt: "2026-10-08T00:00:00.000Z",
  reviewStatus: "pending", isActive: true, createdAt: "2026-10-08T00:00:00.000Z", updatedAt: "2026-10-08T00:00:00.000Z",
};

test("검수 대기 상품을 승인하면 검수 시각과 승인 사유를 기록한다", () => {
  const [approved] = reviewCoffeeProduct([pending], pending.id, "approved", "2026-10-08T01:00:00.000Z");
  assert.equal(approved.reviewStatus, "approved");
  assert.equal(approved.reviewedAt, "2026-10-08T01:00:00.000Z");
  assert.match(approved.availabilityReason, /검수해 승인/);
});

test("존재하지 않거나 잘못된 상품 ID는 검수하지 않는다", () => {
  assert.throws(() => reviewCoffeeProduct([pending], "missing-product", "approved", "2026-10-08T01:00:00.000Z"), /찾을 수 없습니다/);
  assert.throws(() => reviewCoffeeProduct([pending], "../unsafe", "approved", "2026-10-08T01:00:00.000Z"), /올바르지 않은/);
});
