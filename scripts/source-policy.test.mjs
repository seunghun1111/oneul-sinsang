import test from "node:test";
import assert from "node:assert/strict";
import {sourcePolicy,sourcePolicySummary,policyLabels} from "../src/lib/source-policy.ts";
const now=new Date("2026-10-17T01:00:00Z");
const report={checkedAt:"2026-10-17T00:00:00Z",results:[{brand:"브랜드",url:"https://a.example/menu",status:"allowed"},{brand:"브랜드",url:"https://a.example/shop",status:"blocked"},{brand:"브랜드",url:"https://a.example/other",status:"not_provided"}]};
test("정책 안내는 동일 브랜드라도 점검한 정확한 주소에만 적용한다",()=>{
 assert.equal(sourcePolicy(report,"브랜드","https://a.example/menu",now).state,"allowed");
 assert.equal(sourcePolicy(report,"브랜드","https://a.example/api",now).state,"unknown");
 assert.equal(sourcePolicy(report,"다른 브랜드","https://a.example/menu",now).state,"unknown");
 assert.equal(sourcePolicySummary(report,"브랜드",["https://a.example/menu","https://a.example/shop"],now),"partial");
});
test("오래된·미래 기록은 정상으로 보이지 않고 미제공을 허용으로 표시하지 않는다",()=>{
 assert.equal(sourcePolicy({...report,checkedAt:"2026-10-14"},"브랜드","https://a.example/menu",now).state,"stale");
 assert.equal(sourcePolicy({...report,checkedAt:"2026-10-18"},"브랜드","https://a.example/menu",now).state,"stale");
 assert.equal(sourcePolicy(report,"브랜드","https://a.example/other",now).state,"not_provided");
 assert.equal(policyLabels.allowed,"정책상 허용");
});
