"use client";
import {useState} from "react";
import {useFavorites} from "./use-favorites";
export function FavoriteButton({kind,value,label}:{kind:"products"|"brands";value:string;label:string}){
 const {favorites,toggle}=useFavorites(),[error,setError]=useState(false),selected=favorites[kind].includes(value);
 const action=`${label} 관심 ${kind==="products"?"상품":"브랜드"} ${selected?"해제":"저장"}`;
 const containerClass=kind==="products"?"favorite-product-action":"favorite-brand-action";
 return <span className={`${containerClass}${error?" has-error":""}`}><button type="button" aria-label={action} title={action} aria-pressed={selected} onClick={()=>setError(!toggle(kind,value))}><span aria-hidden="true">{selected?"★":"☆"}</span>{kind==="brands"&&label}</button>{error&&<span className="favorite-error" role="alert">저장하지 못했습니다. 저장 공간·개인정보 설정 또는 저장 한도(상품 2,000개·브랜드 200개)를 확인하세요.</span>}</span>;
}
