import test from "node:test";
import assert from "node:assert/strict";
import {renderedPizzaHutImage,resolvePizzaHutImage} from "./lib/pizzahut-images.ts";
const url="https://akamai.pizzahut.co.kr/2020pizzahut-prod/public/img/menu/RPPZ2275_RPEG0056_RPDO0001_l.png";
test("상품 코드가 일치하는 공식 img만 읽고 다른 상품·배너·주석을 제외한다",()=>{
 assert.equal(renderedPizzaHutImage(`<img _ngcontent-x="" src="${url}">`,"RPPZ2275"),url);
 assert.equal(renderedPizzaHutImage(`<img src="${url}">`,"RPPZ9999"),undefined);
 assert.equal(renderedPizzaHutImage(`<!--<img src="${url}">--><meta property="og:image" content="${url}">`,"RPPZ2275"),undefined);
 assert.equal(renderedPizzaHutImage(`<img src="${url.replace("akamai.pizzahut.co.kr","evil.example")}">`,"RPPZ2275"),undefined);
});
test("확인된 렌더링 주소도 매번 이미지 응답 검증을 거쳐야 한다",async()=>{
 let method;
 assert.equal(await resolvePizzaHutImage("RPPZ2275","",async(_,init)=>{method=init.method;return new Response(null,{headers:{"content-type":"image/png"}});}),url);
 assert.equal(method,"HEAD");
 for(const response of [new Response(null,{status:404}),new Response(null,{headers:{"content-type":"text/html"}})])assert.equal(await resolvePizzaHutImage("RPPZ2275","",async()=>response),undefined);
 assert.equal(await resolvePizzaHutImage("RPPZ9999","",async()=>{throw Error("must not request");}),undefined);
});
