import type { Product } from "@/types/product";
import productData from "@/data/products.json";
import { coffeeProducts } from "@/data/coffee-products";

export const products: Product[] = [...(productData as Product[]), ...coffeeProducts]
  .filter((product) => product.isActive)
  .toSorted((left, right) => (right.releaseDate ?? right.firstDetectedAt).localeCompare(left.releaseDate ?? left.firstDetectedAt));

export function getProduct(id: string) { return products.find((product) => product.id === id); }
