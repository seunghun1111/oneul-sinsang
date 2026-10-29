import type {Product} from "../types/product.ts";
import {catalogDefaults,searchCatalog} from "./catalog-search.ts";
import {catalogSubcategory} from "./catalog-filters.ts";

type State=typeof catalogDefaults;
export const catalogFilterResets={
 q:{q:""},
 category:{category:"all",brand:"all",sub:"all"},
 brand:{brand:"all",sub:"all"},
 sub:{sub:"all"},
} satisfies Record<string,Partial<State>>;

/** Counts reflect the query and the caller's scope (including saved items).
 * Each level ignores its own selection and dependent lower-level selections. */
export function catalogFacetCounts(products:Product[],state:State){
 const query=searchCatalog(products,{...state,category:"all",brand:"all",sub:"all"});
 const category=query.filter(p=>state.category==="all"||p.category===state.category);
 const brand=category.filter(p=>state.brand==="all"||p.brand===state.brand);
 const counts=(items:Product[],key:(p:Product)=>string)=>{
  const values=new Map<string,number>();
  for(const item of items){const value=key(item);values.set(value,(values.get(value)??0)+1);}
  return values;
 };
 return {all:query.length,categoryTotal:category.length,brandTotal:brand.length,
  categories:counts(query,p=>p.category),brands:counts(category,p=>p.brand),subcategories:counts(brand,catalogSubcategory)};
}

/** Offer only changes with actual results, preserving sort/view/saved mode. */
export function catalogRecoveryOptions(products:Product[],state:State){
 const options:{key:string;label:string;patch:Partial<State>}[]=[];
 if(state.q)options.push({key:"q",label:"검색어 지우기",patch:catalogFilterResets.q});
 if(state.sub!=="all")options.push({key:"sub",label:"세부 분류 해제",patch:catalogFilterResets.sub});
 if(state.brand!=="all")options.push({key:"brand",label:"브랜드·세부 분류 해제",patch:catalogFilterResets.brand});
 if(state.category!=="all")options.push({key:"category",label:"상품군·하위 분류 해제",patch:catalogFilterResets.category});
 if(options.length)options.push({key:"all",label:"검색·필터 모두 초기화",patch:{q:"",category:"all",brand:"all",sub:"all"}});
 const seen=new Set<string>();
 return options.flatMap(option=>{
  const next={...state,...option.patch};
  const signature=JSON.stringify([next.q,next.category,next.brand,next.sub]);
  if(seen.has(signature))return [];seen.add(signature);
  const count=searchCatalog(products,next).length;
  return count?[{...option,count}]:[];
 }).slice(0,3);
}
