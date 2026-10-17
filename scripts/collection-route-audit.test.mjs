import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {coffeeBrandSources} from "../src/data/coffee-sources.ts";
test("경로 진단은 정책을 먼저 확인하고 POST를 GET 오류로 판정하지 않는다",()=>{
 const route=readFileSync(new URL("./check-collection-routes.ts",import.meta.url),"utf8");
 assert.ok(route.indexOf('check:"policy_hold"')<route.indexOf("await collectionFetch"));
 assert.ok(route.includes('row.method!=="GET"'));
 assert.ok(route.includes('check:"collector_method_required"'));
 assert.ok(route.includes("response.body?.cancel()"));
 assert.ok(route.includes("3600000"));
});
test("확인된 커피빈 이동 목적지를 사용하고 컴포즈의 폐기된 MD를 요청하지 않는다",()=>{
 const bean=coffeeBrandSources.find(s=>s.id==="coffeebean");
 assert.equal(new URL(bean.channels.find(c=>c.kind==="menu").url).searchParams.get("category"),"13");
 assert.ok(!coffeeBrandSources.find(s=>s.id==="compose").channels.some(c=>c.url.includes("98609")));
});
