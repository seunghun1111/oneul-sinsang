import assert from "node:assert/strict";
import test from "node:test";
import { automatedBrandSources, extractBrandProducts, robotsAllows, collectAutomatedBrand } from "./lib/manual-brand-collector.ts";
import { mergeProducts } from "./update-static-products.ts";
import { isCurrentlyOnSale } from "../src/lib/product-window.ts";
const now="2026-10-15T00:00:00Z";
const source=id=>automatedBrandSources.find(s=>s.id===id);
test("bhc 공식 isNew만 후보로 추출하고 가격은 저장하지 않는다",()=>{
 const products=extractBrandProducts(source("bhc"),JSON.stringify({status:"success",body:[{productCd:"123",productNm:"테스트 치킨",isNew:"Y",price:25000},{productCd:"124",productNm:"기존 치킨",isNew:"N"}]}),now);
 assert.equal(products.length,1);assert.equal(products[0].reviewStatus,"pending");assert.equal(products[0].releaseDate,null);assert.equal(products[0].price,null);
});
test("푸라닭과 네네치킨은 상품별 NEW 배지와 개별 ID를 함께 요구한다",()=>{
 const pura='<div class="photo_list"><li><a href="view.asp?idx=11"><img src="/upload/test.png" class="bg_thumb"><img alt="NEW메뉴" src="/images/menu/img_new.png"><p class="title one">새 치킨</p></a></li><li><a href="view.asp?idx=12"><p class="title one">기존 치킨</p></a></li></div>';
 assert.equal(extractBrandProducts(source("puradak"),pura,now).length,1);
 const nene='<div class="MenuInner"><div class="MenuBox " onclick="location.href=\'/home_menu_detail.asp?no=21\'"><span class="icon2">NEW</span><div class="MenuTitle"><div class="moiconWrap"><span>NEW</span></div>새 치킨</div></div></div>';
 assert.equal(extractBrandProducts(source("nene"),nene,now)[0].name,"새 치킨");
});
test("공식몰 추천, 최신 정렬, 이미지 수정일과 주석의 NEW는 신상 근거로 사용하지 않는다",()=>{
 const row='<li id="anchorBoxId_31"><a href="/product/detail.html?product_no=31"><img src="/web/product/202610/test.png"></a><p class="name"><a>기존 아이스크림</a></p><!--<img alt="NEW">--></li>';
 for(const id of ["haagendazs","natuur","lotteice"]) {
   assert.equal(extractBrandProducts(source(id),'<div class="xans-product-listnormal">'+row+'</div>',now).length,0);
   const active=row.replace('<!--<img alt="NEW">-->','<img alt="신상품">');
   assert.equal(extractBrandProducts(source(id),'<div class="xans-product-listnormal">'+active+'</div>',now).length,1);
 }
 assert.equal(extractBrandProducts(source("bbq"),'<h3>신메뉴</h3><li><a href="menuView.asp?midx=32"><p class="name">오래된 치킨</p></a></li>',now).length,0);
});
test("robots의 공백·와일드카드·쿼리와 차단 규칙을 적용한다",()=>{
 assert.equal(robotsAllows('User-Agent : *\nAllow : /\nDisallow : /Program/',"https://nenechicken.com/Program/list"),false);
 assert.equal(robotsAllows('User-agent: *\nDisallow: /*board*page=',"https://example.com/board/list?page=2"),false);
 assert.equal(robotsAllows('User-agent: *\nDisallow: /api\nAllow: /api/public',"https://example.com/api/public"),true);
});
test("robots 차단 시 상품 요청을 보내지 않고 HTML 정책 오류도 거부한다",async()=>{
 let calls=0;
 await assert.rejects(collectAutomatedBrand(source("bhc"),now,async()=>{calls++;return new Response("User-agent: *\nDisallow: /api");}),/제한/);
 assert.equal(calls,1);
 await assert.rejects(collectAutomatedBrand(source("bhc"),now,async()=>new Response('<html>오류</html>')),/HTML/);
});
test("검수 대기 후보는 최초 확인일을 보존하고 공개 목록에 노출하지 않는다",()=>{
 const [candidate]=extractBrandProducts(source("bhc"),JSON.stringify({status:"success",body:[{productCd:"123",productNm:"새 치킨",isNew:"Y"}]}),now);
 const [p]=mergeProducts([], [candidate],now);
 assert.equal(p.releaseDate,undefined); assert.equal(p.reviewStatus,"pending");
 assert.equal(isCurrentlyOnSale(p,new Date(now)),false);
 assert.equal(isCurrentlyOnSale({...p,reviewStatus:"approved"},new Date(now)),true);
 const [again]=mergeProducts([p],[candidate],"2026-10-16T00:00:00Z");
 assert.equal(again.firstDetectedAt,now);assert.equal(again.reviewStatus,"pending");
});
