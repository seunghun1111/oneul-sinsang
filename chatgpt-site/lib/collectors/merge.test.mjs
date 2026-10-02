import assert from "node:assert/strict";
import test from "node:test";
import { changesForExisting } from "./merge.ts";

test("a corrected gift-set classification updates an existing product", () => {
  const existing = { imageUrl: null, announcedDate: "2026-08-31", category: "ramen", emoji: "🍜", description: "기존 설명", price: null, retailer: null };
  const candidate = { imageUrl: null, announcedDate: "2026-08-31", category: "etc", emoji: "🎁" };
  assert.deepEqual(changesForExisting(existing, candidate), { category: "etc", emoji: "🎁" });
});

test("a missing image or announcement date does not erase stored details", () => {
  const existing = { imageUrl: "https://example.com/photo.jpg", announcedDate: "2026-08-31", category: "drink", emoji: "🥤", description: "공식 설명", price: 2000, retailer: "공식몰" };
  const candidate = { imageUrl: null, announcedDate: null, category: "drink", emoji: "🥤" };
  assert.deepEqual(changesForExisting(existing, candidate), {});
});

test("a refined description from the same official source replaces stale copy", () => {
  const existing = { imageUrl: null, announcedDate: "2026-08-31", category: "drink", emoji: "🥤", description: "짧은 설명", price: null, retailer: null };
  const candidate = { description: "공식 기사에서 보강한 설명" };
  assert.deepEqual(changesForExisting(existing, candidate), { description: "공식 기사에서 보강한 설명" });
});

test("공식 가격과 판매처가 새로 확인되면 기존 상품을 보강한다", () => {
  const existing = { imageUrl: null, announcedDate: "2026-08-31", category: "drink", emoji: "🥤", description: "설명", price: null, retailer: null };
  const candidate = { price: 2000, retailer: "CU · GS25" };
  assert.deepEqual(changesForExisting(existing, candidate), { price: 2000, retailer: "CU · GS25" });
});
