import type {Product} from "../types/product.ts";
import {includeInDiscoverySummary,seoulDateKey,seoulWeekDateKeys} from "./product-window.ts";
export function discoveryKind(kind:Product["detectionKind"]){
 if(kind==="newly_detected")return {label:"새로 발견",description:"수집을 시작한 이후 처음 확인한 공식 NEW입니다. 실제 출시일과 다를 수 있습니다."};
 if(kind==="initial")return {label:"초기 수집",description:"처음 수집할 때 이미 NEW로 표시된 상품입니다. 최근 출시를 뜻하지 않습니다."};
 return {label:"발견 기록",description:"발견 구분이 확인되지 않은 상품입니다. 실제 출시일은 공식 출처를 확인하세요."};
}
export function discoveryPeriod(products:Product[],day:string){
 const now=new Date(`${day}T00:00:00+09:00`),dates=seoulWeekDateKeys(now),weekKeys=new Set(dates);
 const eligible=products.filter(product=>includeInDiscoverySummary(product,now)&&seoulDateKey(product.firstDetectedAt)<=day);
 return {dates,week:eligible.filter(product=>weekKeys.has(seoulDateKey(product.firstDetectedAt))),month:eligible.filter(product=>seoulDateKey(product.firstDetectedAt).slice(0,7)===day.slice(0,7))};
}
export function millisecondsUntilSeoulMidnight(now=new Date()){
 return Date.parse(`${seoulDateKey(now)}T00:00:00+09:00`)+86400000-now.getTime();
}
export const CATALOG_PAGE_SIZE=48;
export function catalogPageSize(total:number,requested=CATALOG_PAGE_SIZE){
 return Math.min(Math.max(0,total),Math.max(CATALOG_PAGE_SIZE,Number.isFinite(requested)?Math.floor(requested):CATALOG_PAGE_SIZE));
}
