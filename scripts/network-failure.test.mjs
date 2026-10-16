import test from "node:test";
import assert from "node:assert/strict";
import {networkFailure} from "./lib/network-failure.ts";
import {createPolicyPreflight} from "./lib/policy-preflight.ts";
test("네트워크 오류 원문 대신 제한된 DNS·TLS·시간초과 코드만 분류한다",()=>{
 for(const [code,result] of [["ENOTFOUND","dns"],["EAI_AGAIN","dns"],["CERT_HAS_EXPIRED","tls"],["SELF_SIGNED_CERT_IN_CHAIN","tls"],["UNABLE_TO_VERIFY_LEAF_SIGNATURE","tls"],["ETIMEDOUT","timeout"],["ECONNRESET","connection"]])assert.equal(networkFailure({cause:{code}}),result);
 assert.equal(networkFailure(new AggregateError([{code:"ENOTFOUND"}],"secret")),"dns");
 assert.equal(networkFailure({message:"CERT_HAS_EXPIRED token=secret"}),"network");
 const cycle={};cycle.cause=cycle;assert.equal(networkFailure(cycle),"network");
});
test("정책 진단 보고서에 원문 오류·민감정보를 기록하지 않는다",async()=>{
 const probe=createPolicyPreflight(async()=>{throw new Error("token=secret-value",{cause:{code:"CERT_HAS_EXPIRED"}});});
 const result=await probe("https://official.example.com/menu");
 assert.equal(result.status,"failed");assert.equal(result.failureKind,"tls");assert.equal(result.reason,"TLS 인증서 검증 실패");
 assert.equal(JSON.stringify(result).includes("secret-value"),false);
});
