import test from "node:test";
import assert from "node:assert/strict";
import {includeInDiscoverySummary} from "../src/lib/product-window.ts";
test("이번 주에는 초기 수집을 포함하고 한국 시간 월요일부터 제외한다",()=>{
 const initial={detectionKind:"initial"};
 assert.equal(includeInDiscoverySummary(initial,new Date("2026-10-18T14:59:59Z")),true);
 assert.equal(includeInDiscoverySummary(initial,new Date("2026-10-18T15:00:00Z")),false);
 assert.equal(includeInDiscoverySummary({detectionKind:"newly_detected"},new Date("2026-10-18T15:00:00Z")),true);
});
