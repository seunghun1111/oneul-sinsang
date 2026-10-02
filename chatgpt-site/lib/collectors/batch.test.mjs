import assert from "node:assert/strict";
import test from "node:test";
import { requireCandidates, runCollectorBatch } from "./batch.ts";

test("empty candidates are rejected before a save can report success", () => {
  assert.throws(() => requireCandidates([]), /수집 후보가 없습니다/);
  assert.deepEqual(requireCandidates(["product"]), ["product"]);
});

test("one failed source does not prevent a later source from saving", async () => {
  const saved = [];
  const failed = [];
  const result = await runCollectorBatch([
    { name: "first", collect: async () => { throw new Error("unavailable"); } },
    { name: "second", collect: async () => ["product"] },
  ], async candidates => {
    saved.push(...candidates);
    return { checked: candidates.length, created: 1, updated: 0, updatedImages: 0, updatedDates: 0, duplicates: 0 };
  }, (source) => failed.push(source));

  assert.deepEqual(saved, ["product"]);
  assert.deepEqual(failed, ["first"]);
  assert.deepEqual(result, {
    succeeded: 1,
    failed: 1,
    results: [
      { source: "first", status: "failed" },
      { source: "second", status: "ok", checked: 1, created: 1, updated: 0, updatedImages: 0, updatedDates: 0, duplicates: 0 },
    ],
  });
});

test("a save failure does not prevent the next source from running", async () => {
  const collected = [];
  const result = await runCollectorBatch([
    { name: "first", collect: async () => { collected.push("first"); return ["a"]; } },
    { name: "second", collect: async () => { collected.push("second"); return ["b"]; } },
  ], async candidates => {
    if (candidates[0] === "a") throw new Error("database unavailable");
    return { checked: 1, created: 0, updated: 0, updatedImages: 0, updatedDates: 0, duplicates: 1 };
  }, () => {});

  assert.deepEqual(collected, ["first", "second"]);
  assert.equal(result.succeeded, 1);
  assert.equal(result.results[1].duplicates, 1);
});

test("all failures are reported without exposing exception details", async () => {
  const result = await runCollectorBatch([
    { name: "first", collect: async () => { throw new Error("private detail"); } },
  ], async () => { throw new Error("save should not run"); }, () => {});

  assert.deepEqual(result, { succeeded: 0, failed: 1, results: [{ source: "first", status: "failed" }] });
  assert.ok(!JSON.stringify(result).includes("private detail"));
});

test("an empty source is reported as failed and never saved", async () => {
  let saveCalled = false;
  const failed = [];
  const result = await runCollectorBatch([
    { name: "empty", collect: async () => [] },
  ], async () => { saveCalled = true; throw new Error("save should not run"); }, source => failed.push(source));

  assert.equal(saveCalled, false);
  assert.deepEqual(failed, ["empty"]);
  assert.deepEqual(result, { succeeded: 0, failed: 1, results: [{ source: "empty", status: "failed" }] });
});

test("sources collect concurrently while database saves remain sequential", async () => {
  const events = [];
  let releaseFirst;
  let releaseSecond;
  let firstSaved;
  const first = new Promise(resolve => { releaseFirst = resolve; });
  const second = new Promise(resolve => { releaseSecond = resolve; });
  const firstSave = new Promise(resolve => { firstSaved = resolve; });
  const batch = runCollectorBatch([
    { name: "first", collect: () => { events.push("collect:first"); return first; } },
    { name: "second", collect: () => { events.push("collect:second"); return second; } },
  ], async candidates => {
    events.push(`save:${candidates[0]}`);
    if (candidates[0] === "first") firstSaved();
    return { checked: 1, created: 1, updated: 0, updatedImages: 0, updatedDates: 0, duplicates: 0 };
  }, () => {});

  await Promise.resolve();
  assert.deepEqual(events, ["collect:first", "collect:second"]);
  releaseFirst(["first"]);
  await firstSave;
  assert.deepEqual(events, ["collect:first", "collect:second", "save:first"]);
  releaseSecond(["second"]);
  const result = await batch;
  assert.deepEqual(events, ["collect:first", "collect:second", "save:first", "save:second"]);
  assert.equal(result.succeeded, 2);
});
