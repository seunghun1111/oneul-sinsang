import type {Product} from "../types/product.ts";
import {catalogScope,catalogSubcategory,catalogSubcategoryOptions} from "./catalog-filters.ts";
export const catalogDefaults={category:"all",brand:"all",sub:"all",q:"",sort:"detected",view:"compact",saved:"all"};
export function readCatalogState(search:string,products:Product[]){
 const params=new URLSearchParams(search),state={...catalogDefaults};
 const category=params.get("category");if(products.some(p=>p.category===category))state.category=category!;
 const brand=params.get("brand");if(catalogScope(products,state.category,"all").some(p=>p.brand===brand))state.brand=brand!;
 const sub=params.get("sub");if(catalogSubcategoryOptions(products,state.category,state.brand).some(s=>s.value===sub))state.sub=sub!;
 state.q=(params.get("q")??"").slice(0,120);
 if(["products","brands"].includes(params.get("saved")??""))state.saved=params.get("saved")!;
 if(params.get("sort")==="release")state.sort="release";
 if(["card","list"].includes(params.get("view")??""))state.view=params.get("view")!;
 return state;
}
const searchable=(value:string)=>value.normalize("NFKC").toLocaleLowerCase("ko").replace(/\s+/g,"");
export function searchCatalog(products:Product[],state:typeof catalogDefaults){
 const terms=state.q.trim().split(/\s+/).filter(Boolean).map(searchable);
 return catalogScope(products,state.category,state.brand).filter(p=>(state.sub==="all"||catalogSubcategory(p)===state.sub)&&terms.every(term=>searchable(`${p.brand} ${p.name} ${p.subCategory??""}`).includes(term)))
 .toSorted((a,b)=>{const left=state.sort==="release"?a.releaseDate??"":a.firstDetectedAt,right=state.sort==="release"?b.releaseDate??"":b.firstDetectedAt;return right.localeCompare(left)||a.name.localeCompare(b.name,"ko")||a.id.localeCompare(b.id);});
}
