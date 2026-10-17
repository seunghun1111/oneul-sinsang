"use client";
import {useId,useMemo,useState,useSyncExternalStore} from "react";
import {categoryMeta} from "@/lib/product-meta";
import type {Product,ProductCategory} from "@/types/product";
import {CatalogResults} from "./catalog-results";
import {catalogScope,catalogSubcategoryOptions} from "@/lib/catalog-filters";
import {catalogDefaults,readCatalogState,searchCatalog} from "@/lib/catalog-search";
import Link from "next/link";
import {useFavorites} from "./use-favorites";
import {FavoriteButton} from "./favorite-button";
import {matchesFavorite} from "@/lib/favorites";
import {FavoritesBackup} from "./favorites-backup";
const subscribe=(change:()=>void)=>{window.addEventListener("popstate",change);window.addEventListener("catalog-change",change);return()=>{window.removeEventListener("popstate",change);window.removeEventListener("catalog-change",change);};};
const snapshot=()=>window.location.search;
const serverSnapshot=()=>"";
export function ProductExplorer({products,title="공식 NEW 상품",description="공식 사이트의 NEW 상품입니다. 출시일·매장 재고는 별도입니다.",favoritesPage=false}:{products:Product[];title?:string;description?:string;favoritesPage?:boolean}){
 const search=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
 const state=useMemo(()=>readCatalogState(search,products),[search,products]);
 const {favorites}=useFavorites(),savedMode=state.saved==="brands"?"brands":"products";
 const [filtersOpen,setFiltersOpen]=useState(false);
 const id=useId();
 const categories=[...new Set(products.map(p=>p.category))];
 const brands=[...new Set(catalogScope(products,state.category,"all").map(p=>p.brand))].sort((a,b)=>a.localeCompare(b,"ko"));
 const subCategories=catalogSubcategoryOptions(products,state.category,state.brand);
 const filtered=useMemo(()=>searchCatalog(products,state).filter(product=>!favoritesPage||matchesFavorite(product,favorites,savedMode)),[products,state,favorites,favoritesPage,savedMode]);
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
  <div className="favorites-toolbar">{favoritesPage?<><div className="favorites-modes" aria-label="관심 목록 종류">{chip("products",`관심 상품 (${favorites.products.length})`,savedMode==="products",()=>change({saved:"products",category:"all",brand:"all",sub:"all",q:""}))}{chip("brands",`관심 브랜드 (${favorites.brands.length})`,savedMode==="brands",()=>change({saved:"brands",category:"all",brand:"all",sub:"all",q:""}))}</div><p>브라우저 데이터를 지우면 관심 기록도 사라집니다. 현재 공개 중인 상품만 표시하며, 미노출 상품의 저장 기록은 자동 삭제하지 않습니다.</p></>:<Link href="/saved">★ 내 관심 신상 모아보기</Link>}<details className="favorite-brand-manager"><summary>관심 브랜드 관리</summary><p>별표를 누른 브랜드의 공개 NEW 상품을 모아볼 수 있습니다.</p><div>{brands.map(item=><FavoriteButton key={item} kind="brands" value={item} label={item}/>)}</div></details></div>
  {favoritesPage&&<FavoritesBackup products={products.map(({id,brand,name})=>({id,brand,name}))}/>}
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
  <details className="discovery-guide"><summary>‘새로 발견’과 ‘초기 수집’은 어떻게 다른가요?</summary><p><strong>새로 발견</strong>은 수집 시작 이후 처음 확인한 공식 NEW, <strong>초기 수집</strong>은 처음 수집할 때 이미 NEW였던 상품입니다. 둘 다 실제 출시일을 뜻하지 않으며, 상품의 NEW 배지는 브랜드의 표시 기준입니다.</p></details>
  {filtered.length===0?<div className="empty-products"><strong>{favoritesPage?"현재 조건에 맞는 관심 상품이 없습니다":"조건에 맞는 상품이 없습니다"}</strong><p>{favoritesPage?"상품 목록의 별표로 저장하거나 관심 브랜드를 선택해 보세요. 검색·필터가 적용됐다면 먼저 초기화해 보세요.":"검색어를 줄이거나 다른 브랜드·분류를 선택해 보세요."}</p><button type="button" onClick={reset}>검색·필터 초기화</button>{favoritesPage&&<Link href="/search">전체 상품 찾아보기 →</Link>}</div>:<CatalogResults key={JSON.stringify([state.category,state.brand,state.sub,state.q,state.sort,favoritesPage?savedMode:""])} products={filtered} view={state.view}/>}
 </section>;
}
