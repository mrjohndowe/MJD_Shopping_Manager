CREATE TABLE `app_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_settings_key_unique` ON `app_settings` (`key`);--> statement-breakpoint
CREATE TABLE `cart_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`list_id` integer NOT NULL,
	`catalog_item_id` integer,
	`name` text NOT NULL,
	`category` text DEFAULT 'General' NOT NULL,
	`department` text DEFAULT 'Grocery' NOT NULL,
	`quantity` numeric DEFAULT '1.00' NOT NULL,
	`unit_price` numeric DEFAULT '0.00' NOT NULL,
	`sale_discount` numeric DEFAULT '0.00' NOT NULL,
	`coupon_discount` numeric DEFAULT '0.00' NOT NULL,
	`is_taxable` integer DEFAULT true NOT NULL,
	`is_favorite` integer DEFAULT false NOT NULL,
	`notes` text DEFAULT '',
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `items_catalog` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'General' NOT NULL,
	`department` text DEFAULT 'Grocery' NOT NULL,
	`regular_price` numeric DEFAULT '0.00' NOT NULL,
	`is_taxable` integer DEFAULT true NOT NULL,
	`is_favorite` integer DEFAULT false NOT NULL,
	`barcode` text DEFAULT '',
	`notes` text DEFAULT '',
	`default_store_id` integer,
	`times_purchased` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shopping_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`list_name` text NOT NULL,
	`store_name` text NOT NULL,
	`store_address` text DEFAULT '',
	`budget` numeric DEFAULT '0.00' NOT NULL,
	`subtotal` numeric DEFAULT '0.00' NOT NULL,
	`state_tax` numeric DEFAULT '0.00' NOT NULL,
	`county_tax` numeric DEFAULT '0.00' NOT NULL,
	`city_tax` numeric DEFAULT '0.00' NOT NULL,
	`total_tax` numeric DEFAULT '0.00' NOT NULL,
	`grand_total` numeric DEFAULT '0.00' NOT NULL,
	`money_saved` numeric DEFAULT '0.00' NOT NULL,
	`remaining_budget` numeric DEFAULT '0.00' NOT NULL,
	`items_count` integer DEFAULT 0 NOT NULL,
	`coupons_count` integer DEFAULT 0 NOT NULL,
	`items_json` text DEFAULT '[]' NOT NULL,
	`notes` text DEFAULT '',
	`completed_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shopping_lists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`store_id` integer,
	`budget` numeric DEFAULT '150.00' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`notes` text DEFAULT '',
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`chain` text DEFAULT 'General',
	`street_address` text DEFAULT '',
	`city` text DEFAULT 'Pueblo',
	`state` text DEFAULT 'CO',
	`zip_code` text DEFAULT '81003',
	`phone` text DEFAULT '(719) 555-0100',
	`state_tax_rate` numeric DEFAULT '0.0290' NOT NULL,
	`county_tax_rate` numeric DEFAULT '0.0100' NOT NULL,
	`city_tax_rate` numeric DEFAULT '0.0370' NOT NULL,
	`special_tax_rate` numeric DEFAULT '0.0000' NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`notes` text DEFAULT '',
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_name` text DEFAULT 'Shopper' NOT NULL,
	`location_city` text DEFAULT 'Pueblo' NOT NULL,
	`location_state` text DEFAULT 'Colorado' NOT NULL,
	`location_zip` text DEFAULT '81003',
	`street_address` text DEFAULT '100 Main St',
	`default_budget` numeric DEFAULT '150.00' NOT NULL,
	`preferred_theme` text DEFAULT 'dark' NOT NULL,
	`default_currency` text DEFAULT 'USD' NOT NULL,
	`setup_completed` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
