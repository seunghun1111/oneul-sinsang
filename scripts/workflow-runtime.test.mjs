import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const names=["checks","deploy-pages","update-products","review-product"];
const workflows=Object.fromEntries(names.map(name=>[name,readFileSync(new URL(`../.github/workflows/${name}.yml`,import.meta.url),"utf8")]));
const requiredNode=readFileSync(new URL("../.node-version",import.meta.url),"utf8").trim();
const rootPackage=JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8"));
const serverPackage=JSON.parse(readFileSync(new URL("../chatgpt-site/package.json",import.meta.url),"utf8"));
const rootNpmConfig=readFileSync(new URL("../.npmrc",import.meta.url),"utf8").trim();
const serverNpmConfig=readFileSync(new URL("../chatgpt-site/.npmrc",import.meta.url),"utf8").trim();
const portableInstaller=readFileSync(new URL("../chatgpt-site/scripts/install-ci.mjs",import.meta.url),"utf8");
const managedInstaller=readFileSync(new URL("../chatgpt-site/scripts/install-ci.sh",import.meta.url),"utf8");
const supportedNode=">=22.23.4 <23 || >=24.22.1 <25 || >=26.12.1 <27";

test("모든 작업은 검증된 OS와 패치된 Node 22 런타임을 사용한다",()=>{
 assert.equal(requiredNode,"22.23.4");
 assert.equal(rootPackage.engines.node,supportedNode);
 assert.equal(serverPackage.engines.node,supportedNode);
 assert.match(rootNpmConfig,/(^|\n)engine-strict=true($|\n)/);
 assert.match(serverNpmConfig,/(^|\n)engine-strict=true($|\n)/);
 for(const [name,text] of Object.entries(workflows)){
  const runners=[...text.matchAll(/runs-on: (.+)/g)].map(match=>match[1]);
  assert.ok(runners.length>0,name);
  assert.ok(runners.every(value=>value==="ubuntu-24.04"),name);
  assert.match(text,/actions\/checkout@v5/);
  assert.match(text,/actions\/setup-node@v5/);
  assert.doesNotMatch(text,/actions\/(checkout|setup-node)@v4/);
  assert.match(text,/node-version-file: \.node-version/);
  assert.doesNotMatch(text,/node-version:\s*22/);
  for(const block of text.split(/actions\/setup-node@v5/).slice(1)){
   assert.ok(block.indexOf('node "$GITHUB_WORKSPACE/scripts/check-node-runtime.mjs"')<block.indexOf("npm ci"),name);
  }
 }
});

test("독립 서버 사이트도 설치 네트워크 접근 전에 런타임을 검증한다",()=>{
 assert.equal(serverPackage.scripts["security:runtime"],"node scripts/check-node-security-runtime.mjs");
 assert.ok(portableInstaller.indexOf('import "./check-node-security-runtime.mjs"')<portableInstaller.indexOf("spawnSync"));
 assert.ok(managedInstaller.indexOf('node "${script_dir}/check-node-security-runtime.mjs"')<managedInstaller.indexOf("curl"));
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
