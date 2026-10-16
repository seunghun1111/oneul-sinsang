import test from "node:test";
import assert from "node:assert/strict";
import {coffeeProductImages,coffeeProductImageResults} from "./lib/coffee-images.ts";
import {collectCoffeeSource} from "./lib/coffee-collector.ts";
test("빽다방은 같은 슬라이드의 이미지와 제목만 연결하고 주석은 제외한다",()=>{
 const html=`<div class="menu_slider new_menu_slider"><div class="swiper-slide"><img src="/wp-content/uploads/a.png"><p class="best_tit">라떼 HOT</p></div><div class="swiper-slide"><p class="best_tit">라떼 ICED</p></div><!--<img src="/wp-content/uploads/fake.png" alt="라떼 ICED">--></div>`;
 const images=coffeeProductImages(html,"https://paikdabang.com/menu/menu_new/");
 assert.equal(images.get("라떼hot"),"https://paikdabang.com/wp-content/uploads/a.png");
 assert.equal(images.has("라떼iced"),false);
});
test("이디야는 배지 대신 상품 이미지의 정확한 alt를 연결하고 모호한 결과는 제외한다",()=>{
 const html=`<img src="/images/new.png" alt="new"><img src="/files/menu/a.png" alt="라떼 HOT"><img src="/files/menu/b.png" alt="라떼 ICED"><img src="/files/menu/c.png" alt="라떼 ICED"><img src="https://fake.example.com/files/menu/d.png" alt="다른 라떼">`;
 const images=coffeeProductImages(html,"https://www.ediya.com/contents/drink.html");
 assert.equal(images.get("라떼hot"),"https://www.ediya.com/files/menu/a.png");
 assert.equal(images.size,1);
 assert.equal(coffeeProductImageResults(html,"https://www.ediya.com/contents/drink.html").ambiguous.get("라떼iced"),2);
});
test("할리스 이미지는 공식 CDN 상대 프로토콜 주소를 정규화하되 NEW 근거를 생성하지 않는다",()=>{
 const images=coffeeProductImages(`<img src="//admin.hollys.co.kr/upload/menu/etc/a.png" alt="할리베어 미니볼"><img src="https://img.kakao.com/a.png" alt="다른 상품">`,"https://www.hollys.co.kr/menu/md.do");
 assert.equal(images.get("할리베어미니볼"),"https://admin.hollys.co.kr/upload/menu/etc/a.png");
 assert.equal(images.size,1);
});
test("이미지가 있는 일반 상품을 새 후보로 만들지 않고 기존 NEW 추출 결과만 보완한다",async()=>{
 const html=`<ul class="pro_n bxSlider"><li><span class="new_icon"><img alt="new" src="/images/new.png"></span><img src="/files/menu/a.png" alt="신상 라떼"><p><a>신상 라떼</a></p></li></ul><img src="/files/menu/b.png" alt="일반 라떼">`;
 const result=await collectCoffeeSource({id:"ediya",brand:"이디야커피",channels:[{kind:"menu",url:"https://www.ediya.com/contents/drink.html"}]},"2026-10-16",async()=>new Response(html));
 assert.equal(result.candidates.length,1);
 assert.equal(result.candidates[0].name,"신상 라떼");
 assert.equal(result.candidates[0].imageUrl,"https://www.ediya.com/files/menu/a.png");
});
