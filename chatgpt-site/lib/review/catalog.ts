export type ReviewProduct = {
  id: string; name: string; brand: string; category: string; subCategory?: string;
  sourceUrl: string; releaseDate?: string; firstDetectedAt: string; lastCheckedAt: string;
  availabilityStatus?: string; availabilityReason?: string; reviewStatus?: string; reviewedAt?: string;
};
export type ReviewDecision = { decision: "approved" | "rejected"; reviewedAt: string };
export function mergeReviewCatalog(catalog: ReviewProduct[], coffee: ReviewProduct[], decisions: Record<string, ReviewDecision>) {
  return [...new Map([...catalog, ...coffee].map(product => {
    const decision = decisions[product.id];
    return [product.id, { ...product, reviewStatus: decision?.decision ?? product.reviewStatus ?? "approved", reviewedAt: decision?.reviewedAt ?? product.reviewedAt }];
  })).values()];
}
export function reviewReason(product: ReviewProduct) {
  if (product.reviewStatus === "rejected") return "공식 신상품 기준 검수에서 제외된 상품입니다.";
  if (product.reviewStatus === "approved") return product.availabilityReason || "공식 출처의 NEW 표시 또는 신제품 발표에서 확인된 상품입니다.";
  return product.releaseDate
    ? "공식 페이지 변경에서 감지됐습니다. 변경일과 실제 출시일이 다를 수 있어 최근 30일 출시 여부, NEW 표시와 현재 판매 여부를 확인해야 합니다."
    : "개별 출시일을 확인하지 못했습니다. 최근 30일 신상품인지, 현재 판매 중인지 공식 출처에서 확인해야 합니다.";
}

