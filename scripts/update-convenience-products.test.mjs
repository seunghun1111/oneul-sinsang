import assert from "node:assert/strict";
import test from "node:test";
import { mergeConvenienceProducts } from "./update-convenience-products.ts";

const product = (id, brand, active = true) => ({
  id, brand, name: id, normalizedName: id, category: "convenience", subCategory: "신상품",
  productType: "new", price: null, retailer: brand, releaseDate: "2026-10-01", announcedDate: "2026-10-01",
  description: "공식 NEW", sourceUrl: "https://example.com", sourceType: "official_site", imageUrl: null,
  firstDetectedAt: "2026-10-01T00:00:00.000Z", lastDetectedAt: "2026-10-01T00:00:00.000Z",
  availabilityStatus: active ? "available" : "ended", availabilityCheckedAt: "2026-10-01T00:00:00.000Z",
  isActive: active, createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z",
});

test("확인에 성공한 브랜드에서 NEW가 사라진 상품만 판매 종료 처리한다", () => {
  const existing = [product("seven-eleven-old", "세븐일레븐"), product("emart24-old", "이마트24")];
  const merged = mergeConvenienceProducts(existing, [], ["세븐일레븐"], "2026-10-06T00:00:00.000Z");
  assert.equal(merged.find(item => item.brand === "세븐일레븐").isActive, false);
  assert.equal(merged.find(item => item.brand === "이마트24").isActive, true);
});
