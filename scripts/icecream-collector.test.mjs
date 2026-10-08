import assert from "node:assert/strict";
import test from "node:test";
import { extractBaskinRobbinsAnnouncement, extractBaskinRobbinsNewProducts } from "./lib/icecream-collector.ts";

const checkedAt = "2026-10-08T00:00:00.000Z";

test("배스킨라빈스 공식 공지 목록에서 최신 FOM 아이스크림 출시일을 찾는다", () => {
  const html = `<tr class="board-list__table-list"><td class="board-list__table-title"><a href="/information-center/notice/view.php?seq=1475">[10월 FOM] 신제품 2종 아이스크림 출시</a></td><td class="board-list__table-date">2026.10.01</td></tr>`;
  assert.deepEqual(extractBaskinRobbinsAnnouncement(html), {
    sourceUrl: "https://www.baskinrobbins.co.kr/information-center/notice/view.php?seq=1475",
    date: "2026-10-01", title: "[10월 FOM] 신제품 2종 아이스크림 출시",
  });
});

test("배스킨라빈스 이달의 신제품 카드에서 이름과 공식 이미지를 추출한다", () => {
  const html = `<article class="menu-fom-new"><div class="swiper-slide"><a href="https&#58;//baskinrobbins.co.kr/menu/view.php?seq=1165"><img src="/upload/new.png" class="menu-fom-new__image"><h5 class="menu-fom-new__name">몬스터 크런치 쿠키</h5></a></div></article>`;
  const products = extractBaskinRobbinsNewProducts(html, { sourceUrl: "https://www.baskinrobbins.co.kr/notice", date: "2026-10-01" }, checkedAt);
  assert.equal(products.length, 1);
  assert.equal(products[0].category, "icecream");
  assert.equal(products[0].imageUrl, "https://www.baskinrobbins.co.kr/upload/new.png");
  assert.equal(products[0].releaseDate, "2026-10-01");
});
