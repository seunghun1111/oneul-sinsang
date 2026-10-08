import type { Product } from "@/types/product";
import productData from "@/data/products.json";
import { coffeeProducts } from "@/data/coffee-products";
import { isCurrentlyOnSale, seoulDateKey, seoulMonthKey, seoulWeekDateKeys } from "@/lib/product-window";

const allProducts = [...(productData as Product[]), ...coffeeProducts];

export const products: Product[] = allProducts
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
