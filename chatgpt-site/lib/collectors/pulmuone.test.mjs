import assert from "node:assert/strict";
import test from "node:test";
import { collectPulmuone, parsePulmuoneDetail, parsePulmuoneList } from "./pulmuone.ts";

const html = body => new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } });
const row = (id, title, date) => `<tr><td class="num02">${id}</td><td class="title02"><a href="/pulmuone/newsroom/viewNewsroom.do?menu=dataroom&amp;id=${id}">${title}</a></td><td class="date01">${date}</td></tr>`;
const list = rows => `<table><tbody>${rows.join("")}</tbody></table>`;

test("공식 출시 기사만 읽고 발표일과 이미지 주소를 보존한다", async () => {
  const title = "풀무원, 고압으로 두 번 뽑아 격이 다른 식감 ‘식감혁신 본격 떡볶이’ 출시";
  const firstList = list([
    row("3947", "올가홀푸드, ‘2026년 김장 사전예약 프로모션’ 진행", "2026년 10월 02일"),
    row("3936", title, "2026년 9월 15일"),
  ]);
  const secondList = list([
    row("3936", title, "2026년 9월 15일"),
    row("3931", "풀무원, ‘출출박스’ 활용한 드론 배송 시범사업", "2026년 9월 10일"),
  ]);
  const detail = `<div class="news_titwrap02"><div class="news_indata"><span>2026년 9월 15일</span></div><div class="news_intit"><h1>${title}</h1></div></div><div class="news_cnt"><div class="txt_ty01"><p><img src="/webfile/webedit/20260914/photo.jpg"></p><p>식감혁신 본격 떡볶이를 출시했다.</p></div></div>`;
  const requested = [];
  const fetcher = async url => {
    requested.push(url);
    if (url.endsWith("listDataroom.do")) return html(firstList);
    if (url.endsWith("pageIndex=2")) return html(secondList);
    if (url.includes("id=3936")) return html(detail);
    throw new Error("출시와 무관한 상세 기사는 요청하면 안 됩니다.");
  };

  const products = await collectPulmuone(fetcher);
  assert.equal(requested.length, 3);
  assert.equal(requested.filter(url => url.includes("id=3936")).length, 1);
  assert.equal(products.length, 1);
  assert.equal(products[0].name, "식감혁신 본격 떡볶이");
  assert.equal(products[0].category, "meal");
  assert.equal(products[0].announcedDate, "2026-09-15");
  assert.equal(products[0].releaseDate, null);
  assert.equal(products[0].imageUrl, "https://news.pulmuone.co.kr/webfile/webedit/20260914/photo.jpg");
  assert.match(products[0].description, /식감혁신 본격 떡볶이를 출시했다/);
});

test("잘못된 날짜와 외부 이미지 주소는 채택하지 않는다", () => {
  assert.deepEqual(parsePulmuoneList(list([row("3936", "풀무원, ‘식감혁신 본격 떡볶이’ 출시", "2026년 2월 30일")])), []);
  const article = { id: "3936", title: "풀무원, ‘식감혁신 본격 떡볶이’ 출시", date: "2026-09-15", url: "https://news.pulmuone.co.kr/pulmuone/newsroom/viewNewsroom.do?menu=dataroom&id=3936" };
  const detail = `<div class="news_titwrap02"><div class="news_indata">2026년 9월 15일</div><div class="news_intit"><h1>${article.title}</h1></div></div><div class="news_cnt"><div class="txt_ty01"><img src="https://example.com/photo.jpg">식감혁신 본격 떡볶이를 출시했다.</div></div>`;
  assert.equal(parsePulmuoneDetail(detail, article)?.imageUrl, null);
});
