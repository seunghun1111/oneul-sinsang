export type NetworkFailure="dns"|"tls"|"timeout"|"connection"|"network";
/** Classify allowlisted error codes only. Never serialize messages, stacks or raw causes. */
export function networkFailure(error:unknown):NetworkFailure {
 const queue:unknown[]=[error],seen=new Set<unknown>();
 for(let i=0;i<queue.length&&i<12;i++){
  const value=queue[i];if(!value||typeof value!=="object"||seen.has(value))continue;seen.add(value);
  const item=value as {code?:unknown;name?:unknown;cause?:unknown;errors?:unknown};
  if(["ENOTFOUND","EAI_AGAIN"].includes(String(item.code)))return "dns";
  if(["SELF_SIGNED_CERT_IN_CHAIN","UNABLE_TO_VERIFY_LEAF_SIGNATURE","CERT_HAS_EXPIRED","DEPTH_ZERO_SELF_SIGNED_CERT","ERR_TLS_CERT_ALTNAME_INVALID","UNABLE_TO_GET_ISSUER_CERT_LOCALLY"].includes(String(item.code)))return "tls";
  if(["ETIMEDOUT","UND_ERR_CONNECT_TIMEOUT","UND_ERR_HEADERS_TIMEOUT"].includes(String(item.code))||["TimeoutError","AbortError"].includes(String(item.name)))return "timeout";
  if(["ECONNRESET","ECONNREFUSED","EHOSTUNREACH"].includes(String(item.code)))return "connection";
  if(item.cause)queue.push(item.cause);
  if(Array.isArray(item.errors))queue.push(...item.errors.slice(0,4));
 }
 return "network";
}
export const networkFailureLabels:Record<NetworkFailure,string>={dns:"DNS 조회 실패",tls:"TLS 인증서 검증 실패",timeout:"정책 요청 시간 초과",connection:"정책 연결 실패",network:"정책 네트워크 확인 실패"};
