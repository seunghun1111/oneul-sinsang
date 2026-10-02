import { collectOrion } from "../../../../lib/collectors/orion";
import { collectorAuthError, saveCandidates } from "../../../../lib/collectors/run";

export async function POST(request: Request) {
  const authError = collectorAuthError(request);
  if (authError) return authError;

  try {
    const result = await saveCandidates(await collectOrion());
    return Response.json({ source: "오리온 공식 보도자료", ...result });
  } catch (error) {
    console.error("orion:collect", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "공식 자료 수집 또는 저장에 실패했습니다." }, { status: 502 });
  }
}
