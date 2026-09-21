export type ProductType = "new" | "seasonal" | "limited" | "renewal";

export type ProductCategory =
  | "convenience"
  | "cafe"
  | "ramen"
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

