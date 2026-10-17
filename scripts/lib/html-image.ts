/** Read quoted HTML attributes independently of their order; avoid data-src/src confusion. */
export function htmlAttribute(tag:string,name:string) {
  return tag.match(new RegExp("(?:^|\\s)"+name+"\\s*=\\s*([\"'])(.*?)\\1","i"))?.[2];
}
export function productImageSource(html:string) {
  const visible=html.replace(/<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script>/gi,"");
  for(const match of visible.matchAll(/<img\b[^>]*>/gi)){
    const tag=match[0],alt=htmlAttribute(tag,"alt")??"";
    if(/디폴트\s*이미지|기본\s*이미지|no\s*image|placeholder/i.test(alt)||/^(?:new|신상품|신메뉴)$/i.test(alt.trim()))continue;
    for(const name of ["data-src","data-original","src"]){
      const src=htmlAttribute(tag,name)?.trim();
      if(!src||/^(?:data:|javascript:|blob:)/i.test(src)||/product_list_01\.jpg|no[_-]?image|placeholder|(?:^|\/)new(?:[_-]icon)?\.(?:png|gif|svg)(?:\?|$)/i.test(src))continue;
      return src;
    }
  }
  return undefined;
}
