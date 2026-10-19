import {collectionFailureCode} from "./collection-failure.ts";
const transient=new Set(["timeout","connection","network"]);
export const isTransientCollectionFailure=(codes:readonly string[])=>codes.length>0&&codes.every(code=>transient.has(code));
/** Only public, read-only collection operations. At most one retry; never TLS/policy bypass. */
export async function retryCollection<T>(operation:()=>Promise<T>,codes:(result:T)=>readonly string[]=()=>[],wait:()=>Promise<void>=()=>new Promise(resolve=>setTimeout(resolve,500))):Promise<T>{
 try{const result=await operation();if(!isTransientCollectionFailure(codes(result)))return result;}
 catch(error){if(!isTransientCollectionFailure([collectionFailureCode(error)]))throw error;}
 await wait();
 return operation();
}
