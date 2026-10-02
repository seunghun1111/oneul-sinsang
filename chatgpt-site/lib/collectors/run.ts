import { env } from "cloudflare:workers";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { products } from "../../db/schema";
import { requireCandidates } from "./batch";
import { changesForExisting } from "./merge";

type Candidate = typeof products.$inferInsert;

function equalSecret(actual: string, expected: string) {
  const a = new TextEncoder().encode(actual);
  const b = new TextEncoder().encode(expected);
  let difference = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index++) difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  return difference === 0;
}

export function collectorAuthError(request: Request): Response | null {
  const configuredToken = env.COLLECTOR_TOKEN;
  if (!configuredToken) return Response.json({ error: "수집 기능이 설정되지 않았습니다." }, { status: 503 });
  const providedToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!equalSecret(providedToken, configuredToken)) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  return null;
}

export async function saveCandidates(candidates: Candidate[]) {
  requireCandidates(candidates);
  const db = getDb();
  let created = 0;
  let updated = 0;
  let updatedImages = 0;
  let updatedDates = 0;
  for (const candidate of candidates) {
    const inserted = await db.insert(products).values(candidate).onConflictDoNothing().returning({ id: products.id });
    created += inserted.length;
    if (inserted.length) continue;
    const [existing] = await db.select({ id: products.id, sourceUrl: products.sourceUrl, imageUrl: products.imageUrl, announcedDate: products.announcedDate, category: products.category, emoji: products.emoji, description: products.description })
      .from(products)
      .where(and(eq(products.brand, candidate.brand), eq(products.normalizedName, candidate.normalizedName)))
      .limit(1);
    if (existing?.sourceUrl !== candidate.sourceUrl) continue;
    const changes = changesForExisting(existing, candidate);
    if (changes.imageUrl) updatedImages++;
    if (changes.announcedDate) updatedDates++;
    if (Object.keys(changes).length) {
      updated++;
      await db.update(products).set({ ...changes, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(products.id, existing.id));
    }
  }
  return { checked: candidates.length, created, updated, updatedImages, updatedDates, duplicates: candidates.length - created };
}
