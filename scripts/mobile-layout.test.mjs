import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("모바일 목록·필터·검수 화면의 축소 계약을 유지한다",()=>{
 const css=readFileSync(new URL("../src/app/globals.css",import.meta.url),"utf8");
 assert.ok(css.includes(".filter-group{grid-template-columns:minmax(0,1fr)"));
 assert.ok(css.includes(".summary-scroll{overscroll-behavior-y:auto}"));
 assert.ok(css.includes(".week-date-tabs button>small{position:static"));
 const review=readFileSync(new URL("../chatgpt-site/app/globals.css",import.meta.url),"utf8");
 assert.ok(review.includes("@media(max-width:380px){.review-controls{grid-template-columns:minmax(0,1fr)}"));
 assert.ok(review.includes(".review-admin-list nav{flex-wrap:wrap"));
 const viewport=readFileSync(new URL("../src/components/summary-viewport.tsx",import.meta.url),"utf8");
 assert.ok(viewport.includes("80svh"));
});
