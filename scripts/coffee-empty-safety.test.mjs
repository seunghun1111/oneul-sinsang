import test from "node:test";
import assert from "node:assert/strict";
import {guardCoffeeEmptyNewLists,coffeeCollectionFailures} from "./lib/coffee-collection-run.ts";
import {mergeCoffeeProducts} from "./update-coffee-products.ts";
const old={id:"old",brand:"A",name:"이전맛",normalizedName:"이전맛",sourceUrl:"https://example.com/menu",isActive:true,firstDetectedAt:"2026-10-01",reviewStatus:"approved"};
const report={checkedAt:"2026-10-16",results:[{brand:"A",sourceId:"a",status:"success",checked:1,failed:0,newCount:0}]};
test("커피 경로 전체 0건은 반복돼도 기존 상태와 누락 횟수를 변경하지 않는다",()=>{
 const urls=new Set([old.sourceUrl]);
 const [first]=mergeCoffeeProducts([old],[],"2026-10-16",urls);
 const [second]=mergeCoffeeProducts([first],[],"2026-10-17",urls);
 assert.deepEqual(second,old);
 const guarded=guardCoffeeEmptyNewLists([old],[],urls,report);
 assert.equal(guarded.verifiedUrls.size,0);
 assert.equal(guarded.report.results[0].reasonCode,"unexpected_empty");
 assert.match(coffeeCollectionFailures(guarded.report)[0],/갑자기 0건/);
});
test("커피 음료 경로 실패는 같은 브랜드 MD 성공과 별도로 보호한다",()=>{
 const md={...old,id:"md",normalizedName:"컵",sourceUrl:"https://example.com/md"};
 const guarded=guardCoffeeEmptyNewLists([old],[md],new Set([old.sourceUrl,md.sourceUrl]),report);
 assert.equal(guarded.verifiedUrls.has(md.sourceUrl),true);
 assert.equal(guarded.verifiedUrls.has(old.sourceUrl),false);
 const repeated=guardCoffeeEmptyNewLists([old],[],new Set([old.sourceUrl]),{...report,checkedAt:"2026-10-17"},guarded.report.results);
 assert.deepEqual(coffeeCollectionFailures(guarded.report),coffeeCollectionFailures(repeated.report));
});
