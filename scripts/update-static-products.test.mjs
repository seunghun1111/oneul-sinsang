import assert from "node:assert/strict";
import test from "node:test";
import { mergeProducts } from "./update-static-products.ts";

test("새 공식 상품을 정적 데이터 형식으로 변환한다", () => {
  const checkedAt = "2026-10-02T00:00:00.000Z";
  const [product] = mergeProducts([], [{
    slug: "brand-1", brand: "브랜드", name: "새 상품", normalizedName: "새상품", category: "meal",
    productType: "new", price: null, retailer: null, releaseDate: null, announcedDate: "2026-10-01",
    description: "공식 발표", sourceUrl: "https://example.com/1", imageUrl: null,
  }], checkedAt);
  assert.equal(product.id, "brand-1");
  assert.equal(product.releaseDate, "2026-10-01");
  assert.equal(product.firstDetectedAt, checkedAt);
  assert.equal("price" in product, false);
});

test("재수집 시 최초 발견일과 기존 이미지를 보존한다", () => {
  const existing = mergeProducts([], [{
    slug: "brand-1", brand: "브랜드", name: "새 상품", normalizedName: "새상품", category: "drink",
    productType: "new", price: null, retailer: "공식몰", releaseDate: null, announcedDate: "2026-10-01",
    description: "이전 설명", sourceUrl: "https://example.com/1", imageUrl: "https://example.com/image.jpg",
  }], "2026-10-01T00:00:00.000Z");
  const [updated] = mergeProducts(existing, [{
    slug: "changed", brand: "브랜드", name: "새 상품", normalizedName: "새상품", category: "drink",
    productType: "new", price: null, retailer: null, releaseDate: null, announcedDate: "2026-10-02",
    description: "새 설명", sourceUrl: "https://example.com/2", imageUrl: null,
  }], "2026-10-02T00:00:00.000Z");
  assert.equal(updated.id, "brand-1");
  assert.equal(updated.firstDetectedAt, "2026-10-01T00:00:00.000Z");
  assert.equal(updated.imageUrl, "https://example.com/image.jpg");
  assert.equal(updated.retailer, "공식몰");
  assert.equal(updated.description, "새 설명");
});
