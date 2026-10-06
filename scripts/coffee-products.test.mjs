import assert from "node:assert/strict";
import test from "node:test";
import { coffeeProducts } from "../src/data/coffee-products.ts";

test("커피 카테고리에 메뉴와 MD가 함께 포함된다", () => {
  assert.ok(coffeeProducts.length >= 10);
  assert.ok(coffeeProducts.some(product => product.subCategory === "음료"));
  assert.ok(coffeeProducts.some(product => product.subCategory?.includes("MD")));
});

test("커피 신상은 공식 출처만 사용한다", () => {
  assert.ok(coffeeProducts.every(product => product.sourceType === "official_site"));
  assert.ok(coffeeProducts.every(product => !/(^|\.)kakao\.com$|(^|\.)daum\.net$/.test(new URL(product.sourceUrl).hostname)));
});
