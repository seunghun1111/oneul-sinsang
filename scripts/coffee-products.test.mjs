import assert from "node:assert/strict";
import test from "node:test";
import { coffeeProducts } from "../src/data/coffee-products.ts";
import { coffeeBrandSources } from "../src/data/coffee-sources.ts";

test("커피 카테고리에 메뉴와 MD가 함께 포함된다", () => {
  assert.ok(coffeeProducts.length >= 10);
  assert.ok(coffeeProducts.some(product => product.subCategory === "음료"));
  assert.ok(coffeeProducts.some(product => product.subCategory?.includes("MD")));
});

test("커피 신상은 공식 출처만 사용한다", () => {
  assert.ok(coffeeProducts.every(product => product.sourceType === "official_site"));
  assert.ok(coffeeProducts.every(product => !/(^|\.)kakao\.com$|(^|\.)daum\.net$/.test(new URL(product.sourceUrl).hostname)));
});

test("커피 수집 대상은 주요 브랜드의 메뉴와 MD 경로를 폭넓게 포함한다", () => {
  assert.ok(coffeeBrandSources.length >= 22);
  assert.ok(coffeeBrandSources.every(source => source.channels.some(channel => channel.kind === "menu" || channel.kind === "shop")));
  assert.ok(coffeeBrandSources.some(source => source.brand === "스타벅스" && source.channels.some(channel => channel.kind === "md")));
  assert.ok(coffeeBrandSources.some(source => source.brand === "공차" && source.channels.some(channel => channel.kind === "md")));
  for (const brand of ["스타벅스", "우지커피", "빽다방", "텐퍼센트커피", "바나프레소", "투썸플레이스", "아티제", "매머드커피", "공차"]) {
    assert.ok(coffeeBrandSources.some(source => source.brand === brand), `${brand} 공식 수집 경로가 필요합니다.`);
  }
});

test("커피 수집 경로는 허용된 공개 공식 도메인만 사용한다", () => {
  const links = coffeeBrandSources.flatMap(source => source.channels);
  assert.ok(links.every(link => link.url.startsWith("https://")));
  assert.ok(links.every(link => !/(^|\.)kakao\.com$|(^|\.)daum\.net$/.test(new URL(link.url).hostname)));
});

test("공식 메뉴와 MD 판매 경로만 관리한다", () => {
  assert.ok(coffeeBrandSources.some(source => source.channels.some(channel => channel.kind === "shop")));
  assert.ok(coffeeBrandSources.every(source => !("priceAccess" in source) && !("priceNote" in source)));
  assert.ok(coffeeBrandSources.flatMap(source => source.channels).every(channel => !("providesPrice" in channel) && !("priceScope" in channel)));
});

test("가격 데이터는 공개 목록에 저장하지 않는다", () => {
  assert.ok(coffeeProducts.every(product => product.price == null));
});

test("기본 목록에는 최근 판매가 확인된 신상만 포함한다", () => {
  const currentCoffee = coffeeProducts.filter(product => product.availabilityStatus === "on_sale");
  assert.ok(currentCoffee.length > 0);
  assert.ok(currentCoffee.every(product => product.availabilityCheckedAt));
  assert.ok(!currentCoffee.some(product => ["coffeebean-ribbon-garden-tumbler-2026", "paik-chunbae-collaboration-2026"].includes(product.id)));
});
