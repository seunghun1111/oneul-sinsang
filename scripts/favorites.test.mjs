import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {emptyFavorites,parseFavorites,toggleFavorite,matchesFavorite,persistFavorite,FAVORITES_KEY} from "../src/lib/favorites.ts";
test("관심 기록은 버전·자료형을 검사하고 중복·잘못된 항목을 제외한다",()=>{
 for(const raw of [null,"bad","null",'{"version":2,"products":["a"]}'])assert.deepEqual(parseFavorites(raw),emptyFavorites());
 assert.deepEqual(parseFavorites(JSON.stringify({version:1,products:["a","a",1,null,""],brands:["브랜드",{}]})),{version:1,products:["a"],brands:["브랜드"]});
});
test("상품과 브랜드는 독립적으로 저장·해제되고 입력을 변경하지 않는다",()=>{
 const before=emptyFavorites(),one=toggleFavorite(before,"products","p"),two=toggleFavorite(one,"brands","브랜드");
 assert.deepEqual(before,emptyFavorites());assert.deepEqual(two.products,["p"]);assert.deepEqual(two.brands,["브랜드"]);
 assert.deepEqual(toggleFavorite(two,"products","p").products,[]);assert.deepEqual(parseFavorites(JSON.stringify(two)),two);
});
test("상품 ID와 브랜드 완전 일치를 구분하고 삭제된 상품 기록을 임의 삭제하지 않는다",()=>{
 const f={version:1,products:["a","removed"],brands:["A"]};
 assert.equal(matchesFavorite({id:"a",brand:"B"},f,"products"),true);assert.equal(matchesFavorite({id:"b",brand:"A"},f,"products"),false);
 assert.equal(matchesFavorite({id:"b",brand:"A"},f,"brands"),true);assert.equal(matchesFavorite({id:"b",brand:"AA"},f,"brands"),false);assert.ok(f.products.includes("removed"));
});
test("저장 한도에서는 기존 기록을 밀어내지 않고 새 저장만 거부한다",()=>{
 const full={version:1,products:Array.from({length:2000},(_,i)=>String(i)),brands:[]};
 assert.throws(()=>toggleFavorite(full,"products","extra"));assert.equal(full.products.length,2000);assert.equal(toggleFavorite(full,"products","0").products.length,1999);
});
test("브라우저 저장 실패를 처리하며 다른 탭·같은 화면 갱신과 구독 정리를 제공한다",()=>{
 const source=readFileSync(new URL("../src/components/use-favorites.ts",import.meta.url),"utf8");
 for(const text of ["useSyncExternalStore","persistFavorite(window.localStorage","dispatchEvent","storage","removeEventListener","catch{return false;}"])assert.ok(source.includes(text));
 assert.ok(!source.includes("fetch("));
});
test("저장 성공 후에만 변경을 반환하고 읽기·쓰기 실패를 성공으로 위장하지 않는다",()=>{
 let raw=JSON.stringify({version:1,products:["old"],brands:[]});
 const storage={getItem:key=>{assert.equal(key,FAVORITES_KEY);return raw;},setItem:(key,value)=>{assert.equal(key,FAVORITES_KEY);raw=value;}};
 assert.equal(persistFavorite(storage,"products","new"),true);assert.deepEqual(parseFavorites(raw).products,["new","old"]);
 const before=raw;
 assert.equal(persistFavorite({...storage,setItem:()=>{throw Error("quota");}},"products","lost"),false);assert.equal(raw,before);
 assert.equal(persistFavorite({...storage,getItem:()=>{throw Error("blocked");}},"products","lost"),false);assert.equal(raw,before);
});
