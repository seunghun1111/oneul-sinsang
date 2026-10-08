import assert from "node:assert/strict";
import test from "node:test";
import { categoryGroups, getCategoryGroupForCategory, getCategoryGroupForProducts } from "../src/lib/category-groups.ts";

test("상단 메뉴는 모든 상품 대분류를 중복 없이 포함한다", () => {
  const categories = categoryGroups.flatMap(group => group.categories);
  assert.equal(new Set(categories).size, categories.length);
  for (const category of ["convenience", "cafe", "burger", "pizza", "chicken", "ramen", "meal", "snack", "drink", "dessert", "icecream", "etc"]) {
    assert.ok(getCategoryGroupForCategory(category));
  }
});

test("상단 메뉴 주소는 서로 중복되지 않는다", () => {
  assert.equal(new Set(categoryGroups.map(group => group.slug)).size, categoryGroups.length);
});

test("요약 상품군은 가장 많은 상품이 속한 상단 카테고리로 연결한다", () => {
  const products = [
    { category: "convenience" },
    { category: "convenience" },
    { category: "cafe" },
  ];
  assert.equal(getCategoryGroupForProducts(products).slug, "convenience");
  assert.equal(getCategoryGroupForProducts([]), undefined);
});
