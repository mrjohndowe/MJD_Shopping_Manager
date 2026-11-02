import { integer, numeric, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userProfiles = sqliteTable("user_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userName: text("user_name").default("Shopper").notNull(),
  locationCity: text("location_city").default("Pueblo").notNull(),
  locationState: text("location_state").default("Colorado").notNull(),
  locationZip: text("location_zip").default("81003"),
  streetAddress: text("street_address").default("100 Main St"),
  defaultBudget: numeric("default_budget").default("150.00").notNull(),
  preferredTheme: text("preferred_theme").default("dark").notNull(),
  defaultCurrency: text("default_currency").default("USD").notNull(),
  setupCompleted: integer("setup_completed", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).defaultNow().notNull(),
});

export const stores = sqliteTable("stores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  chain: text("chain").default("General"),
  streetAddress: text("street_address").default(""),
  city: text("city").default("Pueblo"),
  state: text("state").default("CO"),
  zipCode: text("zip_code").default("81003"),
  phone: text("phone").default("(719) 555-0100"),
  stateTaxRate: numeric("state_tax_rate").default("0.0290").notNull(), // 2.90%
  countyTaxRate: numeric("county_tax_rate").default("0.0100").notNull(), // 1.00%
  cityTaxRate: numeric("city_tax_rate").default("0.0370").notNull(), // 3.70%
  specialTaxRate: numeric("special_tax_rate").default("0.0000").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).default(false).notNull(),
  notes: text("notes").default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).defaultNow().notNull(),
});

export const itemsCatalog = sqliteTable("items_catalog", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").default("General").notNull(),
  department: text("department").default("Grocery").notNull(),
  regularPrice: numeric("regular_price").default("0.00").notNull(),
  isTaxable: integer("is_taxable", { mode: "boolean" }).default(true).notNull(),
  isFavorite: integer("is_favorite", { mode: "boolean" }).default(false).notNull(),
  barcode: text("barcode").default(""),
  notes: text("notes").default(""),
  defaultStoreId: integer("default_store_id"),
  timesPurchased: integer("times_purchased").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).defaultNow().notNull(),
});

export const shoppingLists = sqliteTable("shopping_lists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  storeId: integer("store_id"),
  budget: numeric("budget").default("150.00").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  isArchived: integer("is_archived", { mode: "boolean" }).default(false).notNull(),
  notes: text("notes").default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).defaultNow().notNull(),
});

export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listId: integer("list_id").notNull(),
  catalogItemId: integer("catalog_item_id"),
  name: text("name").notNull(),
  category: text("category").default("General").notNull(),
  department: text("department").default("Grocery").notNull(),
  quantity: numeric("quantity").default("1.00").notNull(),
  unitPrice: numeric("unit_price").default("0.00").notNull(),
  saleDiscount: numeric("sale_discount").default("0.00").notNull(),
  couponDiscount: numeric("coupon_discount").default("0.00").notNull(),
  isTaxable: integer("is_taxable", { mode: "boolean" }).default(true).notNull(),
  isFavorite: integer("is_favorite", { mode: "boolean" }).default(false).notNull(),
  notes: text("notes").default(""),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).defaultNow().notNull(),
});

export const shoppingHistory = sqliteTable("shopping_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listName: text("list_name").notNull(),
  storeName: text("store_name").notNull(),
  storeAddress: text("store_address").default(""),
  budget: numeric("budget").default("0.00").notNull(),
  subtotal: numeric("subtotal").default("0.00").notNull(),
  stateTax: numeric("state_tax").default("0.00").notNull(),
  countyTax: numeric("county_tax").default("0.00").notNull(),
  cityTax: numeric("city_tax").default("0.00").notNull(),
  totalTax: numeric("total_tax").default("0.00").notNull(),
  grandTotal: numeric("grand_total").default("0.00").notNull(),
  moneySaved: numeric("money_saved").default("0.00").notNull(),
  remainingBudget: numeric("remaining_budget").default("0.00").notNull(),
  itemsCount: integer("items_count").default(0).notNull(),
  couponsCount: integer("coupons_count").default(0).notNull(),
  itemsJson: text("items_json").default("[]").notNull(),
  notes: text("notes").default(""),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }).defaultNow().notNull(),
});

export const appSettings = sqliteTable("app_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").unique().notNull(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).defaultNow().notNull(),
});
