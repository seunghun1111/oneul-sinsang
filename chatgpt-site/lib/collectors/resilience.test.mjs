import assert from "node:assert/strict";
import test from "node:test";
import { collectBinggrae, parseBinggraeDetail } from "./binggrae.ts";
import { collectOrion } from "./orion.ts";

const html = body => new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } });

test("빙그레 상세 기사 한 건이 실패해도 다음 신상품을 수집한다", async () => {
  const list = `<li class="td_line"><a href="/news/news_announced_view?anno_idx=1">‘메로나 초코’ 출시</a><div class="date">2026-09-01</div></li>
    <li class="td_line"><a href="/news/news_announced_view?anno_idx=2">‘식후관리 워터’ 출시</a><div class="date">2026-09-02</div></li>`;
  const detail = `<span class="tit">‘식후관리 워터’ 출시</span><p class="date">2026-09-02</p>
    <div class="txt_box">식후관리 워터를 출시했다.</div>`;
  const fetcher = async url => {
    if (url.endsWith("news_announced")) return html(list);
    if (url.endsWith("anno_idx=1")) throw new Error("temporary failure");
    return html(detail);
  };

  const products = await collectBinggrae(fetcher);
  assert.equal(products.length, 1);
  assert.equal(products[0].name, "식후관리 워터");
  assert.equal(products[0].announcedDate, "2026-09-02");
});

test("오리온 상세 기사 한 건이 실패해도 다음 신상품을 수집한다", async () => {
  const list = `<div class="list-wrap"><ul>
    <li><a href="/board/view/87?boardno=1">첫 기사</a><span class="date">2026.09.01</span></li>
    <li><a href="/board/view/87?boardno=2">둘째 기사</a><span class="date">2026.09.03</span></li>
    </ul></div>`;
  const detail = `<div class="press-view"><h4>오리온, ‘포카칩 황치즈맛’ 출시</h4>
    <p class="date">2026-09-03</p><div class="content">포카칩 황치즈맛을 출시했다.</div>
    <div class="btn-wrap"></div></div>`;
  const fetcher = async url => {
    if (url.endsWith("/board/list/87")) return html(list);
    if (url.includes("boardno=1")) throw new Error("temporary failure");
    return html(detail);
  };

  const products = await collectOrion(fetcher);
  assert.equal(products.length, 1);
  assert.equal(products[0].name, "포카칩 황치즈맛");
  assert.equal(products[0].announcedDate, "2026-09-03");
});

test("상세 기사를 전혀 읽지 못하면 수집 실패를 보고한다", async () => {
  const list = `<li class="td_line"><a href="/news/news_announced_view?anno_idx=1">‘메로나 초코’ 출시</a><div class="date">2026-09-01</div></li>`;
  const fetcher = async url => url.endsWith("news_announced") ? html(list) : Promise.reject(new Error("temporary failure"));
  await assert.rejects(collectBinggrae(fetcher), /모두 읽지 못했습니다/);
});

test("빙그레 출시 기념 기사는 새 상품으로 수집하지 않는다", async () => {
  const list = `<li class="td_line"><a href="/news/news_announced_view?anno_idx=1">‘메로나 초코’ 출시 100일 기념 행사</a><div class="date">2026-09-02</div></li>
    <li class="td_line"><a href="/news/news_announced_view?anno_idx=2">‘식후관리 워터’ 출시</a><div class="date">2026-09-03</div></li>`;
  const detail = `<span class="tit">‘식후관리 워터’ 출시</span><p class="date">2026-09-03</p>
    <div class="txt_box">식후관리 워터를 출시했다.</div>`;
  const requested = [];
  const fetcher = async url => {
    requested.push(url);
    if (url.endsWith("news_announced")) return html(list);
    if (url.endsWith("anno_idx=2")) return html(detail);
    throw new Error("출시 기념 기사는 요청하면 안 됩니다.");
  };

  const products = await collectBinggrae(fetcher);
  assert.deepEqual(requested.map(url => new URL(url).searchParams.get("anno_idx")).filter(Boolean), ["2"]);
  assert.deepEqual(products.map(product => product.name), ["식후관리 워터"]);
});

test("빙그레 기사 이미지 주소가 잘못돼도 상품 정보는 유지한다", () => {
  const article = { id: "3", title: "‘식후관리 워터’ 출시", date: "2026-09-03", url: "https://www.bing.co.kr/news/news_announced_view?anno_idx=3" };
  const detail = `<span class="tit">‘식후관리 워터’ 출시</span><p class="date">2026-09-03</p>
    <div class="txt_box">식후관리 워터를 출시했다. <img alt="식후관리 워터" src="http://["></div>`;
  const product = parseBinggraeDetail(detail, article);
  assert.equal(product?.name, "식후관리 워터");
  assert.equal(product?.imageUrl, null);
});
