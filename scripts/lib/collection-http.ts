const restrictedDomains=/(^|\.)(kakaocorp\.com|kakao\.com|daum\.net|daumcorp\.com|kakaosecure\.net|dakao\.io|9rum\.cc|onkakao\.net|daumkakao\.io|daumkakao\.com|daumtools\.com)$/i;
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
export const collectionFetch=createCollectionFetcher();
