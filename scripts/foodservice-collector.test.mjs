import assert from "node:assert/strict";
import test from "node:test";
import { extractBurgerKingNewProducts, extractDominosNewProducts, extractGoobneNewProducts, extractKfcNewProducts, extractKyochonNewProducts, extractLotteriaNewProducts, extractMcDonaldsNewProducts, extractMomstouchNewProducts, extractPizzaHutNewProducts } from "./lib/foodservice-collector.ts";

const checkedAt = "2026-10-07T00:00:00.000Z";

test("롯데리아 공식 메뉴에서 NEW 배지가 있는 상품만 추출하고 중복을 제거한다", () => {
  const card = `<li><img src="https://img.lotteeatz.com/new.png" class="mn-card-img"><div class="mn-card-body" id="REP_1"><span class="mn-badge" aria-label="신메뉴">NEW</span><p class="mn-card-name">새 버거</p></div></li>`;
  const old = `<li><div class="mn-card-body" id="REP_2"><p class="mn-card-name">기존 버거</p></div></li>`;
  const products = extractLotteriaNewProducts(card + card + old, checkedAt);
  assert.equal(products.length, 1);
  assert.equal(products[0].category, "burger");
  assert.equal(products[0].name, "새 버거");
  assert.equal(products[0].price, null);
});

test("도미노피자 공식 메뉴에서 NEW 라벨과 상품 코드를 추출한다", () => {
  const html = `<li><a href="detail?code_01=RPZ1"><img data-src="https://cdn.dominos.co.kr/new.jpg"></a><div class="prd-cont"><div class="subject">새 피자<div class="label-box"><span class="label sale">NEW</span></div></div></div></li><li><a href="detail?code_01=RPZ2"></a><div class="prd-cont"><div class="subject">기존 피자<div class="label-box"></div></div></div></li>`;
  const products = extractDominosNewProducts(html, checkedAt);
  assert.equal(products.length, 1);
  assert.equal(products[0].category, "pizza");
  assert.equal(products[0].name, "새 피자");
  assert.equal(products[0].imageUrl, "https://cdn.dominos.co.kr/new.jpg");
});

test("굽네 공식 신제품 영역에서 NEW 상품을 상품군과 함께 추출한다", () => {
  const html = `<div class="swiper-slide"><img src="https://cdn.goob-ne.com/chicken.png"><div class="slide-info"><span>NEW</span><h2>새 치킨</h2><button onclick="menu_view(&quot;501&quot;)">제품상세보기</button></div></div><div class="swiper-slide"><div class="slide-info"><span>NEW</span><h2>[Event] 새 치킨</h2><button onclick="menu_view(&quot;502&quot;)">제품상세보기</button></div></div><div class="swiper-slide"><div class="slide-info"><span>NEW</span><h2>새 피자</h2><button onclick="menu_view(&quot;503&quot;)">제품상세보기</button></div></div>`;
  const products = extractGoobneNewProducts(html, checkedAt);
  assert.equal(products.length, 2);
  assert.equal(products[0].category, "chicken");
  assert.equal(products[0].subCategory, "치킨");
  assert.equal(products[0].name, "새 치킨");
  assert.equal(products[1].category, "pizza");
});

test("교촌 공식 신메뉴 전용 목록에서 치킨 상품을 추출한다", () => {
  const html = `<h2>신메뉴</h2><ul class="menuProduct"><li><a href="view.asp?id=41577&cg=2"><p class="img"><img src="/uploadFiles/honey.png" alt="허니갈릭윙콤비 제품 이미지"></p><dl class="txt"><dt>허니갈릭윙콤비</dt></dl></a></li></ul>`;
  const products = extractKyochonNewProducts(html, "2026-10-08T00:00:00.000Z");
  assert.equal(products.length, 1);
  assert.equal(products[0].slug, "kyochon-41577");
  assert.equal(products[0].brand, "교촌치킨");
  assert.equal(products[0].category, "chicken");
});

test("맥도날드는 최근 한 달 내 등록되고 현재 판매 중인 추천 버거만 추출한다", () => {
  const data = { resultObject: { list: [
    { seq: 1, korName: "새 버거 세트", regDate: "2026-September-15th", openTimeStart: "2026-09-17 00:00", openTimeEnd: "2026-10-21 23:59", exposureStatus: "menu,recommend", nameText: "버거", pcImageUrl: "/new.png" },
    { seq: 2, korName: "오래된 버거", regDate: "2026-June-1st", openTimeStart: "2026-06-01 00:00", openTimeEnd: "2026-12-31 23:59", exposureStatus: "menu,recommend", nameText: "버거" },
  ] } };
  const products = extractMcDonaldsNewProducts(data, checkedAt);
  assert.deepEqual(products.map(product => product.name), ["새 버거 세트"]);
});

test("버거킹은 최근 이미지 등록일의 NEW 단품 버거만 추출한다", () => {
  const data = { body: { allMenuList: [{ menuCategoryNm: "추천메뉴", menuInfo: [
    { menuCd: "1", menuNm: "새 와퍼", menuImgPath: "https://cdn/2026/09/20/a.png", menuFlagList: [{ menuFlagPk: "01" }] },
    { menuCd: "2", menuNm: "새 와퍼 세트", menuImgPath: "https://cdn/2026/09/20/b.png", menuFlagList: [{ menuFlagPk: "01" }] },
    { menuCd: "3", menuNm: "오래된 와퍼", menuImgPath: "https://cdn/2026/07/01/c.png", menuFlagList: [{ menuFlagPk: "01" }] },
  ] }] } };
  assert.deepEqual(extractBurgerKingNewProducts(data, checkedAt).map(product => product.name), ["새 와퍼"]);
});

test("맘스터치는 NEW 카드의 업로드 시각과 이름으로 버거·피자를 분류한다", () => {
  const recent = Math.floor(Date.parse("2026-09-20T00:00:00Z") / 1000);
  const html = `<li><a href="javascript:go_view('10');"><i class="new">NEW</i><figure><span style="background-image: url('/upload_file/product_info/${recent}-A.png')"></span></figure><h3><span></span>새 버거</h3></a></li><li><a href="javascript:go_view('11');"><i class="new">NEW</i><figure><span style="background-image: url('/upload_file/product_info/${recent}-B.png')"></span></figure><h3><span></span>새 피자</h3></a></li>`;
  assert.deepEqual(extractMomstouchNewProducts(html, checkedAt).map(product => product.category), ["burger", "pizza"]);
});

test("KFC는 최근 한 달 내 시작되어 진행 중인 신제품 행사 메뉴를 나눈다", () => {
  const state = [null, { listData: { rows: [{ event_index: 12, event_type_nm: "신제품", event_show: "Y", event_show_str_date: "2026-09-20 04:00:00", event_show_end_date: "2026-10-20 23:59:59", event_web_explan: "<p>2. 출시 메뉴 : 새 치킨, 새 통다리</p><p>3. 출시 채널 : 매장</p>", event_web_list_img: "/event/new.png" }] } }];
  const html = `<script>window.__INITIAL_COMPONENTS_STATE__ = ${JSON.stringify(state)}; window.__INITIAL_VUEX_STATE__ = {};</script>`;
  assert.deepEqual(extractKfcNewProducts(html, checkedAt).map(product => product.name), ["새 치킨", "새 통다리"]);
});

test("피자헛은 최근 한 달 내 판매를 시작한 주문 가능 NEW 피자만 추출한다", () => {
  const data = [{ digitalKey: "NEW1", rpstName: "새 피자", badge: "NEW", items: [{ saleStartDate: "2026-09-20T00:00:00+0900", saleEndDate: "2026-12-01T00:00:00+0900", orderable: "YES" }] }, { digitalKey: "OLD1", rpstName: "옛 피자", badge: "NEW", items: [{ saleStartDate: "2026-06-01T00:00:00+0900", saleEndDate: "2026-12-01T00:00:00+0900", orderable: "YES" }] }];
  assert.deepEqual(extractPizzaHutNewProducts(data, checkedAt).map(product => product.name), ["새 피자"]);
});
