import type { Product } from "@/types/product";
import productData from "@/data/products.json";
import { coffeeProducts } from "@/data/coffee-products";
import reviewDecisions from "@/data/review-decisions.json";
import { isCurrentlyOnSale, seoulDateKey, seoulMonthKey, seoulWeekDateKeys } from "@/lib/product-window";

const allProducts = [...(productData as Product[]), ...coffeeProducts];

export const products: Product[] = allProducts
  .map(product => {
    const review = (reviewDecisions as Record<string, { decision: "approved" | "rejected"; reviewedAt: string }>)[product.id];
    return review ? { ...product, reviewStatus:review.decision, reviewedAt:review.reviewedAt } : product;
  })
  .filter(product => (reviewDecisions as Record<string, { decision: string }>)[product.id]?.decision !== "rejected")
  .filter(product => isCurrentlyOnSale(product))
  .toSorted((left, right) => (right.releaseDate ?? right.firstDetectedAt).localeCompare(left.releaseDate ?? left.firstDetectedAt));

export function getProduct(id: string) { return products.find((product) => product.id === id); }

export function getWeekProducts(now = new Date()) {
  const week = new Set(seoulWeekDateKeys(now));
  return products.filter(product => week.has(seoulDateKey(product.firstDetectedAt)));
}

export function getMonthProducts(now = new Date()) {
  const month = seoulMonthKey(now);
  return products.filter(product => seoulMonthKey(product.firstDetectedAt) === month);
}

export { seoulDateKey, seoulMonthKey, seoulWeekDateKeys };
