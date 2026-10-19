import test from "node:test";
import assert from "node:assert/strict";
import {productInCategoryGroup} from "../src/lib/category-groups.ts";
import {coverageSummary} from "../src/lib/collection-coverage.ts";
const cu={id:"same-id",brand:"CU",category:"convenience",sourceUrl:"https://cu.bgfretail.com/product/view.do?gdIdx=1",subCategory:"과자류",firstDetectedAt:"2026-10-01"};
test("공식 CU 분류는 편의점과 용도별 메뉴에 함께 노출하고 기록을 변경하지 않는다",()=>{
 for(const [sub,slug] of [["간편식사","meal"],["즉석조리","meal"],["과자류","snack"],["아이스크림","snack"],["음료","drink"],["생활용품","drink"]]){
  const item={...cu,subCategory:sub},before=structuredClone(item);assert.equal(productInCategoryGroup(item,"convenience"),true);assert.equal(productInCategoryGroup(item,slug),true);assert.deepEqual(item,before);
 }
});
test("포괄적 식품·다른 브랜드·위조 출처·이름만으로 교차 분류하지 않는다",()=>{
 for(const item of [{...cu,subCategory:"식품",name:"라면 도시락 음료"},{...cu,brand:"세븐일레븐"},{...cu,sourceUrl:"https://cu.bgfretail.com.evil.example/menu"},{...cu,category:"cafe"}])assert.equal(productInCategoryGroup(item,"snack"),false);
 assert.equal(productInCategoryGroup(cu,"missing"),false);
});
const now=Date.parse("2026-10-19T09:00:00Z"),row={id:"coffee:A",brand:"A",group:"coffee",groupLabel:"카페",status:"success",checkedAt:"2026-10-19T00:00:00Z",newCount:0};
test("정상 0건·후보 미공개·실패·부분 실패·미기록·오래된 기록을 구분한다",()=>{
 assert.match(coverageSummary(row,[],now).label,/공개 NEW 0개/);
 assert.match(coverageSummary({...row,newCount:2},[],now).label,/후보 수집됨/);
 assert.match(coverageSummary({...row,status:"failed"},[],now).label,/상품 없음으로 판단 불가/);
 assert.equal(coverageSummary({...row,status:"partial"},[],now).state,"partial");
 for(const checkedAt of [undefined,"broken","2099-01-01"])assert.equal(coverageSummary({...row,checkedAt},[],now).state,"unknown");
 assert.equal(coverageSummary({...row,checkedAt:"2026-10-16T00:00:00Z"},[],now).state,"stale");
 assert.match(coverageSummary({...row,newCount:undefined},[],now).label,/건수 미확인/);
});
test("등록 경로가 아닌 실제 공개 분류를 집계하고 발표·메뉴 보고서를 섞지 않는다",()=>{
 const products=[{brand:"A",category:"cafe",subCategory:"음료",sourceType:"official_site"},{brand:"A",category:"cafe",subCategory:"MD",sourceType:"official_site"},{brand:"B",category:"cafe",subCategory:"푸드",sourceType:"official_site"}];
 assert.deepEqual(new Set(coverageSummary(row,products,now).observed),new Set(["MD","음료"]));
 assert.equal(coverageSummary({...row,group:"press"},products,now).publishedCount,0);
});
