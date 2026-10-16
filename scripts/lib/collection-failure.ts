import {networkFailure,type NetworkFailure} from "./network-failure.ts";
export type CollectionFailureCode=NetworkFailure|"policy_blocked"|"policy_unavailable"|"restricted"|"http"|"unknown";
const labels:Record<CollectionFailureCode,string>={dns:"DNS 조회 실패",tls:"TLS 인증서 검증 실패",timeout:"요청 시간 초과",connection:"연결 실패",network:"네트워크 요청 실패",policy_blocked:"robots 수집 제한 경로",policy_unavailable:"robots 정책 확인 실패",restricted:"수집 대상 제한",http:"공식 페이지 HTTP 오류",unknown:"상세 원인 미확인"};
export class CollectionFailure extends Error {
 readonly failureCode:CollectionFailureCode;
 constructor(code:CollectionFailureCode){super(labels[code]);this.failureCode=code;this.name="CollectionFailure";}
}
/** Only trusted typed errors and allowlisted system codes; never persist raw messages. */
export function collectionFailureCode(error:unknown):CollectionFailureCode {
 if(error instanceof CollectionFailure)return error.failureCode;
 const network=networkFailure(error);
 return network==="network"?"unknown":network;
}
