import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {catalogPageSize,discoveryKind,discoveryPeriod,millisecondsUntilSeoulMidnight} from "../src/lib/discovery-display.ts";
const p=(id,date,kind="newly_detected")=>({id,firstDetectedAt:date,detectionKind:kind});
test("발견 구분이 없으면 새로 발견으로 추정하지 않는다",()=>{
 assert.equal(discoveryKind("initial").label,"초기 수집");assert.equal(discoveryKind("newly_detected").label,"새로 발견");assert.equal(discoveryKind(undefined).label,"발견 기록");assert.match(discoveryKind("initial").description,/최근 출시를 뜻하지/);
});
test("목록은 48개 단위로 늘리고 전체 건수와 마지막 페이지를 구분한다",()=>{
 for(const [total,request,expected] of [[855,48,48],[855,96,96],[49,96,49],[0,48,0],[47,48,47],[48,48,48],[855,Infinity,48]])assert.equal(catalogPageSize(total,request),expected);
});
test("한국 시간 자정까지의 타이머는 UTC 날짜와 무관하다",()=>{
 assert.equal(millisecondsUntilSeoulMidnight(new Date("2026-10-17T14:59:59.000Z")),1000);
 assert.equal(millisecondsUntilSeoulMidnight(new Date("2026-10-17T15:00:00.000Z")),86400000);
});
test("일요일에서 월요일로 전환하면 주간 범위와 초기 수집 제외 기준이 바뀐다",()=>{
 const products=[p("old","2026-10-18T14:00:00Z"),p("new","2026-10-18T15:00:00Z"),p("initial","2026-10-18T15:00:00Z","initial")];
 assert.deepEqual(discoveryPeriod(products,"2026-10-18").week.map(p=>p.id),["old"]);
 const next=discoveryPeriod(products,"2026-10-19");assert.equal(next.dates[0],"2026-10-19");assert.deepEqual(next.week.map(p=>p.id),["new"]);assert.deepEqual(next.month.map(p=>p.id),["old","new"]);
});
test("월 경계·연도 경계를 넘겨도 미래 상품과 이전 달을 포함하지 않는다",()=>{
 const products=[p("oct","2026-10-31T14:59:59Z"),p("nov","2026-10-31T15:00:00Z"),p("jan","2026-12-31T15:00:00Z")];
 assert.deepEqual(discoveryPeriod(products,"2026-10-31").month.map(p=>p.id),["oct"]);
 assert.deepEqual(discoveryPeriod(products,"2026-11-01").month.map(p=>p.id),["nov"]);
 assert.deepEqual(discoveryPeriod(products,"2027-01-01").month.map(p=>p.id),["jan"]);
});
test("클라이언트 날짜는 자정·포커스 복귀 시 갱신되고 구독은 정리된다",()=>{
 const source=readFileSync(new URL("../src/components/home-discovery.tsx",import.meta.url),"utf8");
 for(const text of ["useSyncExternalStore","millisecondsUntilSeoulMidnight()","visibilitychange","removeEventListener","clearTimeout(timer)","key={day}"])assert.ok(source.includes(text));
});
test("검색·정렬 조건 변경 시 더보기 상태를 재설정하고 추가 카드로 포커스를 이동한다",()=>{
 const explorer=readFileSync(new URL("../src/components/product-explorer.tsx",import.meta.url),"utf8");
 assert.ok(explorer.includes("key={JSON.stringify([state.category,state.brand,state.sub,state.q,state.sort"));
 const results=readFileSync(new URL("../src/components/catalog-results.tsx",import.meta.url),"utf8");assert.ok(results.includes("products.slice(0,shown)"));assert.ok(results.includes(".focus()"));assert.ok(results.includes('role="status"'));
});
