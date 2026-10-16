import {normalizeImageUrl} from "./collected-product.ts";
export type StarbucksMenuItem={id:string;name:string;isNew:boolean;sourceUrl:string;imageUrl?:string;kind:"menu"|"md";subCategory:string};
export function starbucksCategoryCodes(html:string) {
  const visible=html.replace(/<!--[\s\S]*?-->|\/\*[\s\S]*?\*\//g,"");
  if(!visible.includes("/menu/productListAjax.do")||!visible.includes("newicon == 'Y'"))throw Error("스타벅스 공식 NEW 화면 구조 변경");
  const codes=[...new Set([...visible.matchAll(/result\s*=\s*["'](W\d+)["']/g)].map(m=>m[1]))];
  if(!codes.length||codes.length>20)throw Error("스타벅스 카테고리 구조 변경");
  return codes;
}
export function parseStarbucksMenu(data:unknown,section:"drink"|"food"|"product"):StarbucksMenuItem[] {
  if(!data||typeof data!=="object"||!Array.isArray((data as {list?:unknown}).list))throw Error("스타벅스 상품 응답 구조 변경");
  const list=(data as {list:unknown[]}).list;
  return list.map(value=>{
    if(!value||typeof value!=="object")throw Error("스타벅스 상품 구조 변경");
    const row=value as Record<string,unknown>;
    if(typeof row.product_CD!=="string"||!/^\d{1,25}$/.test(row.product_CD)||typeof row.product_NM!=="string"||!row.product_NM.trim()||!["Y","N"].includes(row.newicon as string))throw Error("스타벅스 NEW 식별 필드 변경");
    const sourceUrl=`https://www.starbucks.co.kr/menu/${section}_view.do?product_cd=${row.product_CD}`;
    // Match the official template, but accept only the known product-image CDN/path.
    let imageUrl:string|undefined;
    if(typeof row.img_UPLOAD_PATH==="string"&&typeof row.file_PATH==="string"){
      const base=row.img_UPLOAD_PATH.replace("www.istarbucks.co.kr","image.istarbucks.co.kr");
      const raw=base+row.file_PATH;
      const normalized=normalizeImageUrl(raw,sourceUrl);
      if(normalized){const image=new URL(normalized);if(image.hostname==="image.istarbucks.co.kr"&&image.pathname.startsWith("/upload/store/skuimg/"))imageUrl=normalized;}
    }
    return {id:row.product_CD,name:row.product_NM.trim(),isNew:row.newicon==="Y",sourceUrl,...(imageUrl?{imageUrl}:{}),kind:section==="product"?"md" as const:"menu" as const,subCategory:section==="product"?"MD":section==="food"?"푸드":"음료"};
  });
}
