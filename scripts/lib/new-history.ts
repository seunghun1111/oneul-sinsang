import type {Product} from "../../src/types/product.ts";
export type NewHistory={brands:Record<string,string>;seen:Record<string,true>};
export function trackNewProducts(products:Product[], history:NewHistory, checkedAt:string) {
  const next:NewHistory={brands:{...history.brands},seen:{...history.seen}};
  const updated=products.map(product=>{
    const id=`${product.brand}:${product.id}`;
    const alias=`${product.brand}:name:${product.normalizedName}`;
    const known=history.seen[id] || history.seen[alias];
    const detectionKind=product.detectionKind ?? (!history.brands[product.brand] || known ? "initial" : "newly_detected");
    next.seen[id]=true;next.seen[alias]=true;
    next.brands[product.brand]??=checkedAt;
    return {...product,detectionKind} as Product;
  });
  return {products:updated,history:next};
}
