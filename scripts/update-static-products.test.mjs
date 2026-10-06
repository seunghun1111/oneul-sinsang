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

test("재수집 시 최초 발견일은 보존하고 외부 이미지와 원문 설명은 제거한다", () => {
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
  assert.equal("imageUrl" in updated, false);
  assert.equal(updated.retailer, "공식몰");
  assert.equal(updated.description, "브랜드 공식 발표에서 확인된 새 상품 신상품");
});

test("CU 공식 목록의 NEW 상품은 공식 상품군과 출처 설명을 보존한다", () => {
  const [product] = mergeProducts([], [{
    slug: "cu-28433", brand: "CU", name: "새 샌드위치", normalizedName: "새샌드위치", category: "convenience",
    subCategory: "간편식사", productType: "new", price: null, retailer: "CU", releaseDate: null,
    announcedDate: "2026-10-06", description: "CU 공식 전체상품의 간편식사 최신등록순에서 NEW 배지가 확인된 상품",
    sourceUrl: "https://cu.bgfretail.com/product/view.do?category=product&gdIdx=28433", sourceType: "official_site", imageUrl: "https://cdn.example.com/product.jpg",
  }], "2026-10-06T00:00:00.000Z");
  assert.equal(product.subCategory, "간편식사");
  assert.equal(product.sourceType, "official_site");
  assert.match(product.description ?? "", /NEW 배지/);
  assert.equal(product.imageUrl, "https://cdn.example.com/product.jpg");
  assert.equal("price" in product, false);
});

test("CU는 상품명이 같아도 공식 상품 ID가 다르면 별도 상품으로 보존한다", () => {
  const base = {
    brand: "CU", name: "동일 상품명", normalizedName: "동일상품명", category: "convenience", subCategory: "식품",
    productType: "new", price: null, retailer: "CU", releaseDate: null, announcedDate: "2026-10-06",
    description: "CU 공식 목록 NEW 배지", sourceType: "official_site", imageUrl: null,
  };
  const products = mergeProducts([], [
    { ...base, slug: "cu-1", sourceUrl: "https://cu.bgfretail.com/product/view.do?gdIdx=1" },
    { ...base, slug: "cu-2", sourceUrl: "https://cu.bgfretail.com/product/view.do?gdIdx=2" },
  ], "2026-10-06T00:00:00.000Z");
  assert.deepEqual(products.map(product => product.id).toSorted(), ["cu-1", "cu-2"]);
});
