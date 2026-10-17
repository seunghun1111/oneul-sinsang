import {htmlAttribute} from "./html-image.ts";
import {normalizeImageUrl} from "./collected-product.ts";

const clean=(value:string)=>value.replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim();
const enabledHosts=new Set(["composecoffee.com","www.gong-cha.co.kr","terarosa.com"]);
/** undefined means unsupported. Empty means supported but no explicit product NEW evidence. */
export function inspectOfficialCoffeeCards(raw:string,sourceUrl:string) {
 const source=new URL(sourceUrl);
 if(!enabledHosts.has(source.hostname))return undefined;
 const html=raw.replace(/<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1>/gi,"");
 const products:{name:string;imageUrl?:string}[]=[];
 let identifiedCards=0,namedCards=0;
 for(const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)){
  const tag="a "+match[1],body=match[2],href=htmlAttribute(tag,"href");if(!href)continue;
  let detail:URL;try{detail=new URL(href.replace(/&amp;/g,"&"),source);}catch{continue;}
  if(detail.origin!==source.origin||detail.username||detail.password)continue;
  const identity=source.hostname==="composecoffee.com"?detail.pathname==="/index.php"&&detail.searchParams.get("act")==="dispCafemenuGalleryItem"&&/^\d+$/.test(detail.searchParams.get("item_srl")??"")
   :source.hostname==="www.gong-cha.co.kr"?detail.pathname==="/brand/menu/product_detail"&&/^\d+$/.test(detail.searchParams.get("no")??"")
   :detail.pathname==="/product/detail/"&&/^\d+$/.test(detail.searchParams.get("ItemCode")??"");
  if(!identity||/\shidden(?:\s|=|$)|aria-hidden\s*=\s*["']true|display\s*:\s*none|visibility\s*:\s*hidden/i.test(tag))continue;
  identifiedCards++;
  if(/<[^>]*(?:\shidden(?:\s|=|>)|aria-hidden\s*=\s*["']true|display\s*:\s*none|visibility\s*:\s*hidden)[^>]*>/i.test(body))continue;
  // A marker belongs to this exact product anchor, never the page title or next card.
  const visible=body.replace(/<(span|b|em|img)\b[^>]*(?:\shidden\b|aria-hidden\s*=\s*["']true|display\s*:\s*none)[^>]*>(?:[\s\S]*?<\/\1>)?/gi,"");
  const marked=[...visible.matchAll(/<img\b[^>]*>/gi)].some(m=>/^(?:new|신상품|신메뉴)$/i.test(htmlAttribute(m[0],"alt")??""))
   ||/<(?:span|b|em)\b[^>]*>\s*(?:NEW|신상품|신메뉴)\s*<\/(?:span|b|em)>/i.test(visible);
  const name=clean(body.match(/<(?:div|p|h[2-4]|strong)\b[^>]*class=["'][^"']*(?:cafemenu-menu-name|product-name|goods-name|item-name)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|p|h[2-4]|strong)>/i)?.[1]
   ??(source.hostname==="www.gong-cha.co.kr"?body.match(/<div\b[^>]*class=["']text-a["'][^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]:undefined)??"");
  if(name.length<2||name.length>80)continue;
  namedCards++;
  if(!marked)continue;
  const image=[...body.matchAll(/<img\b[^>]*>/gi)].find(m=>! /^(?:new|신상품|신메뉴)$/i.test(htmlAttribute(m[0],"alt")??""));
  const imageUrl=image?normalizeImageUrl(htmlAttribute(image[0],"src"),sourceUrl):undefined;
  products.push({name,...(imageUrl?{imageUrl}:{})});
 }
 return {products,identifiedCards,namedCards};
}
export function officialCoffeeCards(raw:string,sourceUrl:string){return inspectOfficialCoffeeCards(raw,sourceUrl)?.products;}
