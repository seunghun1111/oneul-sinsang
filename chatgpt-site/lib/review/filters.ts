import type {ReviewProduct} from "./catalog";
export const uncategorized="__uncategorized__";
export const subCategoryKey=(product:ReviewProduct)=>product.subCategory?.trim()||uncategorized;
export function categoryScope(products:ReviewProduct[],category:string,brand="all") {
  return products.filter(p=>(category==="all"||p.category===category)&&(brand==="all"||p.brand===brand));
}
export function subCategoryOptions(products:ReviewProduct[],category:string,brand="all") {
  const counts=new Map<string,number>();
  for(const p of categoryScope(products,category,brand)){const key=subCategoryKey(p);counts.set(key,(counts.get(key)??0)+1);}
  return [...counts].map(([value,count])=>({value,label:value===uncategorized?"미분류":value,count})).sort((a,b)=>a.label.localeCompare(b.label,"ko"));
}
export function filterReviewProducts(products:ReviewProduct[],filters:{category:string;subCategory:string;brand:string;status:string;action:string;query:string}) {
  const query=filters.query.trim().toLowerCase();
  return categoryScope(products,filters.category,filters.brand).filter(p=>(filters.subCategory==="all"||subCategoryKey(p)===filters.subCategory)&&(filters.status==="all"||p.reviewStatus===filters.status)&&(filters.action==="all"||p.automationAction===filters.action)&&(p.name+" "+p.brand).toLowerCase().includes(query));
}
