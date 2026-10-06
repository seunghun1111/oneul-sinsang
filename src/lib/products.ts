import type { Product } from "@/types/product";
import productData from "@/data/products.json";
import { coffeeProducts } from "@/data/coffee-products";

const DAY = 86_400_000;
const NEW_PRODUCT_DAYS = 90;
const SALE_CHECK_DAYS = 14;
const allProducts = [...(productData as Product[]), ...coffeeProducts];

export function isCurrentlyOnSale(product: Product, now = new Date()) {
  if (!product.isActive) return false;
  const newSince = new Date(product.releaseDate ?? product.firstDetectedAt);
  if (!Number.isFinite(newSince.getTime()) || now.getTime() - newSince.getTime() > NEW_PRODUCT_DAYS * DAY) return false;
  const officialCheck = product.availabilityStatus === "on_sale" && product.availabilityCheckedAt
    ? now.getTime() - new Date(product.availabilityCheckedAt).getTime() <= SALE_CHECK_DAYS * DAY
    : false;
  return officialCheck;
}

export const products: Product[] = allProducts
  .filter(product => isCurrentlyOnSale(product))
  .toSorted((left, right) => (right.releaseDate ?? right.firstDetectedAt).localeCompare(left.releaseDate ?? left.firstDetectedAt));

export function getProduct(id: string) { return products.find((product) => product.id === id); }
