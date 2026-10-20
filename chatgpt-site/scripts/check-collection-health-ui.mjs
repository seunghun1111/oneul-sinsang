import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {readFile} from "node:fs/promises";
import {createServer} from "node:http";
const require=createRequire(import.meta.url);
const {build}=require("esbuild");
const result=await build({stdin:{contents:`import React from "react";import {renderToStaticMarkup} from "react-dom/server";import {CollectionHealthPanel} from "./app/review/collection-health-panel";export function render(props){return renderToStaticMarkup(React.createElement(CollectionHealthPanel,props));}`,resolveDir:fileURLToPath(new URL("..",import.meta.url)),loader:"tsx"},bundle:true,format:"cjs",platform:"node",write:false,jsx:"automatic",logLevel:"silent"});
const compiled={exports:{}};
new Function("module","exports","require",result.outputFiles[0].text)(compiled,compiled.exports,require);
const now=new Date().toISOString();
const base={group:"coffee",groupLabel:"카페",reason:"확인 사유"};
const health={version:1,generatedAt:now,rows:[{...base,id:"a",brand:"정상브랜드",status:"success",checkedAt:now,lastSuccessfulAt:now,newCount:0},{...base,id:"b",brand:"이상브랜드",status:"failed",checkedAt:now,reason:"기존 NEW가 갑자기 0건입니다."},{...base,id:"c",brand:"미확인브랜드",status:"not_checked"}]};
health.rows[1].lastFailedAt=now;
health.rows[1].diagnostics={attempts:2,initialCodes:["timeout"],failures:[{stage:"product_request",httpStatus:503}],categories:[{label:"음료",complete:true,pages:2,requests:3,newCount:4,holdReason:"sharp_drop"},{label:"과자류",complete:false,pages:10,requests:10,newCount:12,holdReason:"page_limit"},{label:"간편식사",complete:true,pages:3,requests:3,newCount:17}]};
const html=compiled.exports.render({health,error:"",loading:false});
for(const text of ["수집 운영 현황","정상브랜드","이상브랜드","미확인브랜드","마지막 정상 확인","갑자기 0건","수집 그룹","수집 브랜드 검색","확인 필요만"])assert.ok(html.includes(text),text);
for(const text of ["상세 진단","최근 실패 확인","재시도 1회","상품 요청","HTTP 503","상품 수 급감","페이지 상한 도달","페이지 수집 미완료","이전 형식의 기록"])assert.ok(html.includes(text),text);
assert.ok(html.includes('scope="col"'));assert.ok(html.includes('scope="row"'));
assert.ok(compiled.exports.render({health:null,error:"운영 현황 조회 실패",loading:false}).includes('role="alert"'));
assert.ok(compiled.exports.render({health:null,error:"",loading:true}).includes("조회 중"));
console.log("운영 현황 UI 렌더 검증 통과: 정상·실패·기록 없음·오류·로딩·표 접근성");
if(process.argv.includes("--preview")){
 const client=await build({stdin:{contents:`import React from "react";import {createRoot} from "react-dom/client";import {CollectionHealthPanel} from "./app/review/collection-health-panel";createRoot(document.getElementById("root")).render(<CollectionHealthPanel health={${JSON.stringify(health)}} error="" loading={false}/>);`,resolveDir:fileURLToPath(new URL("..",import.meta.url)),loader:"tsx"},bundle:true,format:"iife",platform:"browser",write:false,jsx:"automatic",logLevel:"silent"});
 const css=(await readFile(new URL("../app/globals.css",import.meta.url),"utf8")).replace(/@import[^;]+;/g,"");
 const page=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>수집 진단 로컬 검증</title><style>${css}body{padding:20px;background:#f7f5ee;font-family:Arial,sans-serif;color:#18332a}main{max-width:1180px;margin:auto}select,input{padding:10px;border:1px solid #ccd8d0;border-radius:6px}</style><main><h1>수집 운영 현황 · 로컬 QA</h1><p>가상 진단 데이터입니다. 운영 상품·API·인증에 접근하지 않습니다.</p><div id="root"></div></main><script>${client.outputFiles[0].text}</script></html>`;
 createServer((req,res)=>{res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});res.end(page);}).listen(3197,"127.0.0.1",()=>console.log("Local: http://127.0.0.1:3197"));
}
