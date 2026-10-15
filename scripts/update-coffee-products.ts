import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { coffeeBrandSources } from "../src/data/coffee-sources.ts";
import type { Product } from "../src/types/product.ts";
import { collectCoffeeSource, collectStarbucksFromSitemaps } from "./lib/coffee-collector.ts";
import {guardCoffeeEmptyNewLists,runCoffeeCollection,safeCoffeeVerifiedUrls} from "./lib/coffee-collection-run.ts";

const dataUrl = new URL("../src/data/coffee-products-auto.json", import.meta.url);

export function mergeCoffeeProducts(existing: Product[], observed: Product[], checkedAt: string, verifiedUrls = new Set<string>()) {
  verifiedUrls=safeCoffeeVerifiedUrls(existing,observed,verifiedUrls).verifiedUrls;
  const byIdentity = new Map(existing.map(product => [`${product.brand}:${product.normalizedName}`, product]));
  const observedIdentities = new Set(observed.map(product => `${product.brand}:${product.normalizedName}`));
  for (const [key, product] of byIdentity) {
    if (!verifiedUrls.has(product.sourceUrl) || observedIdentities.has(key)) continue;
    const consecutiveMisses = (product.consecutiveMisses ?? 0) + 1;
    byIdentity.set(key, { ...product, consecutiveMisses, lastCheckedAt:checkedAt, availabilityCheckedAt:checkedAt, newStatus:consecutiveMisses >= 2 ? "removed" : product.newStatus, availabilityStatus:"unknown", availabilityReason:consecutiveMisses >= 2 ? "공식 NEW 목록에서 2회 연속 확인되지 않음 (판매 종료 아님)" : "공식 상품 목록에서 재확인 대기 중", isActive:consecutiveMisses < 2, updatedAt:checkedAt });
  }
  for (const candidate of observed) {
    const key = `${candidate.brand}:${candidate.normalizedName}`;
    const previous = byIdentity.get(key);
    byIdentity.set(key, { ...candidate, ...(previous?.detectionKind ? {detectionKind:previous.detectionKind} : {}), newStatus:"active", id:previous?.id ?? candidate.id, firstDetectedAt:previous?.firstDetectedAt ?? checkedAt, createdAt:previous?.createdAt ?? checkedAt, lastSeenAt:checkedAt, consecutiveMisses:0, availabilityReason:"공식 NEW 목록에서 확인됨", reviewStatus:previous?.reviewStatus ?? "pending", ...(previous?.reviewedAt ? { reviewedAt:previous.reviewedAt } : {}) });
  }
  return [...byIdentity.values()].toSorted((left, right) => right.firstDetectedAt.localeCompare(left.firstDetectedAt) || left.brand.localeCompare(right.brand, "ko-KR"));
}

async function main() {
  const checkedAt = new Date().toISOString();
  const existing = JSON.parse(await readFile(dataUrl, "utf8")) as Product[];
  const statusUrl=new URL("../src/data/coffee-collection-status.json",import.meta.url);
  const previous=JSON.parse(await readFile(statusUrl,"utf8"));
  const batch=await runCoffeeCollection(coffeeBrandSources,checkedAt,source=>source.id === "starbucks" ? collectStarbucksFromSitemaps(source, checkedAt) : collectCoffeeSource(source, checkedAt),previous.results);
  const {observed}=batch;
  const {verifiedUrls,report}=guardCoffeeEmptyNewLists(existing,observed,batch.verifiedUrls,batch.report,previous.results);
  await writeFile(statusUrl,JSON.stringify(report,null,2)+"\n");
  const checked = report.results.reduce((sum, result) => sum + result.checked, 0);
  const failed = report.results.reduce((sum, result) => sum + result.failed, 0);
  if (checked === 0) {
    console.warn(`커피 공식 경로를 확인하지 못해 기존 데이터 ${existing.length}건을 유지합니다.`);
    return;
  }
  const merged = mergeCoffeeProducts(existing, observed, checkedAt, verifiedUrls);
  await writeFile(dataUrl, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(`커피 공식 경로 ${checked}개 확인, ${failed}개 실패, 신상품 ${observed.length}건 감지`);
}

const entry = process.argv[1] ? pathToFileURL(fileURLToPath(new URL(process.argv[1], "file:"))).href : "";
if (import.meta.url === entry) await main();
