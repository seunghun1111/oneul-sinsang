import type {Product} from "../types/product.ts";
// Cross-list only exact official CU categories. Preserve the source category and identity.
const cuBrowse:Record<string,string>={"간편식사":"meal","즉석조리":"meal","과자류":"snack","아이스크림":"snack","음료":"drink","생활용품":"drink"};
export function convenienceBrowseGroup(product:Pick<Product,"brand"|"category"|"subCategory"|"sourceUrl">){
 if(product.category!=="convenience"||product.brand!=="CU")return undefined;
 try{const url=new URL(product.sourceUrl);if(url.protocol!=="https:"||url.hostname!=="cu.bgfretail.com"||url.username||url.password||url.port)return undefined;}catch{return undefined;}
 return cuBrowse[product.subCategory??""];
}
