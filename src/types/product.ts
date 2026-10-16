export type ProductType = "new" | "seasonal" | "limited" | "renewal";

export type ProductCategory =
  | "convenience"
  | "cafe"
  | "burger"
  | "pizza"
  | "chicken"
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
  newStatus?: "active" | "removed";
  detectionKind?: "initial" | "newly_detected";
  discoveryReferences?: import("../../chatgpt-site/lib/review/discovery-evidence").DiscoveryReference[];
  reviewedAt?: string;
  reviewEvidence?: {
    sourceUrl: string;
    checkedAt: string;
    robots: "allowed" | "not_provided" | "blocked";
    explicitNew?: boolean;
    officialNewListing?: "kyochon_code_21";
    newCheckReason?: "dynamic_page" | "no_new_mark" | "announcement_only" | "source_unavailable";
    officialLaunchAnnouncement?: boolean;
    officialDate?: string;
    dateKind?: "launch" | "announcement";
    saleConfirmed?: boolean;
  };
  robotsPolicyUrl?: string;
  robotsCheckedAt?: string;
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
