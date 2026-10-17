import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const names=["checks","deploy-pages","update-products","review-product"];
const workflows=Object.fromEntries(names.map(name=>[name,readFileSync(new URL(`../.github/workflows/${name}.yml`,import.meta.url),"utf8")]));

test("모든 작업은 검증된 OS와 Node 24 기반 준비 액션을 사용한다",()=>{
 for(const [name,text] of Object.entries(workflows)){
  const runners=[...text.matchAll(/runs-on: (.+)/g)].map(match=>match[1]);
  assert.ok(runners.length>0,name);
  assert.ok(runners.every(value=>value==="ubuntu-24.04"),name);
  assert.match(text,/actions\/checkout@v5/);
  assert.match(text,/actions\/setup-node@v5/);
  assert.doesNotMatch(text,/actions\/(checkout|setup-node)@v4/);
  // Action runtime upgrades must not silently change the application's Node version.
  assert.match(text,/node-version: 22/);
 }
});

test("게시 작업은 공통 Pages 액션을 사용하고 실패 진단은 유지한다",()=>{
 for(const name of ["deploy-pages","update-products","review-product"]){
  assert.match(workflows[name],/actions\/upload-pages-artifact@v4/);
  assert.match(workflows[name],/actions\/deploy-pages@v5/);
  assert.match(workflows[name],/pages: write/);
  assert.match(workflows[name],/id-token: write/);
 }
 assert.match(workflows["update-products"],/actions\/upload-artifact@v6/);
 assert.match(workflows["update-products"],/retention-days: 7/);
});

test("런타임 변경은 일일 일정과 검수 인가 경계를 바꾸지 않는다",()=>{
 assert.match(workflows["update-products"],/cron: "30 21 \* \* \*"/);
 const review=workflows["review-product"];
 for(const role of ["OWNER","MEMBER","COLLABORATOR"]){
  assert.ok(review.includes(`github.event.issue.author_association == '${role}'`));
 }
 assert.doesNotMatch(Object.values(workflows).join("\n"),/pull_request_target|ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION|NODE_TLS_REJECT_UNAUTHORIZED/);
});
