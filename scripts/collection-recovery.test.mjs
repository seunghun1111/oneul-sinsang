import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CollectionFailure} from "./lib/collection-failure.ts";
import {retryCollection} from "./lib/collection-retry.ts";
import {runCoffeeCollection} from "./lib/coffee-collection-run.ts";
import {runBrandCollection} from "./lib/brand-collection-run.ts";
import {scheduleDelay} from "./lib/schedule-delay.mjs";
import {inspectOfficialCoffeeCards} from "./lib/official-coffee-cards.ts";
import {coffeeProductImages} from "./lib/coffee-images.ts";
test("더벤티 data-tag NEW와 상품명·이미지는 같은 공식 카드에서만 연결한다",()=>{
 const url="https://www.theventi.co.kr/new2022/menu/all.html";
 const html=`<a href="/new2022/menu/all-view.new.html?uid=564"><img src="http://www.theventi.co.kr/new/upload/menu_new/grape.png"><i data-tag="NEW"></i><p class="tit">알찬 포도 에이드</p></a><a href="/new2022/menu/all-view.new.html?uid=563"><img src="/new/upload/menu_new/old.png"><p class="tit">일반 커피</p></a>`;
 const result=inspectOfficialCoffeeCards(html,url);assert.equal(result.namedCards,2);assert.equal(result.products.length,1);assert.equal(result.products[0].name,"알찬 포도 에이드");assert.equal(result.products[0].imageUrl,"https://www.theventi.co.kr/new/upload/menu_new/grape.png");
 assert.equal(coffeeProductImages(html,url).size,1);
});
test("더벤티 숨긴 배지·외부 카드·NEW 없는 일반 상품은 신상 근거가 아니다",()=>{
 const url="https://www.theventi.co.kr/new2022/menu/all.html";
 for(const html of [`<a href="https://other.example/new2022/menu/all-view.new.html?uid=1"><i data-tag="NEW"></i><p class="tit">외부 음료</p></a>`,`<a href="/new2022/menu/all-view.new.html?uid=1"><i hidden data-tag="NEW"></i><p class="tit">숨긴 음료</p></a>`,`<a href="/new2022/menu/all-view.new.html?uid=1"><p class="tit">일반 음료</p></a>`])assert.equal(inspectOfficialCoffeeCards(html,url).products.length,0);
 const external=`<a href="/new2022/menu/all-view.new.html?uid=1"><img src="http://other.example/x.png"><i data-tag="NEW"></i><p class="tit">포도 음료</p></a>`;assert.equal(inspectOfficialCoffeeCards(external,url).products[0].imageUrl,undefined);
});
test("일시 장애만 최대 1회 재시도하고 정상·빈 결과는 반복하지 않는다",async()=>{
 for(const code of ["timeout","connection","network"]){let count=0,wait=0;const result=await retryCollection(async()=>{if(++count===1)throw new CollectionFailure(code);return ["ok"];},()=>[],async()=>{wait++;});assert.deepEqual(result,["ok"]);assert.equal(count,2);assert.equal(wait,1);}
 let count=0;assert.deepEqual(await retryCollection(async()=>{count++;return [];},()=>[],async()=>{}),[]);assert.equal(count,1);
});
test("정책·TLS·DNS·HTTP·구조 오류는 반복하거나 우회하지 않는다",async()=>{
 for(const code of ["policy_blocked","policy_unavailable","restricted","tls","dns","http","structure","unknown"]){let count=0;await assert.rejects(()=>retryCollection(async()=>{count++;throw new CollectionFailure(code);},()=>[],async()=>{throw Error("must not wait");}));assert.equal(count,1);}
 let count=0;await assert.rejects(()=>retryCollection(async()=>{count++;throw new CollectionFailure("timeout");},()=>[],async()=>{}));assert.equal(count,2);
});
test("실패 반환값은 전체 일시 실패만 재시도하고 부분 성공은 보존한다",async()=>{
 let count=0;const failed={checked:0,failed:1,failureCodes:["timeout"],candidates:[],verifiedUrls:[]};
 const result=await retryCollection(async()=>++count===1?failed:{...failed,checked:1,failed:0,failureCodes:[]},value=>value.checked===0?value.failureCodes:[],async()=>{});assert.equal(count,2);assert.equal(result.checked,1);
 let partialCalls=0;const partial=await runCoffeeCollection([{id:"a",brand:"A"}],"2026-10-19",async()=>{partialCalls++;return {...failed,checked:1,candidates:[{id:"kept"}],verifiedUrls:["https://example.com/a"]};});assert.equal(partialCalls,1);assert.equal(partial.report.results[0].status,"partial");assert.equal(partial.observed[0].id,"kept");
});
test("일반 브랜드 재시도 최종 실패는 성공·삭제 근거로 변환하지 않는다",async()=>{
 let count=0;const result=await runBrandCollection([["A",async()=>{count++;throw new CollectionFailure("timeout");}]],"2026-10-19");assert.equal(count,2);assert.deepEqual(result.checkedBrands,[]);assert.equal(result.report.results[0].status,"failed");assert.equal(result.report.results[0].failureCode,"timeout");
});
test("한국 시간 06:30 일정의 지연을 측정하고 수동 실행은 제외한다",()=>{
 assert.equal(scheduleDelay("schedule",new Date("2026-10-17T23:18:44Z")).delayMinutes,108);
 assert.equal(scheduleDelay("schedule",new Date("2026-10-18T23:30:53Z")).delayMinutes,120);
 assert.equal(scheduleDelay("schedule",new Date("2026-10-18T21:30:00Z")).late,false);
 assert.equal(scheduleDelay("schedule",new Date("2026-10-18T22:30:00Z")).late,true);
 assert.equal(scheduleDelay("schedule",new Date("2026-10-18T23:30:53Z")).day,"2026-10-19");
 assert.equal(scheduleDelay("workflow_dispatch",new Date("2026-10-18T23:30:53Z")),null);
});
test("지연은 기존 일일 알림으로 합치고 수집 일정·횟수는 늘리지 않는다",()=>{
 const workflow=readFileSync(new URL("../.github/workflows/update-products.yml",import.meta.url),"utf8");
 assert.equal([...workflow.matchAll(/cron:/g)].length,1);assert.match(workflow,/cron: "30 21 \* \* \*"/);assert.match(workflow,/COLLECTION_DELAY_MINUTES:/);assert.match(workflow,/COLLECTION_SCHEDULED_DAY:/);
 const notify=readFileSync(new URL("./notify-review.ts",import.meta.url),"utf8");assert.ok(notify.includes("예약 실행 60분 이상 지연 / 예정일 ${scheduledDay}"));assert.ok(notify.includes("if(existing)"));
});
