import test from "node:test";
import assert from "node:assert/strict";
import {discoveryEvidence,portalSearchLinks,safeEvidenceUrl} from "../chatgpt-site/lib/review/discovery-evidence.ts";
const p={brand:"교촌치킨",name:"허니갈릭 & 윙",category:"chicken",sourceUrl:"https://www.kyochon.com/menu/chicken.asp?code=21",firstDetectedAt:"2026-10-08",releaseDate:"2026-01-01",availabilityStatus:"on_sale"};
test("출시일 불명확 시 최초 발견일을 사용하고 판매 상태를 추정하지 않는다",()=>{
 const e=discoveryEvidence(p);assert.equal(e.date,"2026-10-08");assert.equal(e.dateLabel,"최초 발견일");assert.equal(e.saleLabel,"판매 여부 미확인");
 const verified=discoveryEvidence({...p,reviewEvidence:{officialDate:"2026-10-01",dateKind:"launch"}});assert.equal(verified.dateLabel,"공식 출시일");
});
test("출시·판매 검색과 확인 근거를 분리하고 후보로 승인하지 않는다",()=>{
 const e=discoveryEvidence({...p,discoveryReferences:[{kind:"sale",url:"https://example.com/item",checkedAt:"2026-10-16",verified:false}]});assert.match(e.saleLabel,/후보/);assert.equal(e.newLabel,"공식 근거 참조");
 const links=portalSearchLinks(p);assert.equal(new URL(links[0].url).searchParams.get("query"),"교촌치킨 허니갈릭 & 윙 출시 신메뉴");assert.match(new URL(links[1].url).searchParams.get("query"),/공식 메뉴 주문/);
});
test("안전하지 않은 참고 주소를 노출하지 않는다",()=>{
 for(const url of ["javascript:alert(1)","http://example.com","https://a:b@example.com","https://127.0.0.1/x","https://kakao.com/x"])assert.equal(safeEvidenceUrl(url),null);
 assert.equal(discoveryEvidence({...p,discoveryReferences:[{kind:"sale",url:"javascript:alert(1)",checkedAt:"2026-10-16",verified:true}]}).references.length,0);
});
