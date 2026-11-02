import { db } from "@/db";
import { appSettings, userProfiles, stores } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const profile = (await db.select().from(userProfiles).limit(1))[0];
    const settingsRows = await db.select().from(appSettings);

    const settingsMap: Record<string, string> = {};
    for (const row of settingsRows) {
      settingsMap[row.key] = row.value;
    }

    // Try reading settings.json from data/settings.json
    let jsonSettings = {};
    try {
      const p = path.join(process.cwd(), "data", "settings.json");
      if (fs.existsSync(p)) {
        jsonSettings = JSON.parse(fs.readFileSync(p, "utf-8"));
      }
    } catch {
      // Ignore
    }

    return NextResponse.json({
      ok: true,
      profile,
      settings: {
        theme: settingsMap["theme"] || profile?.preferredTheme || "dark",
        currency: settingsMap["currency"] || profile?.defaultCurrency || "USD",
        receiptWidth: Number(settingsMap["receiptWidth"] || "44"),
        autosaveEnabled: settingsMap["autosaveEnabled"] !== "false",
        autosaveInterval: Number(settingsMap["autosaveInterval"] || "30"),
        defaultBudget: settingsMap["defaultBudget"] || profile?.defaultBudget || "150.00",
        dbBackend: settingsMap["dbBackend"] || "both",
        sqlitePath: settingsMap["sqlitePath"] || "data/records.db",
        mysqlHost: settingsMap["mysqlHost"] || "127.0.0.1",
        mysqlPort: settingsMap["mysqlPort"] || "3306",
        mysqlUser: settingsMap["mysqlUser"] || "root",
        mysqlTable: settingsMap["mysqlTable"] || "shopping_trips",
        dataFolder: "data/",
        exportFolder: "exports_output/",
        historyFolder: "history_output/",
        ...jsonSettings,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      theme,
      currency,
      receiptWidth,
      autosaveEnabled,
      autosaveInterval,
      defaultBudget,
      dbBackend,
      sqlitePath,
      mysqlHost,
      mysqlPort,
      mysqlUser,
      mysqlTable,
    } = body;

    const updates: Record<string, string> = {
      theme: String(theme || "dark"),
      currency: String(currency || "USD"),
      receiptWidth: String(receiptWidth || "44"),
      autosaveEnabled: String(autosaveEnabled ?? true),
      autosaveInterval: String(autosaveInterval || "30"),
      defaultBudget: String(defaultBudget || "150.00"),
      dbBackend: String(dbBackend || "both"),
      sqlitePath: String(sqlitePath || "data/records.db"),
      mysqlHost: String(mysqlHost || "127.0.0.1"),
      mysqlPort: String(mysqlPort || "3306"),
      mysqlUser: String(mysqlUser || "root"),
      mysqlTable: String(mysqlTable || "shopping_trips"),
    };

    for (const [key, value] of Object.entries(updates)) {
      const existing = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
      if (existing.length > 0) {
        await db.update(appSettings).set({ value, updatedAt: new Date() }).where(eq(appSettings.key, key));
      } else {
        await db.insert(appSettings).values({ key, value });
      }
    }

    // Also update user profile default budget & theme
    const profile = (await db.select().from(userProfiles).limit(1))[0];
    if (profile) {
      await db.update(userProfiles).set({
        preferredTheme: String(theme || profile.preferredTheme),
        defaultCurrency: String(currency || profile.defaultCurrency),
        defaultBudget: String(defaultBudget || profile.defaultBudget),
        updatedAt: new Date(),
      }).where(eq(userProfiles.id, profile.id));
    }

    // Persist to data/settings.json
    try {
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(path.join(dataDir, "settings.json"), JSON.stringify(updates, null, 2));
    } catch {
      // Ignore
    }

    return NextResponse.json({ ok: true, message: "Settings saved successfully" });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
