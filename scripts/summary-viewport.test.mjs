import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("홈 요약은 6개 자르기 없이 공통 스크롤 영역을 사용한다",()=>{
 for(const file of ["today-updates","monthly-updates"]){
  const source=readFileSync(new URL(`../src/components/${file}.tsx`,import.meta.url),"utf8");
  assert.ok(source.includes("<SummaryViewport"));
  assert.ok(!source.includes("slice(0, 6)"));
 }
 const viewport=readFileSync(new URL("../src/components/summary-viewport.tsx",import.meta.url),"utf8");
 assert.ok(viewport.includes('role="region"'));
 assert.ok(viewport.includes("tabIndex={0}"));
 assert.ok(viewport.includes("observer.disconnect()"));
 assert.ok(viewport.includes("더보기 · 영역 늘리기"));
});
