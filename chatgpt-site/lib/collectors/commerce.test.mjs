import assert from "node:assert/strict";
import test from "node:test";
import { extractCommerce } from "./commerce.ts";

test("공식 원문의 숫자 가격과 판매처만 추출한다", () => {
  assert.deepEqual(
    extractCommerce("권장소비자가는 2,000원이며 CU와 GS25에서 판매한다."),
    { price: 2000, retailer: "CU · GS25" },
  );
});

test("한글 단위가 섞인 공식 가격을 원 단위로 변환한다", () => {
  assert.equal(extractCommerce("판매 가격은 한 세트 1만9천630원이다.").price, 19630);
});

test("가격이 없으면 판매처 정보만 반환한다", () => {
  assert.deepEqual(
    extractCommerce("구매는 매일유업 공식몰 매일다이렉트 외 다양한 온라인 커머스 사이트에서 가능하다."),
    { price: null, retailer: "매일다이렉트 · 주요 온라인몰" },
  );
});

test("가격과 판매처가 명시되지 않으면 추측하지 않는다", () => {
  assert.deepEqual(extractCommerce("신제품을 출시했다."), { price: null, retailer: null });
});
