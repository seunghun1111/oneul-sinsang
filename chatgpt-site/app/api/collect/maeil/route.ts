import { collectMaeil } from "../../../../lib/collectors/maeil";
import { collectorAuthError, saveCandidates } from "../../../../lib/collectors/run";

export async function POST(request: Request) {
  const authError = collectorAuthError(request);
  if (authError) return authError;

  try {
    const result = await saveCandidates(await collectMaeil());
    return Response.json({ source: "매일유업 공식 보도자료", ...result });
  } catch (error) {
    console.error("maeil:collect", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "공식 자료 수집 또는 저장에 실패했습니다." }, { status: 502 });
  }
}
