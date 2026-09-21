import type { ProductCategory, ProductType } from "@/types/product";

export const categoryMeta: Record<ProductCategory, { label: string; emoji: string; color: string }> = {
  convenience: { label: "편의점", emoji: "🏪", color: "#e9f7ef" },
  cafe: { label: "카페", emoji: "☕", color: "#f3eadf" },
  ramen: { label: "라면", emoji: "🍜", color: "#fff0db" },
  snack: { label: "과자", emoji: "🍪", color: "#fff2c8" },
  drink: { label: "음료", emoji: "🥤", color: "#e7f3ff" },
  dessert: { label: "디저트", emoji: "🍰", color: "#ffe9ef" },
  icecream: { label: "아이스크림", emoji: "🍦", color: "#f0eaff" },
  etc: { label: "기타", emoji: "✨", color: "#eef0eb" },
};

export const typeLabel: Record<ProductType, string> = { new: "NEW", seasonal: "SEASON", limited: "LIMITED", renewal: "RENEWAL" };

