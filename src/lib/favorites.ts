export const FAVORITES_KEY="oneul-sinsang:favorites:v1";
export type Favorites={version:1;products:string[];brands:string[]};
export const emptyFavorites=():Favorites=>({version:1,products:[],brands:[]});
export function parseFavorites(raw:string|null):Favorites{
 try{const value=JSON.parse(raw??"");if(!value||value.version!==1)return emptyFavorites();
  const list=(items:unknown,limit:number)=>Array.isArray(items)?[...new Set(items.filter((x):x is string=>typeof x==="string"&&x.length>0&&x.length<=256))].slice(0,limit):[];
  return {version:1,products:list(value.products,2000),brands:list(value.brands,200)};
 }catch{return emptyFavorites();}
}
export function toggleFavorite(current:Favorites,kind:"products"|"brands",value:string):Favorites{
 const exists=current[kind].includes(value);
 if(!exists&&(current[kind].length>=(kind==="products"?2000:200)||!value||value.length>256))throw Error("favorite_limit");
 return parseFavorites(JSON.stringify({...current,[kind]:exists?current[kind].filter(item=>item!==value):[value,...current[kind]]}));
}
export function matchesFavorite(product:{id:string;brand:string},favorites:Favorites,mode:string){
 return mode==="products"?favorites.products.includes(product.id):mode==="brands"?favorites.brands.includes(product.brand):true;
}
export function persistFavorite(storage:{getItem(key:string):string|null;setItem(key:string,value:string):void},kind:"products"|"brands",value:string){
 try{const current=parseFavorites(storage.getItem(FAVORITES_KEY));const next=toggleFavorite(current,kind,value);storage.setItem(FAVORITES_KEY,JSON.stringify(next));return true;}catch{return false;}
}
