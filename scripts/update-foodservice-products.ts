import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Product } from "../src/types/product.ts";
import { collectBurgerKing, collectDominos, collectGoobne, collectKfc, collectLotteria, collectMcDonalds, collectMomstouch, collectPizzaHut, type FoodserviceCandidate } from "./lib/foodservice-collector.ts";
import { mergeProducts } from "./update-static-products.ts";

const dataUrl = new URL("../src/data/products.json", import.meta.url);

export function mergeFoodserviceProducts(existing: Product[], candidates: FoodserviceCandidate[], checkedBrands: string[], checkedAt: string) {
  const current = new Set(candidates.map(candidate => `${candidate.brand}:${candidate.slug}`));
  return mergeProducts(existing, candidates, checkedAt).map(product => {
    if (!checkedBrands.includes(product.brand) || current.has(`${product.brand}:${product.id}`)) return product;
    return { ...product, availabilityStatus: "ended" as const, availabilityCheckedAt: checkedAt, isActive: false, updatedAt: checkedAt };
  });
}

async function main() {
  const checkedAt = new Date().toISOString();
  const sources = [
    ["롯데리아", collectLotteria], ["맥도날드", collectMcDonalds], ["버거킹", collectBurgerKing], ["맘스터치", collectMomstouch],
    ["도미노피자", collectDominos], ["피자헛", collectPizzaHut], ["굽네", collectGoobne], ["KFC", collectKfc],
  ] as const;
  const settled = await Promise.allSettled(sources.map(([, collect]) => collect(checkedAt)));
  const candidates: FoodserviceCandidate[] = [];
  const checkedBrands: string[] = [];
  settled.forEach((result, index) => {
    const brand = sources[index][0];
    if (result.status === "fulfilled") {
      checkedBrands.push(brand);
      candidates.push(...result.value);
      console.log(`${brand}: NEW ${result.value.length}건 확인`);
    } else console.warn(`${brand}: 수집 실패, 기존 데이터 유지`);
  });
  if (checkedBrands.length === 0) throw new Error("외식 브랜드 공식 출처 수집에 모두 실패했습니다.");
  const existing = JSON.parse(await readFile(dataUrl, "utf8")) as Product[];
  await writeFile(dataUrl, `${JSON.stringify(mergeFoodserviceProducts(existing, candidates, checkedBrands, checkedAt), null, 2)}\n`, "utf8");
}

const entry = process.argv[1] ? pathToFileURL(fileURLToPath(new URL(process.argv[1], "file:"))).href : "";
if (import.meta.url === entry) await main();
