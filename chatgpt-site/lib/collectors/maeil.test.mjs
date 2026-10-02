import assert from "node:assert/strict";
import test from "node:test";
import { collectMaeil } from "./maeil.ts";

const html = body => new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } });

test("매일유업 출시 기사만 읽고 공식 이미지와 발표일을 보존한다", async () => {
  const list = `<article class="lst_isotope"><h1 class="wBk"><a href="press_view.jsp?idx=9">퓨어틴, 올리브영 판매 시작</a></h1>
    <p class="writer"><span>2026.09.01</span></p></article>
    <article class="lst_isotope"><h1 class="wBk"><a href="press_view.jsp?idx=8">저당으로 가벼운 '어메이징 오트 말차' 출시</a></h1>
    <p class="writer"><span>2026.08.31</span></p></article>`;
  const detail = `<div class="view ty-thumb"><div class="thumb"><img src="/UploadedFiles/press/product.jpg" alt="어메이징 오트 말차"></div>
    <article class="article"><header class="top"><h1 class="h wBk">저당으로 가벼운 '어메이징 오트 말차' 출시</h1>
    <p class="data">2026.08.31</p></header><section class="cont">매일유업이 어메이징 오트 말차를 출시했다.</section></article>
    <footer></footer></div>`;
  const requested = [];
  const fetcher = async url => {
    requested.push(url);
    if (url.endsWith("press.jsp")) return html(list);
    if (url.endsWith("idx=8")) return html(detail);
    throw new Error("판매 시작 기사는 요청하면 안 됩니다.");
  };

  const products = await collectMaeil(fetcher);
  assert.deepEqual(requested.map(url => new URL(url).searchParams.get("idx")).filter(Boolean), ["8"]);
  assert.equal(products.length, 1);
  assert.equal(products[0].name, "어메이징 오트 말차");
  assert.equal(products[0].announcedDate, "2026-08-31");
  assert.equal(products[0].category, "drink");
  assert.equal(products[0].imageUrl, "https://www.maeil.com/UploadedFiles/press/product.jpg");
});
