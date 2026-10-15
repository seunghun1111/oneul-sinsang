import type { Product } from "@/types/product";
import productData from "@/data/products.json";
import { coffeeProducts } from "@/data/coffee-products";
import reviewDecisions from "@/data/review-decisions.json";
import autoReview from "@/data/auto-review.json";
import { isCurrentlyOnSale, seoulDateKey, seoulMonthKey, seoulWeekDateKeys } from "@/lib/product-window";

const allProducts = [...(productData as Product[]), ...coffeeProducts];

export const products: Product[] = allProducts
  .map(product => {
    const review = (reviewDecisions as Record<string, { decision: "approved" | "rejected"; reviewedAt: string }>)[product.id];
    const automatic = (autoReview.products as Record<string,{decision:"approved"|"pending"|"rejected";reason:string}>)[product.id];
    return review ? { ...product, reviewStatus:review.decision, reviewedAt:review.reviewedAt } : automatic ? {...product,reviewStatus:automatic.decision,availabilityReason:automatic.reason} : product;
  })
  .filter(product => (reviewDecisions as Record<string, { decision: string }>)[product.id]?.decision !== "rejected")
  .filter(product => isCurrentlyOnSale(product))
  .toSorted((left, right) => (right.releaseDate ?? right.firstDetectedAt).localeCompare(left.releaseDate ?? left.firstDetectedAt));

export function getProduct(id: string) { return products.find((product) => product.id === id); }

export function getWeekProducts(now = new Date()) {
  const week = new Set(seoulWeekDateKeys(now));
  return products.filter(product => product.detectionKind === "newly_detected" && week.has(seoulDateKey(product.firstDetectedAt)));
}

export function getMonthProducts(now = new Date()) {
  const month = seoulMonthKey(now);
  return products.filter(product => product.detectionKind === "newly_detected" && seoulMonthKey(product.firstDetectedAt) === month);
}

export { seoulDateKey, seoulMonthKey, seoulWeekDateKeys };
