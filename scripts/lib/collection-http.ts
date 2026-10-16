const restrictedDomains=/(^|\.)(kakaocorp\.com|kakao\.com|daum\.net|daumcorp\.com|kakaosecure\.net|dakao\.io|9rum\.cc|onkakao\.net|daumkakao\.io|daumkakao\.com|daumtools\.com)$/i;
import {robotsAllows} from "./robots-policy.ts";
const userAgent="OneulSinsang/1.0 (+non-commercial product index)";

/** Public collection only. Does not authorize a host or override its robots policy. */
export function collectionUrlAllowed(value:string) {
  try {
    const u=new URL(value),host=u.hostname.toLowerCase();
    return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&!restrictedDomains.test(host)
      &&host.includes(".")&&!host.includes(":")&&!/^\d+(?:\.\d+){3}$/.test(host)
      &&!/(^|\.)(localhost|local|internal)$/.test(host);
  }catch{return false;}
}

export function createCollectionFetcher(fetcher:typeof fetch=fetch):typeof fetch {
  return async(input,init)=>{
    const request=input instanceof Request?input:undefined;
    const url=request?.url??String(input);
    if(!collectionUrlAllowed(url))throw Error("수집 대상 URL 제한");
    const headers=new Headers(init?.headers??request?.headers);
    // A public collector must not send application credentials to a third party.
    if(["authorization","proxy-authorization","cookie"].some(key=>headers.has(key)))throw Error("공개 수집 인증정보 전송 제한");
    if(!headers.has("user-agent"))headers.set("user-agent",userAgent);
    const signals=[AbortSignal.timeout(20000),init?.signal??request?.signal].filter((s):s is AbortSignal=>!!s);
    try {
      return await fetcher(input,{...init,headers,credentials:"omit",redirect:"manual",signal:AbortSignal.any(signals)});
    }catch{throw Error("공식 출처 네트워크 요청 실패");}
  };
}
export function createRobotsFetcher(transport:typeof fetch=createCollectionFetcher(),now=()=>Date.now()):typeof fetch {
  const cache=new Map<string,{expiresAt:number;pending:Promise<string>}>();
  async function policy(origin:string,agent:string){
    const key=origin+"\n"+agent,existing=cache.get(key);
    if(existing&&existing.expiresAt>now())return existing.pending;
    const pending=(async()=>{
      const response=await transport(origin+"/robots.txt",{headers:{"user-agent":agent},signal:AbortSignal.timeout(15000)});
      if([404,410].includes(response.status))return "";
      if(!response.ok||!response.body)throw Error("robots 정책 확인 실패");
      const type=response.headers.get("content-type");
      if(type&&!/text\/plain|application\/octet-stream/i.test(type))throw Error("robots 정책 응답 형식 오류");
      const reader=response.body.getReader(),decoder=new TextDecoder();let bytes=0,text="";
      try{while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>512000){await reader.cancel();throw Error("robots 정책 크기 초과");}text+=decoder.decode(chunk.value,{stream:true});}text+=decoder.decode();}finally{reader.releaseLock();}
      if(/<html|<!doctype/i.test(text))throw Error("robots 정책 대신 HTML 응답");
      return text;
    })();
    cache.set(key,{expiresAt:now()+3600000,pending});
    // Cache failures briefly so parallel calls cannot hammer a failing policy endpoint.
    pending.catch(()=>{const item=cache.get(key);if(item?.pending===pending)item.expiresAt=now()+60000;});
    return pending;
  }
  return async(input,init)=>{
    const request=input instanceof Request?input:undefined;
    const raw=request?.url??String(input);
    (init?.signal??request?.signal)?.throwIfAborted();
    if(!collectionUrlAllowed(raw))throw Error("수집 대상 URL 제한");
    const url=new URL(raw),headers=new Headers(init?.headers??request?.headers);
    if(["authorization","proxy-authorization","cookie"].some(key=>headers.has(key)))throw Error("공개 수집 인증정보 전송 제한");
    const agent=headers.get("user-agent")??userAgent;
    if(url.pathname!=="/robots.txt"){
      const text=await policy(url.origin,agent);
      if(!robotsAllows(text,url.href,agent))throw Error("robots 수집 제한 경로");
    }
    (init?.signal??request?.signal)?.throwIfAborted();
    return transport(input,init);
  };
}
export const collectionFetch=createRobotsFetcher();
