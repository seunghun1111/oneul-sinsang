"use client";
import {useMemo,useSyncExternalStore} from "react";
import {FAVORITES_KEY,parseFavorites,persistFavorite} from "@/lib/favorites";
import {importFavoritesBackup,readFavoritesBackup} from "@/lib/favorites-backup";
const changed="oneul-favorites-change";
const snapshot=()=>{try{return window.localStorage.getItem(FAVORITES_KEY)??"";}catch{return "";}};
const serverSnapshot=()=>"";
function subscribe(change:()=>void){
 const storage=(event:StorageEvent)=>{if(event.key===FAVORITES_KEY||event.key===null)change();};
 window.addEventListener(changed,change);window.addEventListener("storage",storage);
 return()=>{window.removeEventListener(changed,change);window.removeEventListener("storage",storage);};
}
export function useFavorites(){
 const raw=useSyncExternalStore(subscribe,snapshot,serverSnapshot),favorites=useMemo(()=>parseFavorites(raw),[raw]);
 const toggle=(kind:"products"|"brands",value:string)=>{
  try{if(!persistFavorite(window.localStorage,kind,value))return false;window.dispatchEvent(new Event(changed));return true;}catch{return false;}
 };
 const importBackup=(raw:string)=>{try{importFavoritesBackup(window.localStorage,raw);window.dispatchEvent(new Event(changed));return true;}catch{return false;}};
 const exportBackup=()=>JSON.stringify(readFavoritesBackup(window.localStorage),null,2);
 return {favorites,toggle,importBackup,exportBackup};
}
