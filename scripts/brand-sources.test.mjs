import assert from "node:assert/strict";
import test from "node:test";
import { chickenBrandSources, icecreamBrandSources } from "../src/data/food-brand-sources.ts";

test("주요 치킨 브랜드 공식 수집 경로를 포함한다", () => {
  for (const brand of ["굽네", "교촌치킨", "KFC", "맘스터치", "bhc", "BBQ", "푸라닭", "네네치킨"]) {
    assert.ok(chickenBrandSources.some(source => source.brand === brand));
  }
});

test("주요 아이스크림 브랜드 공식 수집 경로를 포함한다", () => {
  for (const brand of ["배스킨라빈스", "빙그레", "나뚜루", "하겐다즈", "롯데웰푸드"]) {
    assert.ok(icecreamBrandSources.some(source => source.brand === brand));
  }
  assert.ok([...chickenBrandSources, ...icecreamBrandSources].every(source => source.url.startsWith("https://")));
});
