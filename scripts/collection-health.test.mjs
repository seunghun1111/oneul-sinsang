import test from "node:test";
import assert from "node:assert/strict";
import {buildCollectionHealth,isCollectionStale,needsCollectionAttention} from "../chatgpt-site/lib/review/collection-health.ts";
import {loadCollectionHealth} from "../chatgpt-site/lib/review/load-collection-health.ts";
import {collectionDiagnostics} from "../chatgpt-site/lib/review/collection-diagnostics.ts";
const groups=[{id:"coffee",label:"카페",brands:["A","B"]}];
const now=new Date("2026-10-16T01:00:00Z");
test("운영 현황은 그룹 보고 시각 대신 브랜드별 실제 확인 시각을 우선한다",()=>{
 const h=buildCollectionHealth(groups,{coffee:{checkedAt:now.toISOString(),results:[{brand:"A",status:"success",checkedAt:"2026-10-13"},{brand:"B",status:"success",checkedAt:"bad"}]}},undefined,now);
 assert.equal(h.rows[0].checkedAt,"2026-10-13");assert.equal(needsCollectionAttention(h.rows[0],now),true);
 assert.equal(h.rows[1].status,"not_checked");
});
test("운영 사유는 허용된 실패 코드만 번역하며 원문은 표시하지 않는다",()=>{
 const h=buildCollectionHealth(groups,{coffee:{checkedAt:now.toISOString(),results:[{brand:"A",status:"failed",failureCodes:["tls","SECRET"],failureCode:"policy_blocked"}]}},undefined,now);
 assert.match(h.rows[0].reason,/TLS 인증서 검증 실패/);assert.match(h.rows[0].reason,/robots 명시적 제한/);assert.ok(!JSON.stringify(h).includes("SECRET"));
});
test("실제 성공 기록만 마지막 정상 확인으로 저장하고 실패 후에도 유지한다",()=>{
 const success=buildCollectionHealth(groups,{coffee:{checkedAt:"2026-10-15T01:00:00Z",results:[{brand:"A",status:"success",newCount:0}]}},undefined,now);
 assert.equal(success.rows[0].lastSuccessfulAt,"2026-10-15T01:00:00Z");
 const failed=buildCollectionHealth(groups,{coffee:{checkedAt:now.toISOString(),results:[{brand:"A",status:"failed",newCount:0,reasonCode:"unexpected_empty"}]}},success,now);
 assert.equal(failed.rows[0].lastSuccessfulAt,success.rows[0].lastSuccessfulAt);
 assert.match(failed.rows[0].reason,/갑자기 0건/);
 assert.equal(needsCollectionAttention(failed.rows[0],now),true);
});
test("운영 기록 조회 실패·깨진 응답은 null로 격리한다",async()=>{
 assert.equal(await loadCollectionHealth(async()=>{throw Error("secret");}),null);
 assert.equal(await loadCollectionHealth(async()=>new Response("error",{status:503})),null);
 assert.equal(await loadCollectionHealth(async()=>Response.json({version:1,generatedAt:"",rows:[{status:"unknown"}]})),null);
 const valid=buildCollectionHealth(groups,{},undefined,now);
 assert.deepEqual(await loadCollectionHealth(async()=>Response.json(valid)),JSON.parse(JSON.stringify(valid)));
});
test("미수집·깨진 기록·미래 기록을 정상 또는 NEW 0건으로 위장하지 않는다",()=>{
 for(const report of [undefined,{}, {checkedAt:"bad",results:[]},{checkedAt:"2028-01-01",results:[{brand:"A",status:"success",newCount:1}]}]) {
  const row=buildCollectionHealth(groups,{coffee:report},undefined,now).rows[0];
  assert.equal(row.status,"not_checked");assert.equal(row.lastSuccessfulAt,undefined);assert.equal(row.newCount,undefined);
  assert.equal(needsCollectionAttention(row,now),true);
 }
 assert.equal(buildCollectionHealth(groups,{}, {rows:{}},now).rows[0].status,"not_checked");
});
test("오래된 정상 결과도 확인 필요로 표시하고 부분 성공을 완전 정상으로 기록하지 않는다",()=>{
 const health=buildCollectionHealth(groups,{coffee:{checkedAt:"2026-10-13",results:[{brand:"A",status:"success",newCount:2},{brand:"B",status:"partial",newCount:1}]}},undefined,now);
 assert.equal(isCollectionStale(health.rows[0],now),true);assert.equal(needsCollectionAttention(health.rows[0],now),true);
 assert.equal(health.rows[1].lastSuccessfulAt,undefined);
});
test("원문 오류·토큰·임의 출처는 운영 화면 데이터에 포함하지 않는다",()=>{
 const health=buildCollectionHealth(groups,{coffee:{checkedAt:now.toISOString(),results:[{brand:"A",status:"failed",note:"SECRET",sourceUrl:"https://invalid.test/?token=SECRET"}]}},undefined,now);
 assert.equal(JSON.stringify(health).includes("SECRET"),false);
 assert.equal(health.rows[1].status,"not_checked");
});
test("재시도·실패 단계·카테고리 보류를 생성하고 원문·임의 필드는 제거한다",async()=>{
 const report={checkedAt:now.toISOString(),results:[{brand:"A",status:"failed",attempts:2,initialFailureCode:"timeout",failureDetail:{stage:"product_request",httpStatus:503,url:"SECRET"},categories:[{label:"음료",pages:2,requests:3,newCount:1,complete:true,html:"SECRET"}],categoryIssues:[{label:"음료",reason:"sharp_drop",note:"SECRET"}]}]};
 const health=buildCollectionHealth(groups,{coffee:report},undefined,now),row=health.rows[0];
 assert.equal(row.diagnostics.attempts,2);assert.equal(row.diagnostics.failures[0].httpStatus,503);assert.equal(row.diagnostics.categories[0].holdReason,"sharp_drop");assert.match(row.reason,/카테고리/);
 const loaded=await loadCollectionHealth(async()=>Response.json({...health,token:"SECRET",rows:health.rows.map(r=>({...r,raw:"SECRET",diagnostics:{...r.diagnostics,token:"SECRET"}}))}));
 assert.ok(!JSON.stringify(loaded).includes("SECRET"));assert.equal(loaded.rows[0].diagnostics.attempts,2);
 assert.equal(collectionDiagnostics({attempts:99,failureDetail:{stage:"SECRET",httpStatus:999},categories:[{label:"SECRET",complete:true}]}),undefined);
});
test("정상 복구 후에도 최근 실패와 마지막 정상 시각을 각각 보존한다",()=>{
 const failed=buildCollectionHealth(groups,{coffee:{checkedAt:"2026-10-15T00:00:00Z",results:[{brand:"A",status:"failed"}]}},undefined,now);
 const restored=buildCollectionHealth(groups,{coffee:{checkedAt:now.toISOString(),results:[{brand:"A",status:"success"}]}},failed,now);
 assert.equal(restored.rows[0].lastFailedAt,"2026-10-15T00:00:00Z");assert.equal(restored.rows[0].lastSuccessfulAt,now.toISOString());
});
