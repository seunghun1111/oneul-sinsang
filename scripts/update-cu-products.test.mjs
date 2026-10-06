import assert from "node:assert/strict";
import test from "node:test";
import { mergeCuProducts } from "./update-cu-products.ts";

const candidate = (id, name) => ({
  slug: id, brand: "CU", name, normalizedName: name, category: "convenience", subCategory: "음료",
  productType: "new", price: null, retailer: "CU", releaseDate: null, announcedDate: "2026-10-06",
  description: "CU 공식 전체상품의 음료 최신등록순에서 NEW 배지가 확인된 상품",
  sourceUrl: `https://cu.bgfretail.com/product/view.do?category=product&gdIdx=${id.slice(3)}`,
  sourceType: "official_site", imageUrl: "https://cdn.example.com/product.jpg",
});

test("NEW 배지가 사라진 기존 CU 상품은 기본 목록에서 제외한다", () => {
  const checkedAt = "2026-10-06T00:00:00.000Z";
  const previous = mergeCuProducts([], [candidate("cu-1", "이전상품")], "2026-10-05T00:00:00.000Z");
  const updated = mergeCuProducts(previous, [candidate("cu-2", "신상품")], checkedAt);
  assert.equal(updated.find(product => product.id === "cu-1")?.isActive, false);
  assert.equal(updated.find(product => product.id === "cu-1")?.availabilityStatus, "ended");
  assert.equal(updated.find(product => product.id === "cu-2")?.isActive, true);
});
