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
  subCategory?: string;
  productType: "new";
  price: number | null;
  retailer: string | null;
  releaseDate: string | null;
  announcedDate: string;
  description: string;
  sourceUrl: string;
  sourceType?: "official_site" | "press_release";
  imageUrl: string | null;
};

const dataUrl = new URL("../src/data/products.json", import.meta.url);
const validCategories = new Set<ProductCategory>(["convenience", "cafe", "burger", "pizza", "chicken", "ramen", "meal", "snack", "drink", "dessert", "icecream", "etc"]);

export function mergeProducts(existing: Product[], candidates: Candidate[], checkedAt: string): Product[] {
  const idBasedBrands = new Set(["CU", "세븐일레븐", "이마트24", "롯데리아", "맥도날드", "버거킹", "맘스터치", "도미노피자", "피자헛", "굽네", "교촌치킨", "KFC", "배스킨라빈스"]);
  const identity = (item: Pick<Product, "id" | "brand" | "normalizedName">) => idBasedBrands.has(item.brand) ? `${item.brand}:${item.id}` : `${item.brand}:${item.normalizedName}`;
  const byIdentity = new Map(existing.map(product => [identity(product), product]));
  for (const candidate of candidates) {
    const key = identity({ id: candidate.slug, brand: candidate.brand, normalizedName: candidate.normalizedName });
    const previous = byIdentity.get(key);
    const detectedAt = previous?.firstDetectedAt ?? checkedAt;
    const category = validCategories.has(candidate.category as ProductCategory) ? candidate.category as ProductCategory : "etc";
    byIdentity.set(key, {
      id: previous?.id ?? candidate.slug,
      brand: candidate.brand,
      name: candidate.name,
      normalizedName: candidate.normalizedName,
      category,
      ...(candidate.subCategory ? { subCategory: candidate.subCategory } : previous?.subCategory ? { subCategory: previous.subCategory } : {}),
      productType: candidate.productType,
      currency: "KRW",
      ...(candidate.retailer ? { retailer: candidate.retailer } : previous?.retailer && previous.retailer !== previous.brand ? { retailer: previous.retailer } : {}),
      ...(candidate.imageUrl ? { imageUrl: candidate.imageUrl } : previous?.imageUrl ? { imageUrl: previous.imageUrl } : {}),
      sourceUrl: candidate.sourceUrl,
      sourceType: candidate.sourceType ?? "press_release",
      releaseDate: candidate.sourceType === "official_site"
        ? candidate.releaseDate ?? previous?.releaseDate ?? detectedAt.slice(0, 10)
        : candidate.releaseDate ?? candidate.announcedDate,
      firstDetectedAt: detectedAt,
      lastCheckedAt: checkedAt,
      description: candidate.sourceType === "official_site"
        ? candidate.description
        : `${candidate.brand} 공식 발표에서 확인된 ${candidate.name} 신상품`,
      availabilityStatus: "on_sale",
      availabilityCheckedAt: checkedAt,
      isActive: true,
      createdAt: previous?.createdAt ?? checkedAt,
      updatedAt: checkedAt,
    });
  }
  return [...byIdentity.values()].map((product) => {
    const safeProduct = { ...product };
    delete safeProduct.price;
    if (safeProduct.sourceType !== "official_site") delete safeProduct.imageUrl;
    return {
      ...safeProduct,
      description: safeProduct.sourceType === "official_site"
        ? safeProduct.description
        : `${safeProduct.brand} 공식 발표에서 확인된 ${safeProduct.name} 신상품`,
    };
  }).sort((left, right) =>
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
