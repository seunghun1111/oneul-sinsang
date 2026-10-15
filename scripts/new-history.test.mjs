import test from "node:test";
import assert from "node:assert/strict";
import {trackNewProducts} from "./lib/new-history.ts";
const p=(id,brand="네네치킨")=>({id,brand,normalizedName:id});
test("첫 수집은 초기 목록, 그 후 새 상품만 신규로 구분한다",()=>{
 const first=trackNewProducts([p("one")],{brands:{},seen:{}},"2026-10-15");
 assert.equal(first.products[0].detectionKind,"initial");
 const second=trackNewProducts([first.products[0],p("two"),p("three","새브랜드")],first.history,"2026-10-16");
 assert.deepEqual(second.products.map(p=>p.detectionKind),["initial","newly_detected","initial"]);
 assert.equal(trackNewProducts([p("one")],first.history,"2026-10-20").products[0].detectionKind,"initial");
});
