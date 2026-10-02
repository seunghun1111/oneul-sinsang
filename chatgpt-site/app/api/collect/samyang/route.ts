import { collectSamyang } from "../../../../lib/collectors/samyang";
import { collectorAuthError, saveCandidates } from "../../../../lib/collectors/run";

export async function POST(request: Request) {
  const authError = collectorAuthError(request);
  if (authError) return authError;

  try {
    const result = await saveCandidates(await collectSamyang());
    return Response.json({ source: "삼양식품 공식 보도자료", ...result });
  } catch (error) {
    console.error("samyang:collect", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "공식 자료 수집 또는 저장에 실패했습니다." }, { status: 502 });
  }
}
