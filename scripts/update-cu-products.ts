import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Product } from "../src/types/product.ts";
import { collectCu, type CuCandidate } from "./lib/cu-collector.ts";
import { mergeProducts } from "./update-static-products.ts";

const dataUrl = new URL("../src/data/products.json", import.meta.url);

export function mergeCuProducts(existing: Product[], candidates: CuCandidate[], checkedAt: string) {
  const currentIds = new Set(candidates.map(candidate => candidate.slug));
  return mergeProducts(existing, candidates, checkedAt).map(product => {
    if (product.brand !== "CU" || currentIds.has(product.id)) return product;
    return {
      ...product,
      availabilityStatus: "ended" as const,
      availabilityCheckedAt: checkedAt,
      isActive: false,
      updatedAt: checkedAt,
    };
  });
}

async function main() {
  const checkedAt = new Date().toISOString();
  const existing = JSON.parse(await readFile(dataUrl, "utf8")) as Product[];
  const candidates = await collectCu(checkedAt);
  if (candidates.length === 0) throw new Error("CU 공식 목록에서 NEW 배지 상품을 찾지 못해 기존 데이터를 유지합니다.");
  const products = mergeCuProducts(existing, candidates, checkedAt);
  await writeFile(dataUrl, `${JSON.stringify(products, null, 2)}\n`, "utf8");
  console.log(`CU 공식 NEW 상품 ${candidates.length}건 반영 완료`);
}

const entry = process.argv[1] ? pathToFileURL(fileURLToPath(new URL(process.argv[1], "file:"))).href : "";
if (import.meta.url === entry) await main();
