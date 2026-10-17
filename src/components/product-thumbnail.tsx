"use client";
import {useState} from "react";
import type {Product} from "@/types/product";
import {categoryMeta} from "@/lib/product-meta";
export function ProductThumbnail({product}:{product:Product}){
 const [failedUrl,setFailedUrl]=useState<string>();
 const meta=categoryMeta[product.category];
 return product.imageUrl&&failedUrl!==product.imageUrl?<img src={product.imageUrl} alt="" loading="lazy" onError={()=>setFailedUrl(product.imageUrl)}/>:<span className="product-placeholder"><span aria-hidden="true">{meta.emoji}</span><strong>{product.brand}</strong><small>{product.subCategory??meta.label} · 이미지 준비 중</small></span>;
}
