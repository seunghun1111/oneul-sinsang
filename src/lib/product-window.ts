import type { Product } from "../types/product.ts";

const DAY = 86_400_000;
const DEFAULT_NEW_PRODUCT_DAYS = 90;
const CU_NEW_PRODUCT_DAYS = 30;
const SALE_CHECK_DAYS = 14;

export function seoulDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isDetectedToday(product: Product, now = new Date()) {
  return seoulDateKey(product.firstDetectedAt) === seoulDateKey(now);
}

export function isCurrentlyOnSale(product: Product, now = new Date()) {
  if (!product.isActive) return false;
  const convenienceBrands = new Set(["CU", "세븐일레븐", "이마트24"]);
  const usesFirstDetection = convenienceBrands.has(product.brand);
  const newSince = new Date(usesFirstDetection ? product.firstDetectedAt : product.releaseDate ?? product.firstDetectedAt);
  const displayDays = usesFirstDetection ? CU_NEW_PRODUCT_DAYS : DEFAULT_NEW_PRODUCT_DAYS;
  if (!Number.isFinite(newSince.getTime()) || now.getTime() - newSince.getTime() >= displayDays * DAY) return false;
  return product.availabilityStatus === "on_sale" && Boolean(product.availabilityCheckedAt)
    && now.getTime() - new Date(product.availabilityCheckedAt as string).getTime() <= SALE_CHECK_DAYS * DAY;
}
