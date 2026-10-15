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
test("상품이 정상 확인되는 목록에서는 사라진 개별 NEW만 제외한다",()=>{
 const candidate={...product("lotteria-new","롯데리아"),slug:"lotteria-new",sourceType:"official_site",description:"공식 NEW"};
 const merged=mergeFoodserviceProducts([product("lotteria-old","롯데리아")],[candidate],["롯데리아"],"2026-10-16T00:00:00Z");
 assert.equal(merged.find(p=>p.id==="lotteria-old").newStatus,"removed");
 assert.equal(merged.find(p=>p.id==="lotteria-new").isActive,true);
});

test("HTTP 성공이어도 기존 NEW 목록 전체가 0건이면 기존 상품을 유지한다", () => {
  const merged = mergeFoodserviceProducts([product("lotteria-old", "롯데리아"), product("dominos-old", "도미노피자")], [], ["롯데리아"], "2026-10-07T00:00:00.000Z");
  assert.equal(merged.find(item => item.brand === "롯데리아").isActive, true);
  assert.equal(merged.find(item => item.brand === "도미노피자").isActive, true);
});
