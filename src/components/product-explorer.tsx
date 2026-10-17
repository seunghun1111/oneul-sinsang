"use client";
import {useId,useMemo,useState,useSyncExternalStore} from "react";
import {categoryMeta} from "@/lib/product-meta";
import type {Product,ProductCategory} from "@/types/product";
import {ProductCard} from "./product-card";
import {catalogScope,catalogSubcategoryOptions} from "@/lib/catalog-filters";
import {catalogDefaults,readCatalogState,searchCatalog} from "@/lib/catalog-search";
const subscribe=(change:()=>void)=>{window.addEventListener("popstate",change);window.addEventListener("catalog-change",change);return()=>{window.removeEventListener("popstate",change);window.removeEventListener("catalog-change",change);};};
const snapshot=()=>window.location.search;
const serverSnapshot=()=>"";
export function ProductExplorer({products,title="공식 NEW 상품",description="공식 사이트의 NEW 상품입니다. 출시일·매장 재고는 별도입니다."}:{products:Product[];title?:string;description?:string}){
 const search=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
 const state=useMemo(()=>readCatalogState(search,products),[search,products]);
 const [filtersOpen,setFiltersOpen]=useState(false);
 const id=useId();
 const categories=[...new Set(products.map(p=>p.category))];
 const brands=[...new Set(catalogScope(products,state.category,"all").map(p=>p.brand))].sort((a,b)=>a.localeCompare(b,"ko"));
 const subCategories=catalogSubcategoryOptions(products,state.category,state.brand);
 const filtered=useMemo(()=>searchCatalog(products,state),[products,state]);
 const change=(patch:Partial<typeof state>)=>{
  const next={...state,...patch},url=new URL(window.location.href);
  for(const key of Object.keys(catalogDefaults) as (keyof typeof state)[]){if(next[key]===catalogDefaults[key])url.searchParams.delete(key);else url.searchParams.set(key,next[key]);}
  window.history.replaceState(window.history.state,"",url);window.dispatchEvent(new Event("catalog-change"));
 };
 const reset=()=>change({category:"all",brand:"all",sub:"all",q:""});
 const active=[state.category!=="all"?categoryMeta[state.category as ProductCategory].label:null,state.brand!=="all"?state.brand:null,state.sub!=="all"?subCategories.find(s=>s.value===state.sub)?.label:null].filter(Boolean);
 const chip=(value:string,label:string,selected:boolean,onClick:()=>void)=><button key={value} type="button" className={`filter-chip${selected?" selected":""}`} aria-pressed={selected} onClick={onClick}>{label}</button>;
 return <section className="catalog" aria-labelledby={`${id}-title`}>
  <div className="catalog-heading"><div><p className="section-kicker">DISCOVER NEW</p><h2 id={`${id}-title`}>{title}</h2><p>{description}</p></div><span className="result-count" aria-live="polite">{filtered.length.toLocaleString()}개 상품</span></div>
  <div className="catalog-filter-panel">
   <div className="catalog-search"><label htmlFor={`${id}-search`}>상품·브랜드 검색</label><div><input id={`${id}-search`} type="search" maxLength={120} placeholder="예: 스타벅스 라떼, 텀블러" value={state.q} onChange={e=>change({q:e.target.value})}/>{state.q&&<button type="button" aria-label="검색어 지우기" onClick={()=>change({q:""})}>지우기</button>}</div></div>
   <div className="filter-summary"><span>{active.length?active.join(" › "):"전체 상품"}{state.q.trim()?` · “${state.q.trim()}” 검색`:""}</span><div><button type="button" onClick={reset}>초기화</button><button className="mobile-filter-toggle" type="button" aria-expanded={filtersOpen} aria-controls={`${id}-filters`} onClick={()=>setFiltersOpen(!filtersOpen)}>필터 {filtersOpen?"접기":"펼치기"}</button></div></div>
   <div id={`${id}-filters`} className={`catalog-filter-fields${filtersOpen?" is-open":""}`}>
    {categories.length>1&&<div className="filter-group"><span>상품군</span><div className="filter-row" aria-label="상품군 필터">{chip("all","전체",state.category==="all",()=>change({category:"all",brand:"all",sub:"all"}))}{categories.map(category=>chip(category,`${categoryMeta[category].emoji} ${categoryMeta[category].label}`,state.category===category,()=>change({category,brand:"all",sub:"all"})))}</div></div>}
    <div className="filter-group brand-filter"><span>브랜드</span><div className="filter-row" aria-label="브랜드 필터">{chip("all","전체",state.brand==="all",()=>change({brand:"all",sub:"all"}))}{brands.map(brand=>chip(brand,brand,state.brand===brand,()=>change({brand,sub:"all"})))}</div></div>
    {subCategories.length>0&&<div className="filter-group"><span>세부 분류</span><div className="filter-row" aria-label="세부 카테고리 필터">{chip("all","전체",state.sub==="all",()=>change({sub:"all"}))}{subCategories.map(sub=>chip(sub.value,`${sub.label} (${sub.count})`,state.sub===sub.value,()=>change({sub:sub.value})))}</div></div>}
   </div>
  </div>
  <div className="sort-row"><span>발견일은 출시일이 아닙니다</span><div className="catalog-controls"><label className="catalog-sort">정렬 <select aria-label="상품 정렬" value={state.sort} onChange={e=>change({sort:e.target.value})}><option value="detected">최근 발견순</option><option value="release">출시 기록순 · 미확인 뒤로</option></select></label><div className="view-options" aria-label="목록 표시 방식">{["compact","card","list"].map((view,index)=><button key={view} type="button" className={state.view===view?"selected":""} aria-pressed={state.view===view} onClick={()=>change({view})}>{["컴팩트","카드","리스트"][index]}</button>)}</div></div></div>
  {filtered.length===0?<div className="empty-products"><strong>조건에 맞는 상품이 없습니다</strong><p>검색어를 줄이거나 다른 브랜드·분류를 선택해 보세요.</p><button type="button" onClick={reset}>검색·필터 초기화</button></div>:<div className={`product-grid view-${state.view}`}>{filtered.map(product=><ProductCard key={product.id} product={product}/>)}</div>}
 </section>;
}
