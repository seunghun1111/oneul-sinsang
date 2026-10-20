import assert from "node:assert/strict";
import test from "node:test";
import { mergeCuProducts } from "./update-cu-products.ts";

const candidate = (id, name) => ({
  slug: id, brand: "CU", name, normalizedName: name, category: "convenience", subCategory: "음료",
  productType: "new", price: null, retailer: "CU", releaseDate: null, announcedDate: "2026-10-06",
  description: "CU 공식 전체상품의 음료 최신등록순에서 NEW 배지가 확인된 상품",
  sourceUrl: `https://cu.bgfretail.com/product/view.do?category=product&gdIdx=${id.slice(3)}`,
  sourceType: "official_site", imageUrl: "https://cdn.example.com/product.jpg",
});

test("CU는 다른 한국 날짜의 정상 수집에서 두 번 누락될 때만 제외한다", () => {
  const checkedAt = "2026-10-06T00:00:00.000Z";
  const previous = mergeCuProducts([], [candidate("cu-1", "이전상품")], "2026-10-05T00:00:00.000Z");
  const updated = mergeCuProducts(previous, [candidate("cu-2", "신상품")], checkedAt);
  assert.equal(updated.find(product => product.id === "cu-1")?.isActive, true);
  assert.equal(updated.find(product => product.id === "cu-1")?.cuMissingChecks, 1);
  const sameDay=mergeCuProducts(updated,[candidate("cu-2","신상품")],"2026-10-06T01:00:00.000Z");
  assert.equal(sameDay.find(p=>p.id==="cu-1").cuMissingChecks,1);
  const next=mergeCuProducts(sameDay,[candidate("cu-2","신상품")],"2026-10-07T00:00:00.000Z");
  assert.equal(next.find(p=>p.id==="cu-1").isActive,false);
  assert.equal(next.find(p=>p.id==="cu-1").availabilityStatus,"unknown");
  assert.equal(updated.find(product => product.id === "cu-2")?.isActive, true);
});
test("CU 재등장은 누락을 초기화하고 빈 목록·과거 제외 상품은 보존한다",()=>{
 const initial=mergeCuProducts([],[candidate("cu-1","이전")],"2026-10-05T00:00:00Z");
 const missing=mergeCuProducts(initial,[candidate("cu-2","신상")],"2026-10-06T00:00:00Z");
 assert.deepEqual(mergeCuProducts(missing,[],"2026-10-07T00:00:00Z"),missing);
 const seen=mergeCuProducts(missing,[candidate("cu-1","이전"),candidate("cu-2","신상")],"2026-10-07T00:00:00Z");
 assert.equal(seen.find(p=>p.id==="cu-1").cuMissingChecks,0);
 const removed=initial.map(p=>({...p,isActive:false,newStatus:"removed"}));
 assert.equal(mergeCuProducts(removed,[candidate("cu-2","신상")],"2026-10-08T00:00:00Z").find(p=>p.id==="cu-1").isActive,false);
});
test("CU 누락 일자는 UTC가 아닌 한국 자정으로 구분한다",()=>{
 const initial=mergeCuProducts([],[candidate("cu-1","이전")],"2026-10-05T00:00:00Z");
 const first=mergeCuProducts(initial,[candidate("cu-2","신상")],"2026-10-06T14:59:00Z");
 const nextDay=mergeCuProducts(first,[candidate("cu-2","신상")],"2026-10-06T15:01:00Z");
 assert.equal(nextDay.find(p=>p.id==="cu-1").isActive,false);
});
