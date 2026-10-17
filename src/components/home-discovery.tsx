"use client";
import {useMemo,useSyncExternalStore} from "react";
import type {Product} from "@/types/product";
import {INITIAL_SUMMARY_CUTOFF,seoulDateKey} from "@/lib/product-window";
import {discoveryPeriod,millisecondsUntilSeoulMidnight} from "@/lib/discovery-display";
import {DiscoveryTabs} from "./discovery-tabs";
import {TodayUpdates} from "./today-updates";
import {MonthlyUpdates} from "./monthly-updates";
const getDay=()=>seoulDateKey(new Date());
function subscribeDay(change:()=>void){
 let timer:ReturnType<typeof setTimeout>;
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>{change();schedule();},millisecondsUntilSeoulMidnight()+25);};
 const resume=()=>{change();schedule();};schedule();
 window.addEventListener("focus",resume);document.addEventListener("visibilitychange",resume);
 return()=>{clearTimeout(timer);window.removeEventListener("focus",resume);document.removeEventListener("visibilitychange",resume);};
}
export function HomeDiscovery({products,builtAt}:{products:Product[];builtAt:string}){
 const day=useSyncExternalStore(subscribeDay,getDay,()=>seoulDateKey(builtAt));
 const {dates,week,month}=useMemo(()=>discoveryPeriod(products,day),[products,day]);
 return <><p className="discovery-clock">기간 기준 <time dateTime={day}>{day.replaceAll("-",".")}</time> · 한국 시간<br/>상품 내용은 마지막 배포 시점 기준이며, 기간만 현재 날짜로 갱신됩니다.</p><DiscoveryTabs weekCount={week.length} monthCount={month.length} week={<TodayUpdates key={day} products={week} today={day} dates={dates}/>} month={<MonthlyUpdates products={month} month={day.slice(0,7)} includeInitial={day<INITIAL_SUMMARY_CUTOFF}/>}/></>;
}
