import assert from "node:assert/strict";
import test from "node:test";
import { parseReviewRequest, applyReviewBatch } from "./review-batch.ts";
const coffee = [{id:"coffee-test",reviewStatus:"pending"}];
const catalog = [{id:"chicken-test"}];
test("일괄 요청과 기존 단건 요청을 파싱한다",()=>{
  assert.deepEqual(parseReviewRequest("[상품 승인] coffee-test"),{decision:"approved",productIds:["coffee-test"]});
  assert.deepEqual(parseReviewRequest("[상품 일괄 거절] 2개",'```json\n{"productIds":["coffee-test","chicken-test"]}\n```'),{decision:"rejected",productIds:["coffee-test","chicken-test"]});
});
test("악성 ID, 건수 불일치, 초과 요청은 거부한다",()=>{
  for(const ids of [["../unsafe"],[],Array.from({length:51},(_,i)=>"product-"+i)]) assert.throws(()=>parseReviewRequest("[상품 일괄 승인] 1개","```json\n"+JSON.stringify({productIds:ids})+"\n```"));
  assert.throws(()=>parseReviewRequest("[상품 일괄 승인] 2개",'```json\n{"productIds":["coffee-test"]}\n```'));
});
test("전체 ID 검증 후 반영하며 같은 결정을 재요청하면 기록을 변경하지 않는다",()=>{
  const initial = applyReviewBatch(catalog,coffee,{},["coffee-test","chicken-test"],"rejected","2026-10-15");
  assert.equal(initial.changed,2);
  const repeated=applyReviewBatch(catalog,initial.coffee,initial.decisions,["coffee-test","chicken-test"],"rejected","2026-10-16");
  assert.equal(repeated.changed,0); assert.equal(repeated.skipped,2);
  assert.deepEqual(repeated.decisions,initial.decisions);
  assert.throws(()=>applyReviewBatch(catalog,coffee,{},["coffee-test","missing-test"],"approved","2026-10-15"));
  assert.equal(coffee[0].reviewStatus,"pending");
});
