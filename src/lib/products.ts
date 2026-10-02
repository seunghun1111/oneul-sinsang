import type { Product } from "@/types/product";
import productData from "@/data/products.json";

export const products: Product[] = productData as Product[];

export function getProduct(id: string) { return products.find((product) => product.id === id); }
