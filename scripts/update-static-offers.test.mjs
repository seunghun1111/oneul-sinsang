import assert from "node:assert/strict";
import test from "node:test";
import { parseOfferHtml } from "./update-static-offers.ts";

const observedAt="2026-10-02T06:00:00.000Z";

test("올리브영 판매가와 재고 상태를 추출한다",()=>{
  const offer=parseOfferHtml({id:"olive",productSlug:"orion-1",retailer:"올리브영",title:"포카칩 황치즈맛 60g",url:"https://example.com",quantity:1,unit:"60g",parser:"oliveyoung"},"<h3>포카칩 황치즈맛 60g</h3><b>2,000 원</b><button>장바구니</button>",observedAt);
  assert.equal(offer.price,2000); assert.equal(offer.stockStatus,"in_stock");
});

test("컬리 정상가와 할인가를 분리한다",()=>{
  const offer=parseOfferHtml({id:"kurly",productSlug:"samyang-1",retailer:"컬리",title:"우지파개장 큰컵 115g",url:"https://example.com",quantity:1,unit:"115g",parser:"kurly"},"<h1>우지파개장 큰컵 115g</h1><span>10% 1,780원</span><b>1,600 원</b><button>장바구니 담기</button>",observedAt);
  assert.equal(offer.price,1600); assert.equal(offer.regularPrice,1780); assert.equal(offer.stockStatus,"in_stock");
});

test("컬리 구조화 데이터에서 최신 판매가를 추출한다",()=>{
  const html='<h1>우지파개장 큰컵 115g</h1><script>{"showablePrices":{"salesPrice":1510,"basePrice":1780,"retailPrice":null},"isPurchaseStatus":true}</script>';
  const offer=parseOfferHtml({id:"kurly",productSlug:"samyang-1",retailer:"컬리",title:"우지파개장 큰컵 115g",url:"https://example.com",quantity:1,unit:"115g",parser:"kurly"},html,observedAt);
  assert.equal(offer.price,1510); assert.equal(offer.regularPrice,1780); assert.equal(offer.stockStatus,"in_stock");
});

test("가격이 없으면 판매 중이라고 추측하지 않는다",()=>{
  assert.throws(()=>parseOfferHtml({id:"x",productSlug:"x",retailer:"몰",title:"상품",url:"https://example.com",quantity:1,unit:"개",parser:"oliveyoung"},"<h1>상품</h1><button>장바구니</button>",observedAt));
});
