import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Product } from "../src/types/product.ts";

const dataUrl = new URL("../src/data/coffee-products-auto.json", import.meta.url);

export function reviewCoffeeProduct(products: Product[], productId: string, decision: "approved" | "rejected", reviewedAt: string) {
  if (!/^[a-z0-9-]{3,160}$/i.test(productId)) throw new Error("올바르지 않은 상품 ID입니다.");
  let matched = false;
  const updated = products.map(product => {
    if (product.id !== productId) return product;
    matched = true;
    return {
      ...product,
      reviewStatus: decision,
      reviewedAt,
      availabilityReason: decision === "approved"
        ? "공식 출처와 현재 판매 여부를 검수해 승인됨"
        : "공식 신상품 기준 검수에서 제외됨",
      updatedAt: reviewedAt,
    } satisfies Product;
  });
  if (!matched) throw new Error(`상품을 찾을 수 없습니다: ${productId}`);
  return updated;
}

async function main() {
  const title = process.env.REVIEW_ISSUE_TITLE ?? "";
  const match = title.match(/^\[상품 (승인|거절)\]\s+([a-z0-9-]{3,160})$/i);
  if (!match) throw new Error("이슈 제목 형식이 올바르지 않습니다.");
  const decision = match[1] === "승인" ? "approved" : "rejected";
  const products = JSON.parse(await readFile(dataUrl, "utf8")) as Product[];
  const reviewedAt = new Date().toISOString();
  await writeFile(dataUrl, `${JSON.stringify(reviewCoffeeProduct(products, match[2], decision, reviewedAt), null, 2)}\n`, "utf8");
  console.log(`${match[2]}: ${decision}`);
}

const entry = process.argv[1] ? pathToFileURL(fileURLToPath(new URL(process.argv[1], "file:"))).href : "";
if (import.meta.url === entry) await main();
