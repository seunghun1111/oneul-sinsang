import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { collectBinggrae } from "../chatgpt-site/lib/collectors/binggrae.ts";
import { collectMaeil } from "../chatgpt-site/lib/collectors/maeil.ts";
import { collectOrion } from "../chatgpt-site/lib/collectors/orion.ts";
import { collectPulmuone } from "../chatgpt-site/lib/collectors/pulmuone.ts";
import { collectSamyang } from "../chatgpt-site/lib/collectors/samyang.ts";
import type { Product, ProductCategory } from "../src/types/product.ts";

type Candidate = {
  slug: string;
  brand: string;
  name: string;
  normalizedName: string;
  category: string;
  productType: "new";
  price: number | null;
  retailer: string;
  releaseDate: string | null;
  announcedDate: string;
  description: string;
  sourceUrl: string;
  imageUrl: string | null;
};

const dataUrl = new URL("../src/data/products.json", import.meta.url);
const validCategories = new Set<ProductCategory>(["convenience", "cafe", "ramen", "meal", "snack", "drink", "dessert", "icecream", "etc"]);

export function mergeProducts(existing: Product[], candidates: Candidate[], checkedAt: string): Product[] {
  const byIdentity = new Map(existing.map(product => [`${product.brand}:${product.normalizedName}`, product]));
  for (const candidate of candidates) {
    const key = `${candidate.brand}:${candidate.normalizedName}`;
    const previous = byIdentity.get(key);
    const detectedAt = previous?.firstDetectedAt ?? checkedAt;
    const category = validCategories.has(candidate.category as ProductCategory) ? candidate.category as ProductCategory : "etc";
    byIdentity.set(key, {
      id: previous?.id ?? candidate.slug,
      brand: candidate.brand,
      name: candidate.name,
      normalizedName: candidate.normalizedName,
      category,
      productType: candidate.productType,
      ...(candidate.price == null ? {} : { price: candidate.price }),
      currency: "KRW",
      retailer: candidate.retailer,
      ...(candidate.imageUrl ? { imageUrl: candidate.imageUrl } : previous?.imageUrl ? { imageUrl: previous.imageUrl } : {}),
      sourceUrl: candidate.sourceUrl,
      sourceType: "press_release",
      releaseDate: candidate.releaseDate ?? candidate.announcedDate,
      firstDetectedAt: detectedAt,
      lastCheckedAt: checkedAt,
      description: candidate.description,
      isActive: true,
      createdAt: previous?.createdAt ?? checkedAt,
      updatedAt: checkedAt,
    });
  }
  return [...byIdentity.values()].sort((left, right) =>
    (right.releaseDate ?? right.firstDetectedAt).localeCompare(left.releaseDate ?? left.firstDetectedAt) || left.brand.localeCompare(right.brand, "ko-KR")
  );
}

async function main() {
  const existing = JSON.parse(await readFile(dataUrl, "utf8")) as Product[];
  const sources = [
    ["빙그레", collectBinggrae], ["매일유업", collectMaeil], ["오리온", collectOrion],
    ["풀무원", collectPulmuone], ["삼양식품", collectSamyang],
  ] as const;
  const settled = await Promise.allSettled(sources.map(([, collect]) => collect()));
  const candidates: Candidate[] = [];
  let succeeded = 0;
  settled.forEach((result, index) => {
    const source = sources[index][0];
    if (result.status === "fulfilled" && result.value.length > 0) {
      candidates.push(...result.value as Candidate[]);
      succeeded++;
      console.log(`${source}: ${result.value.length}건 확인`);
    } else {
      console.warn(`${source}: 수집 실패, 기존 데이터 유지`);
    }
  });
  if (succeeded === 0) throw new Error("모든 공식 출처 수집에 실패했습니다.");
  const products = mergeProducts(existing, candidates, new Date().toISOString());
  await writeFile(dataUrl, `${JSON.stringify(products, null, 2)}\n`, "utf8");
  console.log(`정적 상품 데이터 ${products.length}건 저장 완료`);
}

const entry = process.argv[1] ? pathToFileURL(fileURLToPath(new URL(process.argv[1], "file:"))).href : "";
if (import.meta.url === entry) await main();
