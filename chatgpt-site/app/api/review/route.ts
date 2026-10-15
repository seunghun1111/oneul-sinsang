import { getChatGPTUser } from "../../chatgpt-auth";
import { mergeReviewCatalog, type ReviewProduct, type ReviewDecision } from "../../../lib/review/catalog";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!await getChatGPTUser()) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const base = "https://raw.githubusercontent.com/seunghun1111/oneul-sinsang/main/src/data/";
  try {
    const responses = await Promise.all(["products.json", "coffee-products-auto.json", "review-decisions.json"].map(file => fetch(base + file, { cache: "no-store", signal: AbortSignal.timeout(15000) })));
    if (responses.some(response => !response.ok)) throw new Error("source unavailable");
    const [catalog, coffee, decisions] = await Promise.all(responses.map(response => response.json())) as [ReviewProduct[], ReviewProduct[], Record<string, ReviewDecision>];
    return Response.json({ products: mergeReviewCatalog(catalog, coffee, decisions), loadedAt: new Date().toISOString() }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "검수 데이터를 불러오지 못했습니다. 잠시 후 다시 시도하세요." }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}

