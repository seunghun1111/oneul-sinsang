import {readFile,writeFile} from "node:fs/promises";
import {collectionFetch} from "./lib/collection-http.ts";
import {coffeeProductImageResults} from "./lib/coffee-images.ts";
import {robotsAllows} from "./lib/manual-brand-collector.ts";
import type {Product} from "../src/types/product.ts";
const sources=[
 {brand:"빽다방",url:"https://paikdabang.com/menu/menu_new/"},
 {brand:"이디야커피",url:"https://www.ediya.com/contents/drink.html"},
 {brand:"할리스",url:"https://www.hollys.co.kr/menu/md.do"},
];
const dataUrl=new URL("../src/data/coffee-products-auto.json",import.meta.url);
const products=JSON.parse(await readFile(dataUrl,"utf8")) as Product[];
const init={redirect:"manual" as const,headers:{"user-agent":"OneulSinsang/1.0 (+non-commercial product index)"}};
async function boundedText(response:Response){
 if(!response.body)throw Error("empty");
 const reader=response.body.getReader(),decoder=new TextDecoder();let bytes=0,result="";
 try{while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>2_000_000){await reader.cancel();throw Error("too_large");}result+=decoder.decode(chunk.value,{stream:true});}return result+decoder.decode();}finally{reader.releaseLock();}
}
let updated=0;
const checkedAt=new Date().toISOString();
const results:{brand:string;status:string;matched:number;updated:number;unresolved:{id:string;name:string;reason:string;candidateCount?:number}[]}[]=[];
for(const source of sources){
 try{
  const policy=await collectionFetch(new URL("/robots.txt",source.url),{...init,signal:AbortSignal.timeout(15000)});
  if(!policy.ok&&![404,410].includes(policy.status))throw Error("policy");
  if(policy.ok){const text=await boundedText(policy);if(/<html|<!doctype/i.test(text)||!robotsAllows(text,source.url))throw Error("policy");}
  const response=await collectionFetch(source.url,{...init,signal:AbortSignal.timeout(15000)});
  if(!response.ok||!response.headers.get("content-type")?.includes("text/html"))throw Error("response");
  const {images,ambiguous}=coffeeProductImageResults(await boundedText(response),source.url);
  let changed=0,missing=0,matched=0;
  const unresolved:{id:string;name:string;reason:string;candidateCount?:number}[]=[];
  for(const product of products.filter(p=>p.brand===source.brand&&p.isActive)){
    const image=images.get(product.normalizedName);
    if(!image){if(!product.imageUrl){missing++;const count=ambiguous.get(product.normalizedName);unresolved.push({id:product.id,name:product.name,reason:count?"ambiguous_images":"not_found",...(count?{candidateCount:count}:{})});}continue;}
    matched++;
    if(image!==product.imageUrl){product.imageUrl=image;changed++;}
  }
  updated+=changed;
  results.push({brand:source.brand,status:"checked",matched,updated:changed,unresolved});
  console.log(`${source.brand}: 이미지 ${changed}건 보완, 미확인 ${missing}건 보존`);
 }catch{results.push({brand:source.brand,status:"source_unavailable",matched:0,updated:0,unresolved:[]});console.warn(`${source.brand}: 이미지 확인 실패, 기존 상품·검수 상태 유지`);}
}
if(updated)await writeFile(dataUrl,JSON.stringify(products,null,2)+"\n");
await writeFile(new URL("../src/data/coffee-image-status.json",import.meta.url),JSON.stringify({checkedAt,results},null,2)+"\n");
