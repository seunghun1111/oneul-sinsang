"use client";
import {useRef,useState} from "react";
import {useFavorites} from "./use-favorites";
import {FAVORITES_BACKUP_MAX_BYTES,validateFavoritesBackup} from "@/lib/favorites-backup";
export function FavoritesBackup({products}:{products:{id:string;brand:string;name:string}[]}){
 const {favorites,toggle,importBackup,exportBackup}=useFavorites();
 const [pending,setPending]=useState<string|null>(null),[message,setMessage]=useState(""),[error,setError]=useState("");
 const revision=useRef(0);
 const ids=new Set(products.map(product=>product.id)),brands=new Set(products.map(product=>product.brand));
 const missing=favorites.products.filter(id=>!ids.has(id)),missingBrands=favorites.brands.filter(brand=>!brands.has(brand));
 const fail=()=>{setError("처리하지 못했습니다. JSON 형식·1MB 용량·저장 한도 또는 브라우저 저장 권한을 확인하세요. 기존 기록은 변경하지 않았습니다.");};
 const download=()=>{
  setError("");setMessage("");
  try{
   const data=exportBackup(),url=URL.createObjectURL(new Blob([data],{type:"application/json"}));
   const link=document.createElement("a");link.href=url;link.download="sinsang-favorites.json";
   document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
   setMessage("백업 파일 다운로드를 요청했습니다. 관심 상품 ID와 브랜드만 포함됩니다.");
  }catch{fail();}
 };
 return <details className="favorites-backup"><summary>관심 목록 백업·미노출 기록 관리</summary>
  <p>파일은 서버에 전송하지 않고 이 브라우저에서 처리합니다. 다른 기기에서는 백업 파일을 직접 가져오세요. 파일에 관심 상품 ID와 브랜드가 포함되므로 공유에 주의하세요.</p>
  <button type="button" onClick={download}>JSON 백업 내보내기</button>
  <label>백업 JSON 선택 (최대 1MB)<input type="file" accept=".json,application/json" onChange={async event=>{
   const file=event.target.files?.[0],token=++revision.current;setPending(null);setError("");setMessage("");event.target.value="";
   if(!file)return;
   try{if(file.size>FAVORITES_BACKUP_MAX_BYTES)throw Error("backup_size");const raw=await file.text(),value=validateFavoritesBackup(raw);if(token!==revision.current)return;setPending(raw);setMessage(`파일 확인: 상품 ${value.products.length}개 · 브랜드 ${value.brands.length}개. 적용 전에는 기록이 변경되지 않습니다.`);}catch{if(token===revision.current)fail();}
  }}/></label>
  {pending&&<div className="backup-confirm"><button type="button" onClick={()=>{setError("");if(importBackup(pending)){setPending(null);setMessage("기존 기록을 보존하고 백업을 합쳤습니다. 중복 항목은 한 번만 저장합니다.");}else fail();}}>기존 목록과 합쳐 가져오기</button><button type="button" onClick={()=>{++revision.current;setPending(null);setMessage("가져오기를 취소했습니다.");setError("");}}>취소</button></div>}
  {message&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}
  <h3>현재 미노출 기록</h3><p>공개 목록에 없다는 뜻이며 판매 종료를 의미하지 않습니다. 기록은 자동으로 삭제하지 않습니다.</p>
  <ul>{missing.map(id=><li key={id}><span>상품 ID: {id}</span><button type="button" onClick={()=>{setError("");if(!toggle("products",id))fail();else setMessage("선택한 미노출 상품의 관심 저장을 해제했습니다.");}}>관심 해제</button></li>)}{missingBrands.map(brand=><li key={`brand:${brand}`}><span>브랜드: {brand}</span><button type="button" onClick={()=>{setError("");if(!toggle("brands",brand))fail();else setMessage("선택한 미노출 브랜드의 관심 저장을 해제했습니다.");}}>관심 해제</button></li>)}</ul>
  {!missing.length&&!missingBrands.length&&<p>미노출 저장 기록이 없습니다.</p>}
 </details>;
}
