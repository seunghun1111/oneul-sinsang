import type { Product } from "../types/product.ts";
import {hasOfficialNewTab} from "../../chatgpt-site/lib/review/official-new.ts";

export const INITIAL_SUMMARY_CUTOFF = "2026-10-19";

export function includeInDiscoverySummary(product: Product, now = new Date()) {
  return seoulDateKey(now) < INITIAL_SUMMARY_CUTOFF || product.detectionKind === "newly_detected";
}


export function seoulDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function seoulMonthKey(value: string | Date) {
  return seoulDateKey(value).slice(0, 7);
}

export function isDetectedToday(product: Product, now = new Date()) {
  return seoulDateKey(product.firstDetectedAt) === seoulDateKey(now);
}

export function seoulWeekDateKeys(now = new Date()) {
  const todayKey = seoulDateKey(now);
  const today = new Date(`${todayKey}T12:00:00Z`);
  const mondayOffset = (today.getUTCDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - mondayOffset + index);
    return date.toISOString().slice(0, 10);
  });
}

export function isDetectedOn(product: Product, dateKey: string) {
  return seoulDateKey(product.firstDetectedAt) === dateKey;
}

export function isCurrentlyOnSale(product: Product, now = new Date()) {
  void now; // Kept for compatibility: NEW visibility has no launch-date window.
  if (product.reviewStatus === "pending" || product.reviewStatus === "rejected") return false;
  return product.isActive && product.newStatus !== "removed" && (product.reviewEvidence?.explicitNew === true||hasOfficialNewTab(product));
}
