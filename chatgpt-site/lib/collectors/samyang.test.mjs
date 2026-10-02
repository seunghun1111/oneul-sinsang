import assert from "node:assert/strict";
import test from "node:test";
import { collectSamyang, parseSamyangDetail } from "./samyang.ts";

const html = body => new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } });

test("실제 출시 기사만 모으고 출시 기념 기사는 제외한다", async () => {
  const list = `<div class="board-list"><table><tbody>
    <tr><td>1</td><td>제품뉴스</td><td class="subject"><a onclick="javascript:fnView('./view.do', 10); return false;">삼양식품 ‘삼양1963’ 출시 100일 맞아 행사를 연다</a></td><td>2026.09.02</td></tr>
    <tr><td>2</td><td>제품뉴스</td><td class="subject"><a onclick="javascript:fnView('./view.do', 11); return false;">삼양식품, 우지로 만든 짜장라면 신제품 &#039;짜르르&#039; 출시</a></td><td>2026.09.01</td></tr>
    </tbody></table></div>`;
  const detail = `<div class="board-view"><div class="num-title"><p class="title">삼양식품, 우지로 만든 짜장라면 신제품 &#039;짜르르&#039; 출시</p><p class="date">2026.09.01</p></div>
    <div class="con">삼양식품이 짜르르를 출시했다. <img src="data:image/png;base64,AAAA"></div></div><!-- //board-view -->`;
  const requested = [];
  const fetcher = async url => {
    requested.push(url);
    if (url.includes("list.do")) return html(list);
    if (url.endsWith("seq=11")) return html(detail);
    throw new Error("기념 기사는 요청하면 안 됩니다.");
  };

  const products = await collectSamyang(fetcher);
  assert.deepEqual(requested.map(url => new URL(url).searchParams.get("seq")).filter(Boolean), ["11"]);
  assert.equal(products.length, 1);
  assert.equal(products[0].name, "짜르르");
  assert.equal(products[0].category, "ramen");
  assert.equal(products[0].announcedDate, "2026-09-01");
  assert.equal(products[0].imageUrl, null);
});

test("파스타 신제품은 기타가 아니라 간편식으로 분류한다", () => {
  const article = { id: "12", title: "삼양식품 탱글 브랜드 신제품 ‘바질토마토 프로틴파스타’ 출시", date: "2026-04-27", url: "https://samyangfoods.com/kor/publicity/press/view.do?seq=12" };
  const detail = `<div class="board-view"><p class="title">${article.title}</p><p class="date">2026.04.27</p>
    <div class="con">바질토마토 프로틴파스타를 출시했다.</div></div><!-- //board-view -->`;
  const product = parseSamyangDetail(detail, article);
  assert.equal(product?.category, "meal");
  assert.equal(product?.emoji, "🍝");
});

test("라면이 포함된 한정 선물세트는 라면 단품으로 분류하지 않는다", () => {
  const article = { id: "13", title: "삼양식품, 추석 맞아 ‘삼양1963 X 짜르르 우지 선물세트’ 한정 출시", date: "2026-08-31", url: "https://samyangfoods.com/kor/publicity/press/view.do?seq=13" };
  const detail = `<div class="board-view"><p class="title">${article.title}</p><p class="date">2026.08.31</p>
    <div class="con">삼양1963 X 짜르르 우지 선물세트를 출시했다.</div></div><!-- //board-view -->`;
  const product = parseSamyangDetail(detail, article);
  assert.equal(product?.category, "etc");
  assert.equal(product?.emoji, "🎁");
});
