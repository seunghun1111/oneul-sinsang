import assert from "node:assert/strict";
import test from "node:test";
import { extractEmart24NewProducts, extractSevenElevenNewProducts } from "./lib/convenience-collector.ts";

test("세븐일레븐 공식 목록에서 신상품 배지가 있는 상품만 추출한다", () => {
  const html = `
    <ul class="tag_list_01"><li class="ico_tag_03">신상품</li></ul>
    <a href="javascript: fncGoView('061235');"><img src="/upload/product/new.jpg" alt="새 음료"></a>
    <div class="name">새 음료</div>
    <ul class="tag_list_01"><li class="ico_tag_01">PB</li></ul>
    <a href="javascript: fncGoView('061236');"><img src="/upload/product/old.jpg" alt="기존 음료"></a>
    <div class="name">기존 음료</div>`;

  const products = extractSevenElevenNewProducts(html, "2026-10-06T00:00:00.000Z");
  assert.equal(products.length, 1);
  assert.equal(products[0].name, "새 음료");
  assert.equal(products[0].price, null);
  assert.equal(products[0].imageUrl, "https://www.7-eleven.co.kr/upload/product/new.jpg");
});

test("이마트24는 화면에 활성화된 NEW 표시만 추출한다", () => {
  const html = `
    <div class="itemWrap"><span class="floatL">NEW</span><img src="https://msave.emart24.co.kr/1234567890123.JPG"><div class="itemtitle"><a>새 도시락</a></div></div>
    <div class="itemWrap"><span class="floatL" style="opacity: 0;">NEW</span><img src="https://msave.emart24.co.kr/9999999999999.JPG"><div class="itemtitle"><a>기존 도시락</a></div></div>`;

  const products = extractEmart24NewProducts(html, "2026-10-06T00:00:00.000Z", "Fresh Food", "https://emart24.co.kr/goods/ff");
  assert.equal(products.length, 1);
  assert.equal(products[0].name, "새 도시락");
  assert.equal(products[0].subCategory, "Fresh Food");
  assert.equal(products[0].price, null);
});
