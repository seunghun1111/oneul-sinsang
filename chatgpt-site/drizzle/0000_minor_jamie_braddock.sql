CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`brand` text NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`category` text NOT NULL,
	`product_type` text DEFAULT 'new' NOT NULL,
	`price` integer,
	`retailer` text,
	`release_date` text,
	`description` text DEFAULT '' NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`emoji` text DEFAULT '✨' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_products_brand_normalized_name` ON `products` (`brand`,`normalized_name`);