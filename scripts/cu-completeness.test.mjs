import test from "node:test";
import assert from "node:assert/strict";
import {collectCuDetailed} from "./lib/cu-collector.ts";
import {categoryCompleteness} from "./lib/category-completeness.ts";
import {mergeCuProducts} from "./update-cu-products.ts";
import {brandCollectionFailures} from "./lib/brand-collection-run.ts";
import {CollectionFailure} from "./lib/collection-failure.ts";
const card=(id,isNew=true)=>`<li class="prod_list"><a onclick="view(${id})"><div class="name"><p>음료${id}</p></div>${isNew?'<span class="new">NEW</span>':''}</a></li>`;
const more='<div class="prodListBtn-w"></div>';
test("NEW가 없는 중간 페이지도 계속 확인하고 반복 페이지·상한을 완전 수집으로 기록하지 않는다",async()=>{
 const pages=[];
 const result=await collectCuDetailed("2026-10-20",async(url,init)=>{const page=Number(init.body.get("pageIndex"));pages.push(page);return new Response(page===1?card(1,false)+more:card(2));});
 assert.ok(result.categories.every(row=>row.complete&&row.pages===2&&row.newCount===1));
 assert.equal(pages.length,14);
 const repeated=await collectCuDetailed("2026-10-20",async()=>new Response(card(1)+more));
 assert.ok(repeated.categories.every(row=>!row.complete&&row.reason==="repeated_page"));
 const capped=await collectCuDetailed("2026-10-20",async(url,init)=>new Response(card(Number(init.body.get("pageIndex")))+more));
 assert.ok(capped.categories.every(row=>!row.complete&&row.reason==="page_limit"&&row.pages===10));
});
test("요청 실패·깨진 NEW·빈 HTML을 카테고리별로 격리한다",async()=>{
 const result=await collectCuDetailed("2026-10-20",async(url,init)=>{
  const category=init.body.get("searchMainCategory");
  return category==="10"?new Response("",{status:503}):category==="20"?new Response('<li class="prod_list"><span class="new"></span></li>'):category==="30"?new Response(""):new Response(card(4));
 });
 assert.equal(result.categories[0].failureDetail.httpStatus,503);
 assert.equal(result.categories[1].reason,"structure");assert.equal(result.categories[2].reason,"structure");
 assert.equal(result.categories[3].complete,true);
});
test("0건·50% 미만 급감·불완전 카테고리만 보류하며 알림 키를 안정적으로 유지한다",()=>{
 const existing=Array.from({length:10},(_,i)=>({brand:"CU",subCategory:"음료",isActive:true,id:`cu-${i}`}));
 const check={label:"음료",complete:true,pages:1,newCount:4};
 const first=categoryCompleteness(existing,[check],"2026-10-20");
 assert.equal(first.issues[0].reason,"sharp_drop");assert.equal(first.verifiedCategories.size,0);
 assert.equal(categoryCompleteness(existing,[{...check,newCount:5}],"2026-10-20").issues.length,0);
 assert.equal(categoryCompleteness(existing,[{...check,newCount:0}],"2026-10-20").issues[0].reason,"unexpected_empty");
 const next=categoryCompleteness(existing,[check],"2026-10-21",first.issues);
 const report=issues=>({results:[{brand:"CU",status:"failed",categoryIssues:issues}]});
 assert.deepEqual(brandCollectionFailures(report(first.issues),"편의점"),brandCollectionFailures(report(next.issues),"편의점"));
});
test("검증 미완료 상품은 누락 횟수·상태를 보존한다",()=>{
 const p={id:"cu-1",brand:"CU",name:"음료",normalizedName:"음료",category:"convenience",subCategory:"음료",firstDetectedAt:"2026-10-19T00:00:00Z",isActive:true,newStatus:"active",cuMissingChecks:1,cuMissingCheckedAt:"2026-10-19T00:00:00Z"};
 const candidate={slug:"cu-2",brand:"CU",name:"신상품",normalizedName:"신상품",category:"convenience",subCategory:"과자류",sourceUrl:"https://cu.bgfretail.com/product/view.do?gdIdx=2",sourceType:"official_site",description:"NEW",announcedDate:"2026-10-20"};
 const result=mergeCuProducts([p],[candidate],"2026-10-20T00:00:00Z",new Set(["과자류"]));
 assert.deepEqual(result.find(row=>row.id==="cu-1"),p);
 assert.ok(result.find(row=>row.id==="cu-2"));
});
test("일시 실패는 해당 페이지만 한 번 재시도하며 카테고리 요청 횟수를 남긴다",async()=>{
 let calls=0;
 const result=await collectCuDetailed("2026-10-20",async()=>{if(++calls===1)throw new CollectionFailure("timeout");return new Response(card(1));});
 assert.equal(result.categories[0].complete,true);assert.equal(result.categories[0].requests,2);
 assert.ok(result.categories.slice(1).every(row=>row.requests===1));
});
