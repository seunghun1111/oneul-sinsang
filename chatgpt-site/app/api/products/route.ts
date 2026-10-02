import { asc, desc, notInArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { products } from "../../../db/schema";

// 이전 데모 버전에서 자동 생성한 허구의 상품. 기존 DB는 변경하지 않고 조회에서만 제외한다.
const legacyDemoSlugs = ["autumn-cream-latte", "shin-gold-cup", "marron-cream-bread", "zero-peach-ade"];
const noStoreHeaders = { "cache-control": "no-store" };

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select({
      id: products.id,
      brand: products.brand,
      name: products.name,
      category: products.category,
      productType: products.productType,
      price: products.price,
      releaseDate: products.releaseDate,
      announcedDate: products.announcedDate,
      description: products.description,
      sourceUrl: products.sourceUrl,
      imageUrl: products.imageUrl,
      emoji: products.emoji,
    }).from(products)
      .where(notInArray(products.slug, legacyDemoSlugs))
      .orderBy(desc(products.announcedDate), desc(products.createdAt), asc(products.brand));
    return Response.json({ products: rows }, { headers: noStoreHeaders });
  } catch (error) {
    console.error("products:get", error);
    return Response.json({ error: "상품 데이터를 불러오지 못했습니다." }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST() {
  return Response.json({ error: "공개 상품 등록은 중단되었습니다." }, { status: 403, headers: noStoreHeaders });
}
