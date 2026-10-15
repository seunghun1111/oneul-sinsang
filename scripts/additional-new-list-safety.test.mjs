import test from "node:test";
import assert from "node:assert/strict";
import {mergeCuProducts} from "./update-cu-products.ts";
import {mergeIcecreamProducts} from "./update-icecream-products.ts";
import {guardEmptyNewLists} from "./lib/new-list-safety.ts";
import {brandCollectionFailures} from "./lib/brand-collection-run.ts";
test("CU·배스킨라빈스 전체 0건은 기존 데이터와 상태를 그대로 보존한다",()=>{
 for(const [brand,merge] of [["CU",mergeCuProducts],["배스킨라빈스",mergeIcecreamProducts]]) {
  const existing=[{id:"existing",brand,isActive:true,name:"상품",reviewEvidence:{explicitNew:true}}];
  assert.equal(merge(existing,[],"2026-10-16"),existing);
  assert.deepEqual(merge([],[],"2026-10-16"),[]);
 }
});
test("추가 치킨 브랜드의 갑작스러운 0건은 구체적 사유와 함께 알린다",()=>{
 for(const brand of ["bhc","푸라닭","네네치킨"]) {
  const guarded=guardEmptyNewLists([{brand,isActive:true}],[],{checkedAt:"2026-10-16",results:[{brand,status:"success",newCount:0}]});
  assert.equal(guarded.results[0].status,"failed");
  assert.match(brandCollectionFailures(guarded,"추가 브랜드")[0],/갑자기 0건/);
 }
});
test("NEW 확인 결과가 있으면 배스킨라빈스의 정상 교체는 계속 반영한다",()=>{
 const brand="배스킨라빈스";
 const previous={id:"old",brand,name:"이전맛",normalizedName:"old",isActive:true,sourceType:"official_site",firstDetectedAt:"2026-10-01",lastCheckedAt:"2026-10-15"};
 const candidate={slug:"new",brand,name:"새맛",normalizedName:"new",category:"icecream",productType:"new",sourceType:"official_site",sourceUrl:"https://www.baskinrobbins.co.kr/menu/fom.php",description:"공식 NEW",releaseDate:"2026-10-01",announcedDate:"2026-10-01"};
 const merged=mergeIcecreamProducts([previous],[candidate],"2026-10-16");
 assert.equal(merged.find(p=>p.id==="old").newStatus,"removed");
 assert.equal(merged.find(p=>p.id==="new").isActive,true);
});
