import assert from "node:assert/strict";
import test from "node:test";
import { mergeFoodserviceProducts } from "./update-foodservice-products.ts";

const product = (id, brand) => ({
  id, brand, name: id, normalizedName: id, category: "burger", subCategory: "신메뉴", productType: "new",
  currency: "KRW", retailer: brand, sourceUrl: "https://example.com", sourceType: "official_site",
  releaseDate: "2026-10-01", firstDetectedAt: "2026-10-01T00:00:00.000Z", lastCheckedAt: "2026-10-01T00:00:00.000Z",
  availabilityStatus: "on_sale", availabilityCheckedAt: "2026-10-01T00:00:00.000Z", isActive: true,
  createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z",
});

test("수집 성공 브랜드에서 NEW가 사라진 상품만 종료 처리한다", () => {
  const merged = mergeFoodserviceProducts([product("lotteria-old", "롯데리아"), product("dominos-old", "도미노피자")], [], ["롯데리아"], "2026-10-07T00:00:00.000Z");
  assert.equal(merged.find(item => item.brand === "롯데리아").isActive, false);
  assert.equal(merged.find(item => item.brand === "도미노피자").isActive, true);
});
