import test from "node:test";
import assert from "node:assert/strict";
import {productImageSource} from "./lib/html-image.ts";
import {coffeeProductImages} from "./lib/coffee-images.ts";

test("공통 이미지 추출은 기본 src 대신 실제 지연 로딩 경로를 읽는다",()=>{
 assert.equal(productImageSource('<img src="/placeholder.png" data-src="/product.jpg">'),"/product.jpg");
 assert.equal(productImageSource('<img src="data:image/gif;base64,empty" data-original="/original.jpg">'),"/original.jpg");
 assert.equal(productImageSource('<img data-src="" src="/product.jpg">'),"/product.jpg");
});
test("NEW 배지·주석·스크립트·기본 이미지는 상품 이미지로 쓰지 않는다",()=>{
 const html='<!--<img src="/fake.jpg">--><script>const x=`<img src="/script.jpg">`;</script><img src="/badge.png" alt="NEW"><img src="/no_image.png"><img src="/product.jpg">';
 assert.equal(productImageSource(html),"/product.jpg");
 assert.equal(productImageSource('<img alt="디폴트 이미지" src="/default.jpg">'),undefined);
});
test("커피 이미지 보완도 공통 지연 로딩 규칙과 기존 공식 호스트 제한을 사용한다",()=>{
 const images=coffeeProductImages('<img src="/placeholder.png" data-src="/files/menu/a.png" alt="라떼"><img data-src="https://fake.example/a.png" alt="다른 음료">',"https://www.ediya.com/contents/drink.html");
 assert.equal(images.get("라떼"),"https://www.ediya.com/files/menu/a.png");
 assert.equal(images.size,1);
});
