import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Product } from "../src/types/product.ts";
import { collectEmart24, collectSevenEleven, type ConvenienceCandidate } from "./lib/convenience-collector.ts";
import { mergeProducts } from "./update-static-products.ts";
import {runBrandCollection} from "./lib/brand-collection-run.ts";
import {guardEmptyNewLists,safeNewListBrands} from "./lib/new-list-safety.ts";

const dataUrl = new URL("../src/data/products.json", import.meta.url);

export function mergeConvenienceProducts(existing: Product[], candidates: ConvenienceCandidate[], checkedBrands: string[], checkedAt: string) {
  checkedBrands=safeNewListBrands(existing,candidates,checkedBrands);
  const current = new Set(candidates.map(candidate => `${candidate.brand}:${candidate.slug}`));
  return mergeProducts(existing, candidates, checkedAt).map(product => {
    if (!checkedBrands.includes(product.brand) || current.has(`${product.brand}:${product.id}`)) return product;
    return { ...product, newStatus: "removed" as const, availabilityStatus: "unknown" as const, availabilityCheckedAt: checkedAt, isActive: false, updatedAt: checkedAt };
  });
}

async function main() {
  const checkedAt = new Date().toISOString();
  const sources = [["세븐일레븐", collectSevenEleven], ["이마트24", collectEmart24]] as const;
  const statusUrl=new URL("../src/data/convenience-collection-status.json",import.meta.url);
  const previous=JSON.parse(await readFile(statusUrl,"utf8"));
  const existing = JSON.parse(await readFile(dataUrl, "utf8")) as Product[];
  const batch=await runBrandCollection<ConvenienceCandidate>(sources,checkedAt,previous.results);
  const {candidates}=batch;
  const report=guardEmptyNewLists(existing,candidates,batch.report,previous.results);
  const checkedBrands=report.results.filter(result=>result.status==="success").map(result=>result.brand);
  await writeFile(statusUrl,JSON.stringify(report,null,2)+"\n");
  for(const result of report.results) console.log(`${result.brand}: ${result.status==="success"?`NEW ${result.newCount}건 확인`:"수집 실패, 기존 데이터 유지"}`);
  if (checkedBrands.length === 0) return; // Status report triggers notification; other collectors must still run.
  await writeFile(dataUrl, `${JSON.stringify(mergeConvenienceProducts(existing, candidates, checkedBrands, checkedAt), null, 2)}\n`, "utf8");
}

const entry = process.argv[1] ? pathToFileURL(fileURLToPath(new URL(process.argv[1], "file:"))).href : "";
if (import.meta.url === entry) await main();
