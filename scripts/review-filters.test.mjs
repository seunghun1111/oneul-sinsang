import test from "node:test";
import assert from "node:assert/strict";
import {subCategoryOptions,filterReviewProducts,uncategorized} from "../chatgpt-site/lib/review/filters.ts";
const products=[
 {id:"1",brand:"스타벅스",category:"cafe",subCategory:"음료",name:"라떼",reviewStatus:"approved",automationAction:"publish"},
 {id:"2",brand:"스타벅스",category:"cafe",subCategory:"MD",name:"머그",reviewStatus:"pending",automationAction:"observe"},
 {id:"3",brand:"이디야",category:"cafe",subCategory:"음료",name:"커피",reviewStatus:"approved",automationAction:"publish"},
 {id:"4",brand:"CU",category:"convenience",subCategory:"음료",name:"우유",reviewStatus:"approved",automationAction:"publish"},
 {id:"5",brand:"CU",category:"convenience",name:"상품",reviewStatus:"pending",automationAction:"observe"},
];
const all={category:"all",subCategory:"all",brand:"all",status:"all",action:"all",query:""};
test("세부 카테고리는 대분류·브랜드별 실제 상품과 건수로 구성한다",()=>{
 assert.deepEqual(Object.fromEntries(subCategoryOptions(products,"cafe","스타벅스").map(x=>[x.value,x.count])),{MD:1,"음료":1});
 assert.equal(subCategoryOptions(products,"cafe").find(x=>x.value==="음료").count,2);
 assert.ok(subCategoryOptions(products,"convenience").some(x=>x.value===uncategorized));
});
test("같은 이름의 세부 분류도 대분류 경계와 나머지 검수 필터를 지킨다",()=>{
 assert.deepEqual(filterReviewProducts(products,{...all,category:"cafe",subCategory:"음료",brand:"스타벅스",status:"approved",action:"publish",query:" 라떼 "}).map(x=>x.id),["1"]);
 assert.deepEqual(filterReviewProducts(products,{...all,category:"cafe",subCategory:"MD",action:"observe"}).map(x=>x.id),["2"]);
 assert.deepEqual(filterReviewProducts(products,{...all,subCategory:uncategorized}).map(x=>x.id),["5"]);
 assert.equal(filterReviewProducts(products,all).length,5);
});
