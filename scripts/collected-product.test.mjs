import test from "node:test";
import assert from "node:assert/strict";
import {normalizeImageUrl,normalizeCollectedProduct,auditCollectedImages} from "./lib/collected-product.ts";
import {mergeProducts} from "./update-static-products.ts";
import {mergeCoffeeProducts} from "./update-coffee-products.ts";
const sourceUrl="https://official.example.com/menu/1";
const imageUrl="https://cdn.example.com/product.jpg";
test("공통 이미지 정책은 상대 경로를 정규화하고 비밀값·내부망·제한 도메인을 거부한다",()=>{
 assert.equal(normalizeImageUrl("/a.jpg?x=1&amp;y=2",sourceUrl),"https://official.example.com/a.jpg?x=1&y=2");
 for(const value of ["javascript:alert(1)","data:image/png;base64,abc","http://example.com/a.jpg","https://user:pass@example.com/a.jpg","https://127.0.0.1/a","https://192.168.1.1/a","https://[::1]/a","https://img.kakao.com/a","https://test.local/a"])
   assert.equal(normalizeImageUrl(value,sourceUrl),undefined);
});
test("모든 브랜드 저장 경계에서 이미지 보존·검수 기록·발견일·가격 제외 정책을 공유한다",()=>{
 for(const brand of ["CU","세븐일레븐","롯데리아","교촌치킨","배스킨라빈스","네네치킨","스타벅스","빽다방"]){
  const previous={id:"old",brand,name:"상품",normalizedName:"상품",sourceUrl,sourceType:"official_site",imageUrl,firstDetectedAt:"2026-10-01",createdAt:"2026-10-01",reviewStatus:"approved",reviewedAt:"2026-10-02",detectionKind:"initial",isActive:true};
  const next={...previous,id:"new",imageUrl:undefined,price:1000,firstDetectedAt:"2026-10-16",createdAt:"2026-10-16",reviewStatus:"pending"};
  const merged=normalizeCollectedProduct(next,previous);
  assert.equal(merged.imageUrl,imageUrl);assert.equal(merged.id,"old");assert.equal(merged.firstDetectedAt,"2026-10-01");assert.equal(merged.reviewStatus,"approved");assert.equal(merged.reviewedAt,"2026-10-02");assert.equal("price" in merged,false);
  assert.equal(mergeCoffeeProducts([previous],[next],"2026-10-16")[0].imageUrl,imageUrl);
  const candidate={...next,slug:"old",productType:"new",announcedDate:"2026-10-16",category:"etc",releaseDate:null,description:"공식 NEW"};
  assert.equal(mergeProducts([previous],[candidate],"2026-10-16")[0].imageUrl,imageUrl);
 }
});
test("공통 누락 점검은 브랜드별 집계하며 보도 사진과 종료 상품은 별도 정책으로 제외한다",()=>{
 const base={brand:"테스트",sourceUrl,sourceType:"official_site",isActive:true};
 assert.deepEqual(auditCollectedImages([{...base,imageUrl},{...base},{...base,isActive:false},{...base,sourceType:"press_release"}]),[{brand:"테스트",officialProducts:2,withImage:1,missingImage:1}]);
 assert.equal(normalizeCollectedProduct({...base,imageUrl,sourceType:"press_release"}).imageUrl,undefined);
});
