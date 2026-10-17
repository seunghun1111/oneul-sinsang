import {FAVORITES_KEY,emptyFavorites,type Favorites} from "./favorites.ts";
export const FAVORITES_BACKUP_MAX_BYTES=1024*1024;
export function validateFavoritesBackup(raw:string):Favorites{
 if(new TextEncoder().encode(raw).length>FAVORITES_BACKUP_MAX_BYTES)throw Error("backup_size");
 const value=JSON.parse(raw);
 if(!value||Array.isArray(value)||value.version!==1)throw Error("backup_version");
 const list=(items:unknown,limit:number)=>{
  if(!Array.isArray(items)||items.length>limit||items.some(item=>typeof item!=="string"||!item.trim()||item.length>256))throw Error("backup_items");
  return [...new Set(items)] as string[];
 };
 return {version:1,products:list(value.products,2000),brands:list(value.brands,200)};
}
export function mergeFavoritesBackup(current:Favorites,incoming:Favorites):Favorites{
 const next={version:1,products:[...new Set([...current.products,...incoming.products])],brands:[...new Set([...current.brands,...incoming.brands])]};
 return validateFavoritesBackup(JSON.stringify(next));
}
type Storage={getItem(key:string):string|null;setItem(key:string,value:string):void};
export function readFavoritesBackup(storage:Pick<Storage,"getItem">){
 const raw=storage.getItem(FAVORITES_KEY);
 return raw===null?emptyFavorites():validateFavoritesBackup(raw);
}
export function importFavoritesBackup(storage:Storage,raw:string){
 const incoming=validateFavoritesBackup(raw);
 const merged=mergeFavoritesBackup(readFavoritesBackup(storage),incoming);
 storage.setItem(FAVORITES_KEY,JSON.stringify(merged));
 return merged;
}
