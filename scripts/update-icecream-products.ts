import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Product } from "../src/types/product.ts";
import { collectBaskinRobbins, type IcecreamCandidate } from "./lib/icecream-collector.ts";
import { mergeProducts } from "./update-static-products.ts";
import {runBrandCollection} from "./lib/brand-collection-run.ts";
import {guardEmptyNewLists,safeNewListBrands} from "./lib/new-list-safety.ts";

const dataUrl = new URL("../src/data/products.json", import.meta.url);

export function mergeIcecreamProducts(existing: Product[], candidates: IcecreamCandidate[], checkedAt: string) {
  if(!safeNewListBrands(existing,candidates,["배스킨라빈스"]).includes("배스킨라빈스")) return existing;
  const currentIds = new Set(candidates.map(candidate => candidate.slug));
  return mergeProducts(existing, candidates, checkedAt).map(product => {
    if (product.brand !== "배스킨라빈스" || currentIds.has(product.id)) return product;
    return { ...product, newStatus: "removed" as const, availabilityStatus: "unknown" as const, availabilityCheckedAt: checkedAt, isActive: false, updatedAt: checkedAt };
  });
}

async function main() {
  const checkedAt = new Date().toISOString();
  const existing = JSON.parse(await readFile(dataUrl, "utf8")) as Product[];
  const statusUrl=new URL("../src/data/icecream-collection-status.json",import.meta.url);
  const previous=JSON.parse(await readFile(statusUrl,"utf8"));
  const batch=await runBrandCollection<IcecreamCandidate>([["배스킨라빈스",collectBaskinRobbins]],checkedAt,previous.results);
  const {candidates}=batch;
  const report=guardEmptyNewLists(existing,candidates,batch.report,previous.results);
  await writeFile(statusUrl,JSON.stringify(report,null,2)+"\n");
  if(report.results.some(result=>result.status==="failed")) {console.warn("배스킨라빈스: 조회 실패 또는 갑작스러운 0건, 기존 데이터 유지");return;}
  await writeFile(dataUrl, `${JSON.stringify(mergeIcecreamProducts(existing, candidates, checkedAt), null, 2)}\n`, "utf8");
  console.log(`배스킨라빈스: NEW ${candidates.length}건 확인`);
}

const entry = process.argv[1] ? pathToFileURL(fileURLToPath(new URL(process.argv[1], "file:"))).href : "";
if (import.meta.url === entry) await main();
