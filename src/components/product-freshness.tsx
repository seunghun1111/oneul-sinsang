"use client";
import {useSyncExternalStore} from "react";
import health from "@/data/collection-health.json";
import {productFreshness} from "@/lib/product-freshness";
import type {Product} from "@/types/product";
const snapshot=()=>Math.floor(Date.now()/60000)*60000;
const serverSnapshot=()=>Date.parse(health.generatedAt);
const listeners=new Set<()=>void>();
let timer:ReturnType<typeof setInterval>|undefined;
const notify=()=>listeners.forEach(change=>change());
function subscribe(change:()=>void){
 listeners.add(change);
 if(listeners.size===1){timer=setInterval(notify,60000);window.addEventListener("focus",notify);document.addEventListener("visibilitychange",notify);}
 return()=>{listeners.delete(change);if(!listeners.size){clearInterval(timer);window.removeEventListener("focus",notify);document.removeEventListener("visibilitychange",notify);}};
}
export function ProductFreshness({product,detail=false}:{product:Pick<Product,"brand"|"sourceUrl"|"lastSeenAt"|"reviewEvidence"|"consecutiveMisses">;detail?:boolean}){
 const now=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
 const row=health.rows.find(row=>row.brand===product.brand);
 const state=productFreshness(product,row,now);
 const date=state.confirmedAt?new Date(Date.parse(state.confirmedAt)+9*3600000).toISOString().slice(0,16).replace("T"," "):undefined;
 return <div className={`product-freshness freshness-${state.status}`} title={state.reason}>
  <span>{state.label}</span>{date&&<small>상품 정상 확인 <time dateTime={state.confirmedAt}>{date} KST</time></small>}
  {detail&&<p>{state.reason} 수집 실패만으로 판매 종료를 판정하지 않습니다.</p>}
 </div>;
}
