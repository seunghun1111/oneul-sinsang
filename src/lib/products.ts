import type { Product } from "@/types/product";
import productData from "@/data/products.json";
import { coffeeProducts } from "@/data/coffee-products";
import { isCurrentlyOnSale, isDetectedToday, seoulDateKey } from "@/lib/product-window";

const allProducts = [...(productData as Product[]), ...coffeeProducts];

export const products: Product[] = allProducts
  .filter(product => isCurrentlyOnSale(product))
  .toSorted((left, right) => (right.releaseDate ?? right.firstDetectedAt).localeCompare(left.releaseDate ?? left.firstDetectedAt));

export function getProduct(id: string) { return products.find((product) => product.id === id); }

export function getTodayProducts(now = new Date()) {
  return products.filter(product => isDetectedToday(product, now));
}

export { seoulDateKey };
