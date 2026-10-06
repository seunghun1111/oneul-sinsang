import assert from "node:assert/strict";
import test from "node:test";
import { CU_CATEGORIES, collectCu, extractCuNewProducts } from "./lib/cu-collector.ts";

const listHtml = `
  <li class="prod_list"><div class="prod_item">
    <div class="prod_img" onclick="view(28433);"><img src="//cdn.example.com/product.jpg" /></div>
    <div class="name" onclick="view(28433);"><p>샌)대만식땅콩크림샌드1</p></div>
    <div class="tag"><span class="new"><img alt="New" /></span></div>
  </div></li>
  <li class="prod_list"><div class="prod_item">
    <div class="prod_img" onclick="view(100);"></div>
    <div class="name"><p>기존 상품</p></div><div class="tag"></div>
  </div></li>`;

test("CU 목록에서 NEW 배지가 있는 상품만 공식 카테고리와 함께 추출한다", () => {
  const [product] = extractCuNewProducts(listHtml, CU_CATEGORIES[0], "2026-10-06T00:00:00.000Z");
  assert.equal(product.slug, "cu-28433");
  assert.equal(product.name, "샌)대만식땅콩크림샌드1");
  assert.equal(product.category, "convenience");
  assert.equal(product.subCategory, "간편식사");
  assert.equal(product.sourceType, "official_site");
  assert.equal(product.imageUrl, "https://cdn.example.com/product.jpg");
  assert.equal(product.price, null);
});

test("CU 수집 요청은 7개 공식 카테고리와 최신등록순 조건을 사용한다", async () => {
  const requests = [];
  const products = await collectCu("2026-10-06T00:00:00.000Z", async (_url, init) => {
    requests.push(String(init?.body));
    return new Response(listHtml, { status: 200 });
  });
  assert.equal(requests.length, 7);
  assert.ok(requests.every(body => body.includes("searchCondition=setC")));
  assert.deepEqual(requests.map(body => new URLSearchParams(body).get("searchMainCategory")), ["10", "20", "30", "40", "50", "60", "70"]);
  assert.equal(products.length, 1);
});
