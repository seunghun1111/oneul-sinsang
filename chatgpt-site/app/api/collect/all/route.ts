import { collectBinggrae } from "../../../../lib/collectors/binggrae";
import { collectOrion } from "../../../../lib/collectors/orion";
import { collectSamyang } from "../../../../lib/collectors/samyang";
import { collectMaeil } from "../../../../lib/collectors/maeil";
import { collectPulmuone } from "../../../../lib/collectors/pulmuone";
import { runCollectorBatch } from "../../../../lib/collectors/batch";
import { collectorAuthError, saveCandidates } from "../../../../lib/collectors/run";
import { products } from "../../../../db/schema";

const sources = [
  { name: "빙그레 공식 보도자료", collect: collectBinggrae },
  { name: "오리온 공식 보도자료", collect: collectOrion },
  { name: "삼양식품 공식 보도자료", collect: collectSamyang },
  { name: "매일유업 공식 보도자료", collect: collectMaeil },
  { name: "풀무원 공식 보도자료", collect: collectPulmuone },
];

export async function POST(request: Request) {
  const authError = collectorAuthError(request);
  if (authError) return authError;

  const result = await runCollectorBatch<typeof products.$inferInsert>(sources, saveCandidates, (source, error) => {
    console.error("collect:source-failed", source, error instanceof Error ? error.message : "unknown error");
  });
  return Response.json(result, { status: result.succeeded ? 200 : 502 });
}
