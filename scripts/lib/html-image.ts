/** Read quoted HTML attributes independently of their order; avoid data-src/src confusion. */
export function htmlAttribute(tag:string,name:string) {
  return tag.match(new RegExp("(?:^|\\s)"+name+"\\s*=\\s*([\"'])(.*?)\\1","i"))?.[2];
}
export function productImageSource(html:string) {
  for(const match of html.matchAll(/<img\b[^>]*>/gi)){
    const tag=match[0],src=htmlAttribute(tag,"src"),alt=htmlAttribute(tag,"alt")??"";
    if(!src||/디폴트\s*이미지|기본\s*이미지|no\s*image|placeholder/i.test(alt)||/product_list_01\.jpg|no[_-]?image|placeholder/i.test(src))continue;
    return src;
  }
  return undefined;
}
