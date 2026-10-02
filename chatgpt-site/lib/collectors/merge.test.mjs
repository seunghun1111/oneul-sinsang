import assert from "node:assert/strict";
import test from "node:test";
import { changesForExisting } from "./merge.ts";

test("a corrected gift-set classification updates an existing product", () => {
  const existing = { imageUrl: null, announcedDate: "2026-08-31", category: "ramen", emoji: "🍜", description: "기존 설명" };
  const candidate = { imageUrl: null, announcedDate: "2026-08-31", category: "etc", emoji: "🎁" };
  assert.deepEqual(changesForExisting(existing, candidate), { category: "etc", emoji: "🎁" });
});

test("a missing image or announcement date does not erase stored details", () => {
  const existing = { imageUrl: "https://example.com/photo.jpg", announcedDate: "2026-08-31", category: "drink", emoji: "🥤", description: "공식 설명" };
  const candidate = { imageUrl: null, announcedDate: null, category: "drink", emoji: "🥤" };
  assert.deepEqual(changesForExisting(existing, candidate), {});
});

test("a refined description from the same official source replaces stale copy", () => {
  const existing = { imageUrl: null, announcedDate: "2026-08-31", category: "drink", emoji: "🥤", description: "짧은 설명" };
  const candidate = { description: "공식 기사에서 보강한 설명" };
  assert.deepEqual(changesForExisting(existing, candidate), { description: "공식 기사에서 보강한 설명" });
});
