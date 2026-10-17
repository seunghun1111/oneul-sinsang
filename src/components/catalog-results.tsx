"use client";
import {useEffect,useId,useRef,useState} from "react";
import type {Product} from "@/types/product";
import {CATALOG_PAGE_SIZE,catalogPageSize} from "@/lib/discovery-display";
import {ProductCard} from "./product-card";
export function CatalogResults({products,view}:{products:Product[];view:string}){
 const [limit,setLimit]=useState(CATALOG_PAGE_SIZE),id=useId(),grid=useRef<HTMLDivElement>(null),nextFocus=useRef<number|undefined>(undefined);
 const shown=catalogPageSize(products.length,limit);
 useEffect(()=>{if(nextFocus.current===undefined)return;grid.current?.querySelectorAll<HTMLAnchorElement>("article .product-image")[nextFocus.current]?.focus();nextFocus.current=undefined;},[limit]);
 return <><div id={id} ref={grid} className={`product-grid view-${view}`}>{products.slice(0,shown).map(product=><ProductCard key={product.id} product={product}/>)}</div><div className="catalog-pagination"><p role="status">전체 {products.length.toLocaleString()}개 중 {shown.toLocaleString()}개 표시</p>{shown<products.length?<button type="button" aria-controls={id} onClick={()=>{nextFocus.current=shown;setLimit(shown+CATALOG_PAGE_SIZE);}}>상품 더보기 · {Math.min(CATALOG_PAGE_SIZE,products.length-shown)}개</button>:<span>조건에 맞는 상품을 모두 표시했습니다.</span>}</div></>;
}
