import { db } from "@/db";
import { userProfiles, stores, shoppingLists } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const profiles = await db.select().from(userProfiles).limit(1);
    const profile = profiles[0] || null;
    const storeList = await db.select().from(stores);
    const lists = await db.select().from(shoppingLists);

    return NextResponse.json({
      ok: true,
      profile,
      storesCount: storeList.length,
      listsCount: lists.length,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userName,
      city = "Pueblo",
      state = "Colorado",
      zip = "81003",
      street = "100 Main St",
      defaultBudget = "150.00",
      theme = "dark",
      currency = "USD",
      stateTaxRate = "0.0290",
      countyTaxRate = "0.0100",
      cityTaxRate = "0.0370",
      defaultStoreId,
    } = body;

    await ensureDatabaseSeeded();

    const existingProfiles = await db.select().from(userProfiles).limit(1);
    if (existingProfiles.length > 0) {
      await db.update(userProfiles).set({
        userName: userName || existingProfiles[0].userName,
        locationCity: city,
        locationState: state,
        locationZip: zip,
        streetAddress: street,
        defaultBudget: String(defaultBudget),
        preferredTheme: theme,
        defaultCurrency: currency,
        setupCompleted: true,
        updatedAt: new Date(),
      }).where(eq(userProfiles.id, existingProfiles[0].id));
    } else {
      await db.insert(userProfiles).values({
        userName: userName || "Shopper",
        locationCity: city,
        locationState: state,
        locationZip: zip,
        streetAddress: street,
        defaultBudget: String(defaultBudget),
        preferredTheme: theme,
        defaultCurrency: currency,
        setupCompleted: true,
      });
    }

    // If default store specified or custom taxes, update default store
    if (defaultStoreId) {
      await db.update(stores).set({ isDefault: false });
      await db.update(stores).set({
        isDefault: true,
        stateTaxRate: String(stateTaxRate),
        countyTaxRate: String(countyTaxRate),
        cityTaxRate: String(cityTaxRate),
      }).where(eq(stores.id, Number(defaultStoreId)));
    }

    return NextResponse.json({ ok: true, message: "Setup completed successfully" });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
