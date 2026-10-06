export type StockStatus = "in_stock" | "out_of_stock" | "unknown";

export interface Offer {
  id: string;
  productSlug: string;
  retailer: string;
  title: string;
  url: string;
  price: number;
  regularPrice?: number;
  quantity: number;
  unit: string;
  stockStatus: StockStatus;
  observedAt: string;
  evidenceType?: "official" | "retailer";
}
