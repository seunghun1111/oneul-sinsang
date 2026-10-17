import test from "node:test";
import assert from "node:assert/strict";
import {productFreshness,PRODUCT_STALE_MS} from "../src/lib/product-freshness.ts";
import {collectionRemediation} from "./lib/collection-remediation.ts";
const now=Date.parse("2026-10-17T09:00:00Z"),date=new Date(now-3600000).toISOString();
const product={sourceUrl:"https://example.com/menu",reviewEvidence:{sourceUrl:"https://example.com/menu",checkedAt:date}};
test("브랜드 성공·시도·판매확인 시각을 상품 확인 근거로 대체하지 않는다",()=>{
 assert.equal(productFreshness({sourceUrl:product.sourceUrl,lastCheckedAt:date,availabilityCheckedAt:date},{status:"success",checkedAt:date},now).status,"unknown");
 assert.equal(productFreshness({...product,reviewEvidence:{sourceUrl:"https://other.example/menu",checkedAt:date}},undefined,now).status,"unknown");
});
test("유효한 상품별 관측만 표시하고 미래·깨진 시각은 거부한다",()=>{
 assert.equal(productFreshness(product,undefined,now).status,"recent");
 assert.equal(productFreshness({...product,lastSeenAt:"broken"},undefined,now).confirmedAt,date);
 assert.equal(productFreshness({sourceUrl:product.sourceUrl,lastSeenAt:new Date(now+1).toISOString()},undefined,now).status,"unknown");
 assert.equal(productFreshness({sourceUrl:product.sourceUrl,lastSeenAt:new Date(now-PRODUCT_STALE_MS-1).toISOString()},undefined,now).status,"recheck");
});
test("수집 실패·부분 실패·오래된 브랜드 상태는 기존 상품을 재확인으로 표시한다",()=>{
 for(const status of ["failed","partial","not_checked"]){assert.equal(productFreshness(product,{status,checkedAt:date},now).status,"recheck");}
 assert.equal(productFreshness(product,{status:"success",checkedAt:new Date(now-PRODUCT_STALE_MS-1).toISOString()},now).status,"recheck");
 assert.equal(productFreshness(product,{status:"success",checkedAt:date},now).confirmedAt,date);
 assert.equal(productFreshness(product,{status:"success",checkedAt:"broken"},now).status,"recheck");
 assert.equal(productFreshness(product,{status:"failed",checkedAt:new Date(now+1).toISOString()},now).status,"recheck");
 assert.equal(productFreshness({...product,consecutiveMisses:1},{status:"success",checkedAt:date},now).status,"recheck");
});
test("진단 분류는 정책·인증서 우회를 지시하지 않으며 빈 NEW를 성공으로 분류하지 않는다",()=>{
 for(const [codes,category] of [[["policy_blocked"],"policy_hold"],[["policy_unavailable"],"policy_recheck"],[["tls"],"certificate"],[["dns"],"route_recheck"],[["structure"],"parser_recheck"],[["timeout"],"transient"]])assert.equal(collectionRemediation(codes).category,category);
 assert.equal(collectionRemediation([],true).category,"parser_recheck");
 assert.equal(collectionRemediation([]).category,"checked");
});
