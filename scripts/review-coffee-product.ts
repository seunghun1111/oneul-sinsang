import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Product } from "../src/types/product.ts";
import { applyReviewBatch, parseReviewRequest } from "./review-batch.ts";

const dataUrl = new URL("../src/data/coffee-products-auto.json", import.meta.url);
const catalogUrl = new URL("../src/data/products.json", import.meta.url);
const decisionsUrl = new URL("../src/data/review-decisions.json", import.meta.url);

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
  const { decision, productIds } = parseReviewRequest(title, process.env.REVIEW_ISSUE_BODY ?? "");
  const products = JSON.parse(await readFile(dataUrl, "utf8")) as Product[];
  const catalog = JSON.parse(await readFile(catalogUrl, "utf8")) as Product[];
  const reviewedAt = new Date().toISOString();
  const decisions = JSON.parse(await readFile(decisionsUrl, "utf8"));
  const result = applyReviewBatch(catalog, products, decisions, productIds, decision, reviewedAt);
  if (result.changed > 0) {
    await writeFile(dataUrl, `${JSON.stringify(result.coffee, null, 2)}\n`, "utf8");
    await writeFile(decisionsUrl, `${JSON.stringify(result.decisions, null, 2)}\n`, "utf8");
  }
  const summary = `검수 처리 결과: ${decision === "approved" ? "승인" : "제외"}\n\n요청 ${productIds.length}개 · 변경 ${result.changed}개 · 동일 상태로 건너뜀 ${result.skipped}개\n`;
  if (process.env.REVIEW_REPORT_PATH) await writeFile(process.env.REVIEW_REPORT_PATH, summary, "utf8");
  console.log(summary);
}

const entry = process.argv[1] ? pathToFileURL(fileURLToPath(new URL(process.argv[1], "file:"))).href : "";
if (import.meta.url === entry) await main();
