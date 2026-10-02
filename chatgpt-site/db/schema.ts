import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  brand: text("brand").notNull(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  category: text("category").notNull(),
  productType: text("product_type").notNull().default("new"),
  price: integer("price"),
  retailer: text("retailer"),
  releaseDate: text("release_date"),
  announcedDate: text("announced_date"),
  description: text("description").notNull().default(""),
  sourceUrl: text("source_url").notNull().default(""),
  imageUrl: text("image_url"),
  emoji: text("emoji").notNull().default("✨"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("idx_products_brand_normalized_name").on(table.brand, table.normalizedName),
]);
