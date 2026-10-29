import type {Product} from "../../src/types/product.ts";
import {isCurrentlyOnSale} from "../../src/lib/product-window.ts";
import {collectionUrlAllowed} from "./collection-http.ts";
import {normalizeImageUrl} from "./collected-product.ts";
export const QUALITY_FRESHNESS_HOURS=36;
export function catalogQuality(products:Product[],now=new Date()){
 if(!Number.isFinite(now.getTime()))throw Error("유효한 품질 검사 시각이 필요합니다.");
 const errors:{id:string;brand:string;code:string}[]=[],seen=new Set<string>();
 for(const p of products){
  if(!p.id||seen.has(p.id))errors.push({id:p.id,brand:p.brand,code:"duplicate_or_missing_id"});seen.add(p.id);
  if("price" in p)errors.push({id:p.id,brand:p.brand,code:"price_field"});
  for(const key of ["firstDetectedAt","lastCheckedAt","createdAt","updatedAt"] as const){
   const time=Date.parse(p[key]);
   if(!Number.isFinite(time))errors.push({id:p.id,brand:p.brand,code:`invalid_${key}`});
   else if(time>now.getTime())errors.push({id:p.id,brand:p.brand,code:`future_${key}`});
  }
 }
 const published=products.filter(p=>isCurrentlyOnSale(p,now));
 for(const p of published)if(!collectionUrlAllowed(p.sourceUrl))errors.push({id:p.id,brand:p.brand,code:"unsafe_public_source"});
 const gaps=published.map(p=>({id:p.id,brand:p.brand,issues:[...(!p.subCategory?.trim()?["missing_subcategory"]:[]),...(p.sourceType==="official_site"&&!normalizeImageUrl(p.imageUrl,p.sourceUrl)?["missing_image"]:[]),...(now.getTime()-Date.parse(p.lastCheckedAt)>QUALITY_FRESHNESS_HOURS*3600000?["stale_check"]:[])]})).filter(p=>p.issues.length);
 return {total:products.length,published:published.length,errors,gaps};
}
