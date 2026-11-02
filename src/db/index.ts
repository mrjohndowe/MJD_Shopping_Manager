import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & {
  __shoppingManagerSqlite?: InstanceType<typeof Database>;
};

const databasePath = resolve(process.cwd(), "data", "app.db");
mkdirSync(dirname(databasePath), { recursive: true });

const client = globalForDb.__shoppingManagerSqlite ?? new Database(databasePath);
export const db = drizzle(client, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__shoppingManagerSqlite = client;
}

migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });
