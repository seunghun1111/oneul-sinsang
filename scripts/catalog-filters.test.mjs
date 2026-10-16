import test from "node:test";
import assert from "node:assert/strict";
import {catalogScope,catalogSubcategory,catalogSubcategoryOptions,unclassifiedSubcategory} from "../src/lib/catalog-filters.ts";
const products=[
 {brand:"스타벅스",category:"cafe",subCategory:"음료"},
 {brand:"스타벅스",category:"cafe",subCategory:"푸드"},
 {brand:"스타벅스",category:"cafe",subCategory:"MD"},
 {brand:"이디야",category:"cafe",subCategory:"음료"},
 {brand:"CU",category:"convenience",subCategory:"과자류"},
 {brand:"CU",category:"convenience"},
 {brand:"교촌",category:"chicken",subCategory:"치킨"},
];
test("상품군 전체 상태에서도 선택 브랜드의 세부 카테고리가 표시된다",()=>{
 const options=catalogSubcategoryOptions(products,"all","스타벅스");
 assert.deepEqual(new Set(options.map(p=>p.value)),new Set(["음료","푸드","MD"]));
 assert.equal(options.every(p=>p.count===1),true);
 for(const sub of options){const selected=catalogScope(products,"all","스타벅스").filter(p=>catalogSubcategory(p)===sub.value);assert.equal(selected.length,1);}
});
test("모든 상품군에 동일하게 적용하고 다른 브랜드나 대분류를 섞지 않는다",()=>{
 assert.deepEqual(catalogSubcategoryOptions(products,"convenience","CU").map(p=>p.value).sort(),[unclassifiedSubcategory,"과자류"].sort());
 assert.equal(catalogSubcategoryOptions(products,"cafe","all").find(p=>p.value==="음료").count,2);
 assert.equal(catalogSubcategoryOptions(products,"chicken","교촌")[0].label,"치킨");
 assert.deepEqual(catalogSubcategoryOptions(products,"pizza","all"),[]);
 assert.deepEqual(catalogSubcategoryOptions([{brand:"X",category:"etc"}],"all","all"),[]);
});
