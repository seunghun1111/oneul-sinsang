import type {Product} from "../types/product.ts";
type Item=Pick<Product,"category"|"brand"|"subCategory">;
export const unclassifiedSubcategory="__unclassified__";
export const catalogSubcategory=(product:Item)=>product.subCategory?.trim()||unclassifiedSubcategory;
export function catalogScope<T extends Item>(products:T[],category:string,brand:string) {
  return products.filter(p=>(category==="all"||p.category===category)&&(brand==="all"||p.brand===brand));
}
export function catalogSubcategoryOptions(products:Item[],category:string,brand:string) {
  const scope=catalogScope(products,category,brand);
  if(!scope.some(p=>p.subCategory?.trim()))return [];
  const counts=new Map<string,number>();
  for(const p of scope){const key=catalogSubcategory(p);counts.set(key,(counts.get(key)??0)+1);}
  return [...counts].map(([value,count])=>({value,label:value===unclassifiedSubcategory?"미분류":value,count})).sort((a,b)=>a.label.localeCompare(b.label,"ko"));
}
