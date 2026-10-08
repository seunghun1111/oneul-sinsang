import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Product } from "../src/types/product.ts";
import { collectBaskinRobbins, type IcecreamCandidate } from "./lib/icecream-collector.ts";
import { mergeProducts } from "./update-static-products.ts";

const dataUrl = new URL("../src/data/products.json", import.meta.url);

export function mergeIcecreamProducts(existing: Product[], candidates: IcecreamCandidate[], checkedAt: string) {
  const currentIds = new Set(candidates.map(candidate => candidate.slug));
  return mergeProducts(existing, candidates, checkedAt).map(product => {
    if (product.brand !== "배스킨라빈스" || currentIds.has(product.id)) return product;
    return { ...product, availabilityStatus: "ended" as const, availabilityCheckedAt: checkedAt, isActive: false, updatedAt: checkedAt };
  });
}

async function main() {
  const checkedAt = new Date().toISOString();
  const candidates = await collectBaskinRobbins(checkedAt);
  const existing = JSON.parse(await readFile(dataUrl, "utf8")) as Product[];
  await writeFile(dataUrl, `${JSON.stringify(mergeIcecreamProducts(existing, candidates, checkedAt), null, 2)}\n`, "utf8");
  console.log(`배스킨라빈스: NEW ${candidates.length}건 확인`);
}

const entry = process.argv[1] ? pathToFileURL(fileURLToPath(new URL(process.argv[1], "file:"))).href : "";
if (import.meta.url === entry) await main();
