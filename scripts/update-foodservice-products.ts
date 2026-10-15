import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Product } from "../src/types/product.ts";
import { collectBurgerKing, collectDominos, collectGoobne, collectKfc, collectKyochon, collectLotteria, collectMcDonalds, collectMomstouch, collectPizzaHut, type FoodserviceCandidate } from "./lib/foodservice-collector.ts";
import { mergeProducts } from "./update-static-products.ts";
import {runBrandCollection} from "./lib/brand-collection-run.ts";
import {guardEmptyNewLists,safeNewListBrands} from "./lib/new-list-safety.ts";

const dataUrl = new URL("../src/data/products.json", import.meta.url);

export function mergeFoodserviceProducts(existing: Product[], candidates: FoodserviceCandidate[], checkedBrands: string[], checkedAt: string) {
  checkedBrands=safeNewListBrands(existing,candidates,checkedBrands);
  const current = new Set(candidates.map(candidate => `${candidate.brand}:${candidate.slug}`));
  return mergeProducts(existing, candidates, checkedAt).map(product => {
    if (!checkedBrands.includes(product.brand) || current.has(`${product.brand}:${product.id}`)) return product;
    return { ...product, newStatus: "removed" as const, availabilityStatus: "unknown" as const, availabilityCheckedAt: checkedAt, isActive: false, updatedAt: checkedAt };
  });
}

async function main() {
  const checkedAt = new Date().toISOString();
  const sources = [
    ["롯데리아", collectLotteria], ["맥도날드", collectMcDonalds], ["버거킹", collectBurgerKing], ["맘스터치", collectMomstouch],
    ["도미노피자", collectDominos], ["피자헛", collectPizzaHut], ["굽네", collectGoobne], ["교촌치킨", collectKyochon], ["KFC", collectKfc],
  ] as const;
  const statusUrl=new URL("../src/data/foodservice-collection-status.json",import.meta.url);
  const previous=JSON.parse(await readFile(statusUrl,"utf8"));
  const existing = JSON.parse(await readFile(dataUrl, "utf8")) as Product[];
  const batch=await runBrandCollection<FoodserviceCandidate>(sources,checkedAt,previous.results);
  const {candidates}=batch;
  const report=guardEmptyNewLists(existing,candidates,batch.report,previous.results);
  const checkedBrands=report.results.filter(result=>result.status==="success").map(result=>result.brand);
  await writeFile(statusUrl,JSON.stringify(report,null,2)+"\n");
  for(const result of report.results) console.log(`${result.brand}: ${result.status==="success"?`NEW ${result.newCount}건 확인`:"수집 실패, 기존 데이터 유지"}`);
  if (checkedBrands.length === 0) return;
  await writeFile(dataUrl, `${JSON.stringify(mergeFoodserviceProducts(existing, candidates, checkedBrands, checkedAt), null, 2)}\n`, "utf8");
}

const entry = process.argv[1] ? pathToFileURL(fileURLToPath(new URL(process.argv[1], "file:"))).href : "";
if (import.meta.url === entry) await main();
