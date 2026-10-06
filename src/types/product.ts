export type ProductType = "new" | "seasonal" | "limited" | "renewal";

export type ProductCategory =
  | "convenience"
  | "cafe"
  | "ramen"
  | "meal"
  | "snack"
  | "drink"
  | "dessert"
  | "icecream"
  | "etc";

export interface Product {
  id: string;
  brand: string;
  name: string;
  normalizedName: string;
  category: ProductCategory;
  subCategory?: string;
  productType: ProductType;
  price?: number;
  currency: "KRW";
  retailer?: string;
  availabilityStatus?: "on_sale" | "sold_out" | "ended" | "unknown";
  availabilityCheckedAt?: string;
  lastSeenAt?: string;
  consecutiveMisses?: number;
  availabilityReason?: string;
  reviewStatus?: "pending" | "approved" | "rejected";
  reviewedAt?: string;
  imageUrl?: string;
  sourceUrl: string;
  sourceType: "official_site" | "press_release" | "sns";
  releaseDate?: string;
  firstDetectedAt: string;
  lastCheckedAt: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
