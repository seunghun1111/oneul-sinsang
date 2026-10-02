import { collectBinggrae } from "../lib/collectors/binggrae.ts";
import { collectOrion } from "../lib/collectors/orion.ts";
import { collectSamyang } from "../lib/collectors/samyang.ts";
import { collectMaeil } from "../lib/collectors/maeil.ts";
import { collectPulmuone } from "../lib/collectors/pulmuone.ts";

// Read-only deployment preflight. Do not import the database or save candidates here.
const sources = [
  ["빙그레", collectBinggrae],
  ["오리온", collectOrion],
  ["삼양식품", collectSamyang],
  ["매일유업", collectMaeil],
  ["풀무원", collectPulmuone],
];

const results = await Promise.allSettled(sources.map(([, collect]) => collect()));
let failed = false;
for (const [index, result] of results.entries()) {
  const [name] = sources[index];
  if (result.status === "rejected") {
    failed = true;
    console.log(`${name}: 읽기 실패`);
    continue;
  }
  const rows = result.value;
  if (rows.length === 0) failed = true;
  const latest = rows.map(row => row.announcedDate).filter(Boolean).sort().at(-1) ?? "없음";
  console.log(`${name}: 후보 ${rows.length}건 · 이미지 주소 ${rows.filter(row => row.imageUrl).length}건 · 최근 발표 ${latest}`);
}

if (failed) process.exitCode = 1;
