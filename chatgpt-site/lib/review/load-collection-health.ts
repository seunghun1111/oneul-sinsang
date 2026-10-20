import type {CollectionHealth} from "./collection-health.ts";
import {collectionDiagnostics} from "./collection-diagnostics.ts";
export async function loadCollectionHealth(fetcher:typeof fetch=fetch):Promise<CollectionHealth|null> {
  try {
    const response=await fetcher("https://raw.githubusercontent.com/seunghun1111/oneul-sinsang/main/src/data/collection-health.json",{cache:"no-store",signal:AbortSignal.timeout(15000)});
    if(!response.ok) return null;
    const raw:unknown=await response.json();
    if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
    const data=raw as Record<string,unknown>;
    if(data?.version!==1||typeof data.generatedAt!=="string"||!Array.isArray(data.rows)) return null;
    if(!data.rows.every((row:Record<string,unknown>)=>row&&typeof row.id==="string"&&typeof row.brand==="string"&&typeof row.group==="string"&&typeof row.groupLabel==="string"&&typeof row.reason==="string"&&["success","partial","failed","not_checked"].includes(String(row.status))&&[row.checkedAt,row.lastSuccessfulAt].every(value=>value===undefined||typeof value==="string"&&Number.isFinite(Date.parse(value)))&&(row.newCount===undefined||typeof row.newCount==="number"&&Number.isInteger(row.newCount)&&row.newCount>=0)))return null;
    return {version:1,generatedAt:data.generatedAt,rows:(data.rows as CollectionHealth["rows"]).map(row=>({id:row.id,brand:row.brand,group:row.group,groupLabel:row.groupLabel,status:row.status,reason:row.reason,...(row.checkedAt!==undefined?{checkedAt:row.checkedAt}:{}),...(row.lastSuccessfulAt!==undefined?{lastSuccessfulAt:row.lastSuccessfulAt}:{}),...(row.newCount!==undefined?{newCount:row.newCount}:{}),...(typeof row.lastFailedAt==="string"&&Number.isFinite(Date.parse(row.lastFailedAt))&&Date.parse(row.lastFailedAt)<=Date.now()?{lastFailedAt:row.lastFailedAt}:{}),...(collectionDiagnostics(row.diagnostics,true)?{diagnostics:collectionDiagnostics(row.diagnostics,true)}:{})}))};
  } catch {return null;}
}
