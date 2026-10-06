import assert from "node:assert/strict";
import test from "node:test";
import { extractOfficialProductNames, toCoffeeCandidates } from "./lib/coffee-collector.ts";
import { mergeCoffeeProducts } from "./update-coffee-products.ts";

const source = { id:"sample", brand:"샘플커피", note:"", channels:[] };

test("공식 구조화 데이터와 NEW 표시에서 상품명만 추출한다", () => {
  const html = `<script type="application/ld+json">{"@type":"Product","name":"가을 라떼"}</script><article><span>NEW</span><strong>별빛 텀블러</strong></article>`;
  assert.deepEqual(extractOfficialProductNames(html), ["가을 라떼", "별빛 텀블러"]);
});

test("브랜드 공식 신메뉴 영역 밖의 오래된 상품은 수집하지 않는다", () => {
  const html = `<div class="menu_slider new_menu_slider"><p class="best_tit">새 라떼</p></div><!-- 고메 --><p class="best_tit">오래된 라떼</p>`;
  assert.deepEqual(extractOfficialProductNames(html, "https://paikdabang.com/menu/menu_new/", "2026-10-06T00:00:00.000Z"), ["새 라떼"]);
});

test("가격과 이미지를 저장하지 않는 커피 상품으로 변환한다", () => {
  const [candidate] = toCoffeeCandidates(source, "md", "https://example.com/md", ["별빛 텀블러"], "2026-10-06T00:00:00.000Z");
  assert.equal(candidate.subCategory, "MD");
  assert.equal(candidate.availabilityStatus, "on_sale");
  assert.equal("price" in candidate, false);
  assert.equal("imageUrl" in candidate, false);
});

test("재수집 시 최초 발견일을 보존한다", () => {
  const checkedAt = "2026-10-06T00:00:00.000Z";
  const [candidate] = toCoffeeCandidates(source, "menu", "https://example.com/menu", ["가을 라떼"], checkedAt);
  const previous = { ...candidate, firstDetectedAt:"2026-10-01T00:00:00.000Z", createdAt:"2026-10-01T00:00:00.000Z" };
  const [merged] = mergeCoffeeProducts([previous], [{ ...candidate, id:"changed" }], checkedAt);
  assert.equal(merged.id, previous.id);
  assert.equal(merged.firstDetectedAt, previous.firstDetectedAt);
  assert.equal(merged.reviewStatus, "pending");
});

test("승인된 상품은 재수집 후에도 승인 상태를 보존한다", () => {
  const checkedAt = "2026-10-06T00:00:00.000Z";
  const [candidate] = toCoffeeCandidates(source, "menu", "https://example.com/menu", ["가을 라떼"], checkedAt);
  const approved = { ...candidate, reviewStatus:"approved", reviewedAt:"2026-10-05T00:00:00.000Z" };
  const [merged] = mergeCoffeeProducts([approved], [candidate], checkedAt);
  assert.equal(merged.reviewStatus, "approved");
  assert.equal(merged.reviewedAt, approved.reviewedAt);
});

test("공식 목록에서 두 번 연속 사라진 상품만 판매 종료 처리한다", () => {
  const checkedAt = "2026-10-06T00:00:00.000Z";
  const [candidate] = toCoffeeCandidates(source, "menu", "https://example.com/menu", ["가을 라떼"], checkedAt);
  const [firstMiss] = mergeCoffeeProducts([candidate], [], checkedAt, new Set([candidate.sourceUrl]));
  assert.equal(firstMiss.availabilityStatus, "unknown");
  assert.equal(firstMiss.isActive, true);
  const [secondMiss] = mergeCoffeeProducts([firstMiss], [], "2026-10-07T00:00:00.000Z", new Set([candidate.sourceUrl]));
  assert.equal(secondMiss.availabilityStatus, "ended");
  assert.equal(secondMiss.isActive, false);
});
