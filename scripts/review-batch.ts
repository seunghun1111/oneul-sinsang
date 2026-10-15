import type { Product } from "../src/types/product.ts";

export type Decision = { decision: "approved" | "rejected"; reviewedAt: string };

export function parseReviewRequest(title: string, body = "") {
  const single = title.match(/^\[상품 (승인|거절)\]\s+([a-z0-9-]{3,160})$/i);
  const bulk = title.match(/^\[상품 일괄 (승인|거절)\]\s+(\d+)개$/);
  if (!single && !bulk) throw new Error("이슈 제목 형식이 올바르지 않습니다.");
  const decision = (single?.[1] ?? bulk?.[1]) === "승인" ? "approved" : "rejected";
  let ids: unknown = single ? [single[2]] : undefined;
  if (bulk) {
    const block = body.match(/```json\s*([\s\S]*?)```/);
    if (!block) throw new Error("일괄 검수 상품 목록이 없습니다.");
    ids = JSON.parse(block[1]).productIds;
  }
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 50 || ids.some(id => typeof id !== "string" || !/^[a-z0-9-]{3,160}$/i.test(id))) throw new Error("상품 ID는 1~50개의 유효한 값이어야 합니다.");
  const productIds = [...new Set(ids as string[])];
  if (bulk && Number(bulk[2]) !== productIds.length) throw new Error("제목과 상품 수가 다릅니다.");
  return { decision: decision as Decision["decision"], productIds };
}

export function applyReviewBatch(catalog: Product[], coffee: Product[], decisions: Record<string, Decision>, ids: string[], decision: Decision["decision"], reviewedAt: string) {
  const all = new Map([...catalog, ...coffee].map(product => [product.id, product]));
  const uniqueIds = [...new Set(ids)];
  for (const id of uniqueIds) if (!all.has(id)) throw new Error(`상품을 찾을 수 없습니다: ${id}`);
  const nextDecisions = { ...decisions };
  const changedIds = new Set<string>();
  for (const id of uniqueIds) {
    const current = decisions[id]?.decision ?? all.get(id)?.reviewStatus ?? "approved";
    if (current !== decision) {
      nextDecisions[id] = { decision, reviewedAt };
      changedIds.add(id);
    }
  }
  const nextCoffee = coffee.map(product => changedIds.has(product.id) ? {
    ...product, reviewStatus: decision, reviewedAt, updatedAt: reviewedAt,
    availabilityReason: decision === "approved" ? "공식 출처와 현재 판매 여부를 검수해 승인됨" : "공식 신상품 기준 검수에서 제외됨",
  } : product);
  return { coffee: nextCoffee, decisions: nextDecisions, changed: changedIds.size, skipped: uniqueIds.length - changedIds.size };
}
