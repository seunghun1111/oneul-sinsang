import test from "node:test";
import assert from "node:assert/strict";
import {guardEmptyNewLists,safeNewListBrands} from "./lib/new-list-safety.ts";
import {brandCollectionFailures} from "./lib/brand-collection-run.ts";
const old=[{brand:"A",isActive:true}];
const report={checkedAt:"2026-10-16",results:[{brand:"A",status:"success",newCount:0}]};
test("기존 NEW 전체가 0건이면 상품을 유지하고 이상 상태로 알린다",()=>{
 const guarded=guardEmptyNewLists(old,[],report);
 assert.deepEqual(safeNewListBrands(old,[],["A"]),[]);
 assert.equal(guarded.results[0].reasonCode,"unexpected_empty");
 assert.match(brandCollectionFailures(guarded,"외식")[0],/갑자기 0건/);
});
test("초기 0건은 정상이며 다른 브랜드의 성공 결과는 보호 대상에 섞지 않는다",()=>{
 const both={...report,results:[...report.results,{brand:"B",status:"success",newCount:0}]};
 const guarded=guardEmptyNewLists(old,[],both);
 assert.deepEqual(guarded.results.map(r=>r.status),["failed","success"]);
 assert.equal(guardEmptyNewLists([],[],report).results[0].status,"success");
});
test("0건 이상 지속은 중복 알림을 억제하고 새 상품 확인 시 해제한다",()=>{
 const one=guardEmptyNewLists(old,[],report);
 const two=guardEmptyNewLists(old,[],{...report,checkedAt:"2026-10-17"},one.results);
 assert.deepEqual(brandCollectionFailures(one,"외식"),brandCollectionFailures(two,"외식"));
 assert.equal(guardEmptyNewLists(old,[{brand:"A"}],report).results[0].status,"success");
});
