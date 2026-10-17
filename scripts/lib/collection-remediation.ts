export function collectionRemediation(codes:readonly string[],unexpectedEmpty=false){
 const has=(...values:string[])=>values.some(value=>codes.includes(value));
 if(has("policy_blocked","restricted"))return {category:"policy_hold",action:"현재 경로 수집 보류. 허용된 공식 대체 경로만 검토하며 제한을 우회하지 않습니다."};
 if(has("policy_unavailable"))return {category:"policy_recheck",action:"robots 정책 확인 후 재시도. 정책 미확인을 허용으로 간주하지 않습니다."};
 if(has("tls"))return {category:"certificate",action:"공식 인증서·호스트 상태 확인. TLS 검증을 끄지 않고 정상 공식 대체 주소만 검토합니다."};
 if(has("dns","http"))return {category:"route_recheck",action:"공식 홈페이지에서 현재 메뉴 주소·응답 상태를 재확인합니다."};
 if(unexpectedEmpty||has("structure"))return {category:"parser_recheck",action:"공식 상품 카드·NEW 표시 구조를 점검합니다. 기존 상품의 NEW 종료로 처리하지 않습니다."};
 if(has("timeout","connection","network"))return {category:"transient",action:"다음 정기 수집에서 재확인합니다. 실패로 기존 상품을 삭제하지 않습니다."};
 return {category:codes.length?"unknown":"checked",action:codes.length?"상세 원인 확인 필요. 기존 데이터 유지.":"진단 응답 확인. 상품·운영 상태는 갱신하지 않았습니다."};
}
