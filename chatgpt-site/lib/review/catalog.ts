export type ReviewProduct = {
  id: string; name: string; brand: string; category: string; subCategory?: string;
  sourceUrl: string; releaseDate?: string; firstDetectedAt: string; lastCheckedAt: string;
  availabilityStatus?: string; availabilityReason?: string; reviewStatus?: string; reviewedAt?: string;
  decisionSource?: "manual" | "automatic" | "legacy";
  automaticReason?: string; automaticCheckedAt?: string; verifiedDate?: string;
  detectionKind?: "initial" | "newly_detected";
  sourceType?:string;
  reviewEvidence?:import("./discovery-evidence").DiscoveryItem["reviewEvidence"];
  discoveryReferences?:import("./discovery-evidence").DiscoveryReference[];
};
export type AutomaticReview = { products:Record<string,{decision:"approved"|"pending"|"rejected";reason:string;checkedAt:string;verifiedDate?:string}> };
export type ReviewDecision = { decision: "approved" | "rejected"; reviewedAt: string };
export function mergeReviewCatalog(catalog: ReviewProduct[], coffee: ReviewProduct[], decisions: Record<string, ReviewDecision>, automatic?:AutomaticReview) {
  return [...new Map([...catalog, ...coffee].map(product => {
    const decision = decisions[product.id];
    const auto=automatic?.products[product.id];
    return [product.id, { ...product, reviewStatus: decision?.decision ?? auto?.decision ?? product.reviewStatus ?? "approved", reviewedAt: decision?.reviewedAt ?? product.reviewedAt,
      decisionSource:decision?"manual" as const:auto?"automatic" as const:"legacy" as const,
      automaticReason:decision?undefined:auto?.reason,automaticCheckedAt:auto?.checkedAt,verifiedDate:auto?.verifiedDate }];
  })).values()];
}
export function reviewReason(product: ReviewProduct) {
  if(product.decisionSource==="manual") return product.reviewStatus==="approved" ? "관리자가 직접 승인했습니다. 자동 판정보다 우선 적용됩니다." : "관리자가 직접 제외했습니다. 자동 판정보다 우선 적용됩니다.";
  if(product.automaticReason) return product.automaticReason;
  if (product.reviewStatus === "rejected") return "공식 신상품 기준 검수에서 제외된 상품입니다.";
  if (product.reviewStatus === "approved") return product.availabilityReason || "공식 출처의 NEW 표시 또는 신제품 발표에서 확인된 상품입니다.";
  return product.releaseDate
    ? "기존 기록일은 실제 출시일과 다를 수 있습니다. 상품별 공식 NEW 표시를 확인해야 합니다."
    : "상품별 공식 NEW 표시를 확인해야 합니다. 출시일 미공개는 승인 제한 사유가 아닙니다.";
}

