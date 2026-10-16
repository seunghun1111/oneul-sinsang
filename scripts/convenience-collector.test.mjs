import assert from "node:assert/strict";
import test from "node:test";
import { extractEmart24NewProducts, extractSevenElevenNewProducts } from "./lib/convenience-collector.ts";
import {htmlAttribute} from "./lib/html-image.ts";

test("이미지 속성 순서에 관계없이 기본 이미지를 제외하고 data-src를 src로 오인하지 않는다",()=>{
 assert.equal(htmlAttribute(`<img data-src="fake.jpg" src="real.jpg">`,"src"),"real.jpg");
 const make=image=>`<ul class="tag_list_01"><li class="ico_tag_03">신상품</li></ul><a href="javascript: fncGoView('1');">${image}</a><div class="name">상품</div>`;
 assert.equal(extractSevenElevenNewProducts(make(`<img alt="상품" src="/upload/product/a.jpg">`),"2026-10-16")[0].imageUrl,"https://www.7-eleven.co.kr/upload/product/a.jpg");
 for(const image of [`<img alt="디폴트 이미지" src="/front/img/product/product_list_01.jpg">`,`<img src="/front/img/product/product_list_01.jpg" alt="디폴트 이미지">`])assert.equal(extractSevenElevenNewProducts(make(image),"2026-10-16")[0].imageUrl,null);
});

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
