import test from "node:test";
import assert from "node:assert/strict";
import {officialCoffeeCards,inspectOfficialCoffeeCards} from "./lib/official-coffee-cards.ts";
import {extractOfficialProductNames,collectCoffeeSource} from "./lib/coffee-collector.ts";
import {coffeeProductImages} from "./lib/coffee-images.ts";
const source="https://www.gong-cha.co.kr/brand/menu/product?category=003001";
const card=(name,badge="",id=1)=>`<a href="/brand/menu/product_detail?no=${id}"><div class="figure"><img src="/upload/product/${id}.png">${badge}</div><div class="text-a"><p>${name}</p></div></a>`;
test("정상 NEW 0건과 상품 구조 미확인을 구분하고 실패 경로를 검증 목록에서 제외한다",async()=>{
 const sourceConfig={id:"gongcha",brand:"공차",note:"",channels:[{kind:"md",label:"MD",url:source}]};
 const good=await collectCoffeeSource(sourceConfig,"2026-10-17",async()=>new Response(card("일반 머그")));
 assert.equal(good.checked,1);assert.equal(good.failed,0);assert.equal(good.candidates.length,0);
 for(const html of ['<h2>신메뉴</h2><img alt="캠페인">',card("일반 머그")+'<a href="/brand/menu/product_detail?no=2"><img alt="NEW"></a>']){
  const bad=await collectCoffeeSource(sourceConfig,"2026-10-17",async()=>new Response(html));
  assert.equal(bad.checked,0);assert.equal(bad.failed,1);assert.deepEqual(bad.failureCodes,["structure"]);assert.deepEqual(bad.verifiedUrls,[]);
 }
 assert.equal(inspectOfficialCoffeeCards(card("일반 머그"),source).namedCards,1);
});
test("같은 상품의 명시적 NEW만 이름·이미지와 연결한다",()=>{
 const html='<nav><span>NEW</span></nav>'+card("신상 텀블러",'<img alt="NEW" src="/badge.png">')+card("일반 머그","",2);
 assert.deepEqual(extractOfficialProductNames(html,source,undefined,true),["신상 텀블러"]);
 assert.deepEqual([...coffeeProductImages(html,source).values()],["https://www.gong-cha.co.kr/upload/product/1.png"]);
 assert.equal(officialCoffeeCards(html,source)[0].imageUrl,"https://www.gong-cha.co.kr/upload/product/1.png");
});
test("캠페인·숨김·주석·다른 상품의 NEW를 전파하지 않는다",()=>{
 const html='<h2>신메뉴</h2><a href="/brand/menu/new_menu_detail?seq=35"><img alt="NEW"></a>'+card("일반 라떼")+'<!--'+card("주석 라떼","<span>NEW</span>",3)+'-->'+card("숨김 라떼",'<span style="display:none">NEW</span>',4);
 assert.deepEqual(officialCoffeeCards(html,source),[]);
});
test("브랜드별 조건은 식별·제목만 다르고 NEW 판정은 공유한다",()=>{
 const compose='<a href="/index.php?act=dispCafemenuGalleryItem&amp;item_srl=123"><div class="cafemenu-menu-name">신상 바게트</div><span>NEW</span></a>';
 assert.equal(officialCoffeeCards(compose,"https://composecoffee.com/index.php")[0].name,"신상 바게트");
 const shop='<a href="/product/detail/?ItemCode=123"><p class="product-name">시즌 원두</p><b>NEW</b></a>';
 assert.equal(officialCoffeeCards(shop,"https://terarosa.com/product/list/?category=12")[0].name,"시즌 원두");
 assert.deepEqual(officialCoffeeCards(shop.replace('href="/product','href="https://other.example/product'),"https://terarosa.com/product/list/"),[]);
});
