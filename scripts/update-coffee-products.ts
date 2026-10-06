import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { coffeeBrandSources } from "../src/data/coffee-sources.ts";
import type { Product } from "../src/types/product.ts";
import { collectCoffeeSource } from "./lib/coffee-collector.ts";

const dataUrl = new URL("../src/data/coffee-products-auto.json", import.meta.url);

export function mergeCoffeeProducts(existing: Product[], observed: Product[], checkedAt: string, verifiedUrls = new Set<string>()) {
  const byIdentity = new Map(existing.map(product => [`${product.brand}:${product.normalizedName}`, product]));
  const observedIdentities = new Set(observed.map(product => `${product.brand}:${product.normalizedName}`));
  for (const [key, product] of byIdentity) {
    if (!verifiedUrls.has(product.sourceUrl) || observedIdentities.has(key)) continue;
    const consecutiveMisses = (product.consecutiveMisses ?? 0) + 1;
    byIdentity.set(key, { ...product, consecutiveMisses, lastCheckedAt:checkedAt, availabilityCheckedAt:checkedAt, availabilityStatus:consecutiveMisses >= 2 ? "ended" : "unknown", availabilityReason:consecutiveMisses >= 2 ? "공식 상품 목록에서 2회 연속 확인되지 않음" : "공식 상품 목록에서 재확인 대기 중", isActive:consecutiveMisses < 2, updatedAt:checkedAt });
  }
  for (const candidate of observed) {
    const key = `${candidate.brand}:${candidate.normalizedName}`;
    const previous = byIdentity.get(key);
    byIdentity.set(key, { ...candidate, id:previous?.id ?? candidate.id, firstDetectedAt:previous?.firstDetectedAt ?? checkedAt, createdAt:previous?.createdAt ?? checkedAt, lastSeenAt:checkedAt, consecutiveMisses:0, availabilityReason:"공식 상품 목록에서 현재 확인됨", reviewStatus:previous?.reviewStatus ?? "pending", ...(previous?.reviewedAt ? { reviewedAt:previous.reviewedAt } : {}) });
  }
  return [...byIdentity.values()].toSorted((left, right) => right.firstDetectedAt.localeCompare(left.firstDetectedAt) || left.brand.localeCompare(right.brand, "ko-KR"));
}

async function main() {
  const checkedAt = new Date().toISOString();
  const existing = JSON.parse(await readFile(dataUrl, "utf8")) as Product[];
  const settled = await Promise.all(coffeeBrandSources.map(source => collectCoffeeSource(source, checkedAt)));
  const observed = settled.flatMap(result => result.candidates) as Product[];
  const verifiedUrls = new Set(settled.flatMap(result => result.verifiedUrls));
  const checked = settled.reduce((sum, result) => sum + result.checked, 0);
  const failed = settled.reduce((sum, result) => sum + result.failed, 0);
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
