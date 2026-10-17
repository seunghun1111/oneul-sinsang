import {htmlAttribute} from "./html-image.ts";

// Exact URL supplied from the rendered official product page; never derive edge/dough codes.
const confirmedImages:Record<string,string>={
 RPPZ2275:"https://akamai.pizzahut.co.kr/2020pizzahut-prod/public/img/menu/RPPZ2275_RPEG0056_RPDO0001_l.png",
};
export function pizzaHutProductImage(value:unknown,id:string) {
 if(typeof value!=="string"||!/^RPPZ\d+$/.test(id))return undefined;
 try{
  const u=new URL(value,"https://www.pizzahut.co.kr");
  if(u.protocol!=="https:"||u.username||u.password||u.port||u.search||u.hash||!["www.pizzahut.co.kr","akamai.pizzahut.co.kr"].includes(u.hostname))return undefined;
  const file=u.pathname.split("/").at(-1)??"";
  return file.startsWith(id+"_")&&/\.(?:png|jpe?g|webp)$/i.test(file)?u.href:undefined;
 }catch{return undefined;}
}
export function renderedPizzaHutImage(html:string,id:string){
 const images=new Set<string>();
 const body=html.replace(/<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1>/gi,"");
 for(const img of body.matchAll(/<img\b[^>]*>/gi)){
  const url=pizzaHutProductImage(htmlAttribute(img[0],"src"),id);if(url)images.add(url);
 }
 return images.size===1?[...images][0]:undefined;
}
export async function resolvePizzaHutImage(id:string,html:string,fetcher:typeof fetch){
 const url=renderedPizzaHutImage(html,id)??pizzaHutProductImage(confirmedImages[id],id);
 if(!url)return undefined;
 try{
  const response=await fetcher(url,{method:"HEAD",signal:AbortSignal.timeout(10000)});
  return response.ok&&/^image\/(?:png|jpeg|webp)(?:;|$)/i.test(response.headers.get("content-type")??"")?url:undefined;
 }catch{return undefined;}
}
