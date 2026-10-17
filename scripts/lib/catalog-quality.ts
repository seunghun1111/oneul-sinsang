import type {Product} from "../../src/types/product.ts";
import {isCurrentlyOnSale} from "../../src/lib/product-window.ts";
import {collectionUrlAllowed} from "./collection-http.ts";
import {normalizeImageUrl} from "./collected-product.ts";
export function catalogQuality(products:Product[],now=new Date()){
 const errors:{id:string;code:string}[]=[],seen=new Set<string>();
 for(const p of products){
  if(!p.id||seen.has(p.id))errors.push({id:p.id,code:"duplicate_or_missing_id"});seen.add(p.id);
  if("price" in p)errors.push({id:p.id,code:"price_field"});
  for(const key of ["firstDetectedAt","lastCheckedAt","createdAt","updatedAt"] as const)if(!Number.isFinite(Date.parse(p[key])))errors.push({id:p.id,code:`invalid_${key}`});
 }
 const published=products.filter(p=>isCurrentlyOnSale(p,now));
 for(const p of published)if(!collectionUrlAllowed(p.sourceUrl))errors.push({id:p.id,code:"unsafe_public_source"});
 const gaps=published.map(p=>({id:p.id,brand:p.brand,issues:[...(!p.subCategory?["missing_subcategory"]:[]),...(p.sourceType==="official_site"&&!normalizeImageUrl(p.imageUrl,p.sourceUrl)?["missing_image"]:[]),...(now.getTime()-Date.parse(p.lastCheckedAt)>36*3600000?["stale_check"]:[])]})).filter(p=>p.issues.length);
 return {total:products.length,published:published.length,errors,gaps};
}
