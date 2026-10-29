import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {catalogQuality} from "./lib/catalog-quality.ts";
import {catalogQualitySummary} from "./lib/catalog-quality-summary.ts";

const now=new Date("2026-10-28T03:00:00Z");
const date=now.toISOString();
const product={id:"1",brand:"A",sourceUrl:"https://official.example.com/menu",sourceType:"official_site",imageUrl:"https://official.example.com/a.png",subCategory:"음료",
 isActive:true,reviewStatus:"approved",reviewEvidence:{explicitNew:true},firstDetectedAt:date,lastCheckedAt:date,createdAt:date,updatedAt:date};
const health=(rows,generatedAt=date)=>({version:1,generatedAt,rows});
const row=(brand,status="success",checkedAt=date)=>({brand,status,checkedAt});

test("같은 상품의 여러 보완 사유를 합계 상품 수에 중복 집계하지 않는다",()=>{
 const p={...product,lastCheckedAt:"2026-10-25",imageUrl:undefined,subCategory:" "};
 const report=catalogQualitySummary([p],health([row("A")]),now);
 assert.equal(report.summary.affectedPublicProducts,1);
 assert.deepEqual(report.summary.issueCounts,{missing_image:1,missing_subcategory:1,stale_check:1});
 assert.deepEqual(report.summary.brands[0].actions,["recheck_products","map_images","map_categories"]);
});

test("최신 기록의 실패는 우선 조치하고 과거 스냅샷의 실패는 현재 장애로 단정하지 않는다",()=>{
 const current=catalogQualitySummary([product],health([row("A","failed")]),now).summary.brands[0];
 assert.equal(current.priority,1);assert.equal(current.collection.evidence,"current");
 assert.deepEqual(current.actions,["inspect_collector"]);
 const stale=catalogQualitySummary([product],health([row("A","failed")],"2026-10-24"),now).summary.brands[0];
 assert.equal(stale.collection.evidence,"stale");
 assert.deepEqual(stale.actions,["refresh_snapshot"]);
 assert.equal(stale.priority,2);
});

test("브랜드별 오래된 시각과 누락·미래·알 수 없는 상태를 최신 정상으로 표시하지 않는다",()=>{
 for(const checkedAt of ["2026-10-24",undefined,"invalid","2026-10-29"]){
  const report=catalogQualitySummary([product],health([{brand:"A",status:"failed",checkedAt}]),now);
  const result=report.summary.brands[0];
  assert.ok(result.actions.includes("refresh_snapshot"));
  assert.ok(!result.actions.includes("inspect_collector"));
 }
 for(const snapshot of [undefined,{},health([], "2026-10-29"),health([row("A","SECRET")])]){
  const result=catalogQualitySummary([product],snapshot,now);
  assert.ok(result.summary.brands[0].actions.includes("refresh_snapshot"));
  assert.ok(!JSON.stringify(result).includes("SECRET"));
 }
});

test("복수 경로 중 일부 실패를 숨기지 않고 오래된 경로가 섞이면 기록 갱신을 먼저 요구한다",()=>{
 const current=catalogQualitySummary([product],health([row("A"),row("A","partial")]),now).summary.brands[0];
 assert.deepEqual(current.collection.statuses,["partial","success"]);
 assert.ok(current.actions.includes("inspect_collector"));
 const old=catalogQualitySummary([product],health([row("A"),row("A","failed","2026-10-24")]),now).summary.brands[0];
 assert.equal(old.collection.evidence,"stale");
 assert.deepEqual(old.actions,["refresh_snapshot"]);
});

test("비공개 상품을 공개 보완 건수에 섞지 않고 공개 상품 없는 실패 브랜드도 진단한다",()=>{
 const report=catalogQualitySummary([{...product,reviewStatus:"pending",imageUrl:undefined}],health([row("A"),row("B","failed")]),now);
 assert.equal(report.published,0);assert.equal(report.gaps.length,0);
 assert.deepEqual(report.summary.brands.map(b=>b.brand),["B"]);
 assert.equal(report.summary.brands[0].published,0);
 assert.deepEqual(report.summary.brands[0].actions,["inspect_collector"]);
});

test("오류·현재 실패·재확인·누락 순으로 정렬하고 정상 브랜드는 조치 목록에서 제외한다",()=>{
 const products=[
  {...product,id:"a",brand:"오류",price:100},
  {...product,id:"b",brand:"실패"},
  {...product,id:"c",brand:"오래됨",lastCheckedAt:"2026-10-24"},
  {...product,id:"d",brand:"이미지",imageUrl:undefined},
  {...product,id:"e",brand:"정상"},
 ];
 const before=JSON.stringify(products);
 const report=catalogQualitySummary(products,health(products.map(p=>row(p.brand,p.brand==="실패"?"failed":"success"))),now);
 assert.deepEqual(report.summary.brands.map(b=>b.brand),["오류","실패","오래됨","이미지"]);
 assert.deepEqual(report.summary.errorCounts,{price_field:1});
 assert.equal(JSON.stringify(products),before);
});

test("36시간 경계와 미래·잘못된 상품 시각을 구분한다",()=>{
 const boundary=new Date(now.getTime()-36*3600000).toISOString();
 assert.equal(catalogQuality([{...product,lastCheckedAt:boundary}],now).gaps.length,0);
 assert.deepEqual(catalogQuality([{...product,lastCheckedAt:new Date(Date.parse(boundary)-1).toISOString()}],now).gaps[0].issues,["stale_check"]);
 const invalid=catalogQuality([{...product,lastCheckedAt:"2026-10-29",createdAt:"invalid"}],now);
 assert.ok(invalid.errors.some(e=>e.code==="future_lastCheckedAt"&&e.brand==="A"));
 assert.ok(invalid.errors.some(e=>e.code==="invalid_createdAt"));
 assert.throws(()=>catalogQuality([],new Date("invalid")));
});

test("--check --details는 보고서를 저장하지 않고 잘못된 인자를 거부한다",()=>{
 const cwd=fileURLToPath(new URL("../",import.meta.url));
 const reportUrl=new URL("../docs/catalog-quality-current.json",import.meta.url);
 const read=()=>{try{return readFileSync(reportUrl,"utf8");}catch(error){if(error.code==="ENOENT")return null;throw error;}};
 const before=read();
 const result=spawnSync(process.execPath,["--experimental-strip-types","scripts/check-catalog-quality.ts","--check","--details"],{cwd,encoding:"utf8"});
 assert.equal(result.status,0,result.stderr);
 const output=result.stdout.trim().split("\n").map(line=>JSON.parse(line));
 assert.equal(typeof output[0].attentionBrands,"number");
 assert.equal(output.length,output[0].attentionBrands+1);
 assert.equal(read(),before);
 const bad=spawnSync(process.execPath,["--experimental-strip-types","scripts/check-catalog-quality.ts","--typo"],{cwd,encoding:"utf8"});
 assert.notEqual(bad.status,0);assert.equal(read(),before);
});
