import test from "node:test";
import assert from "node:assert/strict";
import {diagnosePolicyResponse} from "./lib/policy-diagnosis.ts";
const check=(status,contentType=null,location=null)=>diagnosePolicyResponse({status,contentType,location},"https://official.example");
test("홈페이지 이동·접근 거절·HTML 응답은 정책 허용으로 표시하지 않는다",()=>{
 assert.equal(check(302,"text/html","https://official.example/").status,"homepage_redirect");
 assert.equal(check(301,null,"/another-policy.txt").status,"policy_redirect");
 assert.equal(check(302).status,"invalid_redirect");
 assert.equal(check(403,"text/html").status,"access_denied");
 assert.equal(check(200,"text/html").status,"invalid_content_type");
 assert.equal(check(503).status,"http_error");
});
test("robots 미제공·본문 미검증을 구분하고 원문·이동 URL을 저장하지 않는다",()=>{
 assert.equal(check(404,"text/html").status,"not_provided");
 assert.equal(check(200,"text/plain").status,"body_verification_required");
 const result=check(302,"text/html","https://official.example/?token=not-stored");
 assert.equal(JSON.stringify(result).includes("token"),false);
 assert.equal(JSON.stringify(result).includes("official.example"),false);
});
