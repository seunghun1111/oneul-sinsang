import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {FAVORITES_KEY} from "../src/lib/favorites.ts";
import {validateFavoritesBackup,mergeFavoritesBackup,importFavoritesBackup,readFavoritesBackup,FAVORITES_BACKUP_MAX_BYTES} from "../src/lib/favorites-backup.ts";
const sample={version:1,products:["old"],brands:["브랜드"]};
test("백업은 엄격한 버전·배열·문자열·용량 검사를 통과해야 한다",()=>{
 for(const value of [null,[],{...sample,version:2},{...sample,products:[1]},{...sample,brands:[" "]},{...sample,products:["x".repeat(257)]},{...sample,products:Array(2001).fill("a")}])assert.throws(()=>validateFavoritesBackup(JSON.stringify(value)));
 assert.throws(()=>validateFavoritesBackup("x".repeat(FAVORITES_BACKUP_MAX_BYTES+1)));
 assert.throws(()=>validateFavoritesBackup("broken"));
});
test("합치기는 중복을 제거하고 기존·미노출 기록을 모두 보존한다",()=>{
 const incoming={version:1,products:["new","old","not-public"],brands:["다른 브랜드","브랜드"]};
 assert.deepEqual(mergeFavoritesBackup(sample,incoming),{version:1,products:["old","new","not-public"],brands:["브랜드","다른 브랜드"]});
 assert.deepEqual(sample.products,["old"]);
 const full={...sample,products:Array.from({length:2000},(_,i)=>String(i))};
 assert.throws(()=>mergeFavoritesBackup(full,incoming));assert.equal(full.products.length,2000);
});
test("내보내기는 ID·브랜드만 포함하고 미지의 속성을 전파하지 않는다",()=>{
 const storage={getItem:key=>{assert.equal(key,FAVORITES_KEY);return JSON.stringify({...sample,token:"not-exported",url:"https://example.com"});}};
 assert.deepEqual(readFavoritesBackup(storage),sample);
 assert.deepEqual(readFavoritesBackup({getItem:()=>null}),{version:1,products:[],brands:[]});
});
test("읽기·쓰기 오류와 잘못된 파일은 기존 기록을 덮어쓰지 않는다",()=>{
 let raw=JSON.stringify(sample),writes=0;
 const storage={getItem:()=>raw,setItem:(_key,value)=>{writes++;raw=value;}};
 const before=raw;
 assert.throws(()=>importFavoritesBackup(storage,"broken"));assert.equal(writes,0);
 assert.throws(()=>importFavoritesBackup({...storage,getItem:()=>{throw Error("blocked");}},JSON.stringify(sample)));
 assert.throws(()=>importFavoritesBackup({...storage,setItem:()=>{throw Error("quota");}},JSON.stringify(sample)));
 assert.equal(raw,before);
 assert.throws(()=>importFavoritesBackup({...storage,getItem:()=>"broken"},JSON.stringify(sample)));assert.equal(writes,0);
});
test("적용 시 저장소를 다시 읽어 다른 탭에서 추가한 기록을 보존한다",()=>{
 let raw=JSON.stringify({...sample,products:["another-tab"]});
 const result=importFavoritesBackup({getItem:()=>raw,setItem:(key,value)=>{assert.equal(key,FAVORITES_KEY);raw=value;}},JSON.stringify(sample));
 assert.deepEqual(result.products,["another-tab","old"]);assert.deepEqual(JSON.parse(raw),result);
});
test("미리보기 후 명시적 합치기·취소 및 로컬 전용 처리를 제공한다",()=>{
 const ui=readFileSync(new URL("../src/components/favorites-backup.tsx",import.meta.url),"utf8");
 for(const marker of ["기존 목록과 합쳐 가져오기","취소","file.size>","revision.current","role=\"alert\"","URL.revokeObjectURL","판매 종료를 의미하지 않습니다"])assert.ok(ui.includes(marker));
 assert.doesNotMatch(ui,/fetch\(|dangerouslySetInnerHTML/);
});
