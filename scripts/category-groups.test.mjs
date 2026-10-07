import assert from "node:assert/strict";
import test from "node:test";
import { categoryGroups, getCategoryGroupForCategory } from "../src/lib/category-groups.ts";

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
