import test from "node:test";
import assert from "node:assert/strict";
import {catalogQuality} from "./lib/catalog-quality.ts";
const p={id:"1",brand:"CU",name:"제품",sourceUrl:"https://cu.bgfretail.com/a",sourceType:"official_site",isActive:true,reviewEvidence:{explicitNew:true},firstDetectedAt:"2026-10-16",lastCheckedAt:"2026-10-16",createdAt:"2026-10-16",updatedAt:"2026-10-16"};
test("데이터 오류와 공개 상품의 보완 필요를 구분한다",()=>{
 const r=catalogQuality([p],new Date("2026-10-17"));assert.equal(r.errors.length,0);assert.equal(r.gaps.length,1);
 assert.equal(catalogQuality([{...p,reviewStatus:"pending"}]).gaps.length,0);
 const invalid=catalogQuality([p,{...p,price:0,lastCheckedAt:"bad",sourceUrl:"https://kakao.com"}]);
 for(const code of ["duplicate_or_missing_id","price_field","invalid_lastCheckedAt","unsafe_public_source"])assert.ok(invalid.errors.some(e=>e.code===code));
});
