import {normalizeProductName} from "../../src/lib/normalize-product-name.ts";
import {normalizeImageUrl} from "./collected-product.ts";
import {htmlAttribute as attribute} from "./html-image.ts";
import {officialCoffeeCards} from "./official-coffee-cards.ts";

const text=(value:string)=>value.replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&nbsp;/g," ").replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim();

/** Image enrichment only: never creates a product or asserts NEW/sale/date evidence. */
export function coffeeProductImageResults(raw:string,sourceUrl:string) {
  const cards=officialCoffeeCards(raw,sourceUrl);
  if(cards){
    const found=new Map<string,Set<string>>();
    for(const card of cards){if(!card.imageUrl)continue;const key=normalizeProductName(card.name),images=found.get(key)??new Set<string>();images.add(card.imageUrl);found.set(key,images);}
    return {images:new Map([...found].filter(([,urls])=>urls.size===1).map(([name,urls])=>[name,[...urls][0]])),ambiguous:new Map([...found].filter(([,urls])=>urls.size>1).map(([name,urls])=>[name,urls.size]))};
  }
  const html=raw.replace(/<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script>/gi,"");
  const host=new URL(sourceUrl).hostname;
  const matches=new Map<string,Set<string>>();
  const add=(name:string,path:string|undefined)=>{
    if(!name||!path)return;
    const image=normalizeImageUrl(path,sourceUrl);if(!image)return;
    const u=new URL(image);
    const allowed=host==="paikdabang.com"?u.hostname===host&&u.pathname.startsWith("/wp-content/uploads/")
      :host==="www.ediya.com"?u.hostname===host&&u.pathname.startsWith("/files/menu/")
      :host==="www.hollys.co.kr"?u.hostname==="admin.hollys.co.kr"&&u.pathname.startsWith("/upload/menu/"):false;
    if(!allowed)return;
    const key=normalizeProductName(text(name));if(!key)return;
    const images=matches.get(key)??new Set<string>();images.add(image);matches.set(key,images);
  };
  if(host==="paikdabang.com"){
    const start=html.indexOf('class="menu_slider new_menu_slider"');
    const slider=start<0?"":html.slice(start);
    // Each slide is its own identity boundary. Never use the next slide's image.
    for(const card of slider.split(/<div\b[^>]*class=["']swiper-slide["'][^>]*>/i).slice(1)){
      const title=card.match(/<p\b[^>]*class=["']best_tit["'][^>]*>([\s\S]*?)<\/p>/i)?.[1];
      const image=card.match(/<img\b[^>]*>/i)?.[0];
      if(title&&image)add(title,attribute(image,"src"));
    }
  }else if(["www.ediya.com","www.hollys.co.kr"].includes(host)){
    for(const image of html.matchAll(/<img\b[^>]*>/gi))add(attribute(image[0],"alt")??"",attribute(image[0],"src"));
  }
  // Conflicting images for one normalized name are ambiguous: leave them unresolved.
  return {images:new Map([...matches].filter(([,urls])=>urls.size===1).map(([name,urls])=>[name,[...urls][0]])),ambiguous:new Map([...matches].filter(([,urls])=>urls.size>1).map(([name,urls])=>[name,urls.size]))};
}
export function coffeeProductImages(raw:string,sourceUrl:string){return coffeeProductImageResults(raw,sourceUrl).images;}
