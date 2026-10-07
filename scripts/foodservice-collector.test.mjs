import assert from "node:assert/strict";
import test from "node:test";
import { extractDominosNewProducts, extractGoobneNewProducts, extractLotteriaNewProducts } from "./lib/foodservice-collector.ts";

const checkedAt = "2026-10-07T00:00:00.000Z";

test("롯데리아 공식 메뉴에서 NEW 배지가 있는 상품만 추출하고 중복을 제거한다", () => {
  const card = `<li><img src="https://img.lotteeatz.com/new.png" class="mn-card-img"><div class="mn-card-body" id="REP_1"><span class="mn-badge" aria-label="신메뉴">NEW</span><p class="mn-card-name">새 버거</p></div></li>`;
  const old = `<li><div class="mn-card-body" id="REP_2"><p class="mn-card-name">기존 버거</p></div></li>`;
  const products = extractLotteriaNewProducts(card + card + old, checkedAt);
  assert.equal(products.length, 1);
  assert.equal(products[0].category, "burger");
  assert.equal(products[0].name, "새 버거");
  assert.equal(products[0].price, null);
});

test("도미노피자 공식 메뉴에서 NEW 라벨과 상품 코드를 추출한다", () => {
  const html = `<li><a href="detail?code_01=RPZ1"><img data-src="https://cdn.dominos.co.kr/new.jpg"></a><div class="prd-cont"><div class="subject">새 피자<div class="label-box"><span class="label sale">NEW</span></div></div></div></li><li><a href="detail?code_01=RPZ2"></a><div class="prd-cont"><div class="subject">기존 피자<div class="label-box"></div></div></div></li>`;
  const products = extractDominosNewProducts(html, checkedAt);
  assert.equal(products.length, 1);
  assert.equal(products[0].category, "pizza");
  assert.equal(products[0].name, "새 피자");
  assert.equal(products[0].imageUrl, "https://cdn.dominos.co.kr/new.jpg");
});

test("굽네 공식 신제품 영역에서 NEW 상품을 상품군과 함께 추출한다", () => {
  const html = `<div class="swiper-slide"><img src="https://cdn.goob-ne.com/chicken.png"><div class="slide-info"><span>NEW</span><h2>새 치킨</h2><button onclick="menu_view(&quot;501&quot;)">제품상세보기</button></div></div><div class="swiper-slide"><div class="slide-info"><span>NEW</span><h2>[Event] 새 치킨</h2><button onclick="menu_view(&quot;502&quot;)">제품상세보기</button></div></div><div class="swiper-slide"><div class="slide-info"><span>NEW</span><h2>새 피자</h2><button onclick="menu_view(&quot;503&quot;)">제품상세보기</button></div></div>`;
  const products = extractGoobneNewProducts(html, checkedAt);
  assert.equal(products.length, 2);
  assert.equal(products[0].category, "chicken");
  assert.equal(products[0].subCategory, "치킨");
  assert.equal(products[0].name, "새 치킨");
  assert.equal(products[1].category, "pizza");
});
