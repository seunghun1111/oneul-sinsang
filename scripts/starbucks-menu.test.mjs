import test from"node:test";
import assert from"node:assert/strict";
import{starbucksCategoryCodes,parseStarbucksMenu}from"./lib/starbucks-menu.ts";
import{collectStarbucksFromSitemaps}from"./lib/coffee-collector.ts";
import{mergeCoffeeProducts}from"./update-coffee-products.ts";
import{guardCoffeeEmptyNewLists}from"./lib/coffee-collection-run.ts";
const html=`var url='/menu/productListAjax.do';if(newicon == 'Y'){} result="W0000003";/* result="W9999999"; */`;
const row=(id,flag)=>({product_CD:id,product_NM:"상품"+id,newicon:flag,sold_OUT:"Y",img_UPLOAD_PATH:"https://image.istarbucks.co.kr",file_PATH:`/upload/store/skuimg/2026/10/${id}.jpg`});
test("스타벅스 실제 newicon만 판별하고 판매·시즌 상태로 대체하지 않는다",()=>{
 assert.deepEqual(starbucksCategoryCodes(html),["W0000003"]);
 assert.equal(parseStarbucksMenu({list:[row("1","Y")]},"drink")[0].isNew,true);
 assert.equal(parseStarbucksMenu({list:[row("2","N")]},"food")[0].isNew,false);
 for(const section of ["drink","food","product"]){
  const parsed=parseStarbucksMenu({list:[row("1","Y")]},section)[0];
  assert.equal(parsed.imageUrl,"https://image.istarbucks.co.kr/upload/store/skuimg/2026/10/1.jpg");
 }
 assert.equal(parseStarbucksMenu({list:[{...row("1","Y"),img_UPLOAD_PATH:"https://evil.example.com"}]},"drink")[0].imageUrl,undefined);
 for(const flag of [undefined,"",true])assert.throws(()=>parseStarbucksMenu({list:[row("1",flag)]},"drink"));
 assert.throws(()=>parseStarbucksMenu({products:[]},"drink"));
});
test("실패한 카테고리는 NEW 종료 근거를 남기지 않는다",async()=>{
 let calls=0;
 const fetcher=async(url,init)=>{
  if(url.endsWith("robots.txt"))return new Response("User-agent: *\nAllow: /");
  if(url.endsWith("_list.do"))return new Response(html);
  calls++;if(calls===2)return new Response("error",{status:503});
  assert.equal(init.redirect,"manual");return Response.json({list:[row("1","Y"),row("2","N")]});
 };
 const result=await collectStarbucksFromSitemaps({id:"starbucks",brand:"스타벅스",channels:[],note:""},"2026-10-16",fetcher);
 assert.equal(result.checked,2);assert.equal(result.failed,1);
 assert.ok(result.candidates.every(p=>p.reviewEvidence.explicitNew===true&&p.availabilityStatus==="unknown"));
 assert.ok(!result.confirmedNotNewUrls.some(u=>u.includes("food_view")));
 const old={id:"old",brand:"스타벅스",name:"기존",normalizedName:"기존",sourceUrl:"https://www.starbucks.co.kr/menu/drink_view.do?product_cd=2",isActive:true,firstDetectedAt:"2026-10-01"};
 const changed=mergeCoffeeProducts([old],[],"2026-10-16",new Set(),new Set(result.confirmedNotNewUrls))[0];
 assert.equal(changed.newStatus,"removed");assert.equal(changed.availabilityStatus,"unknown");assert.equal(changed.firstDetectedAt,old.firstDetectedAt);
 assert.equal(mergeCoffeeProducts([old],[],"2026-10-16")[0].isActive,true);
 const report={checkedAt:"2026-10-16",results:[{brand:"스타벅스",sourceId:"starbucks",status:"success",checked:3,failed:0,newCount:0}]};
 assert.equal(guardCoffeeEmptyNewLists([old],[],new Set([old.sourceUrl]),report,[],new Set([old.sourceUrl])).report.results[0].status,"success");
 assert.equal(guardCoffeeEmptyNewLists([old],[],new Set([old.sourceUrl]),report).report.results[0].status,"partial");
});
test("스타벅스 정상 3개 섹션 확인은 실패 알림을 만들지 않는다",async()=>{
 const fetcher=async url=>url.endsWith("robots.txt")?new Response("User-agent: *\nAllow: /"):url.endsWith("_list.do")?new Response(html):Response.json({list:[row("1","Y")]});
 const result=await collectStarbucksFromSitemaps({id:"starbucks",brand:"스타벅스",channels:[],note:""},"2026-10-16",fetcher);
 assert.equal(result.checked,3);assert.equal(result.failed,0);
 assert.equal(result.candidates.length,1);
 assert.ok(result.candidates[0].imageUrl);
 assert.equal(mergeCoffeeProducts([],result.candidates,"2026-10-16")[0].imageUrl,result.candidates[0].imageUrl);
});
