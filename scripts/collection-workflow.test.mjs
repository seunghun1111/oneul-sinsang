import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const workflow=readFileSync(new URL("../.github/workflows/update-products.yml",import.meta.url),"utf8");
test("일일 수집은 오래된 결과 게시를 막고 저장 실패 진단과 알림을 유지한다",()=>{
 const guard=workflow.indexOf("name: Reject stale collection results");
 assert.ok(guard>0 && guard<workflow.indexOf("uses: actions/upload-pages-artifact"));
 assert.ok(workflow.includes('"$remote_head" != "$GITHUB_SHA"'));
 const commit=workflow.indexOf("name: Commit updated product data");
 assert.ok(workflow.indexOf("name: Preserve collection diagnostics on failure")>commit);
 assert.ok(workflow.indexOf("name: Notify failures occurring after the regular digest")>commit);
 assert.match(workflow,/retention-days: 7/);
 assert.ok(!workflow.includes("git push --force"));
});
