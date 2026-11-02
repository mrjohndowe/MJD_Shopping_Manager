import { db } from "@/db";
import { stores } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const allStores = await db.select().from(stores).orderBy(asc(stores.id));
    return NextResponse.json({ ok: true, stores: allStores });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      chain = "Custom",
      streetAddress = "",
      city = "Pueblo",
      state = "CO",
      zipCode = "81008",
      phone = "(719) 555-0100",
      stateTaxRate = "0.0290",
      countyTaxRate = "0.0100",
      cityTaxRate = "0.0370",
      specialTaxRate = "0.0000",
      isDefault = false,
      notes = "",
    } = body;

    if (!name) {
      return NextResponse.json({ ok: false, error: "Store name is required" }, { status: 400 });
    }

    if (isDefault) {
      await db.update(stores).set({ isDefault: false });
    }

    const [newStore] = await db.insert(stores).values({
      name,
      chain,
      streetAddress,
      city,
      state,
      zipCode,
      phone,
      stateTaxRate: String(stateTaxRate),
      countyTaxRate: String(countyTaxRate),
      cityTaxRate: String(cityTaxRate),
      specialTaxRate: String(specialTaxRate),
      isDefault: Boolean(isDefault),
      notes,
    }).returning();

    return NextResponse.json({ ok: true, store: newStore });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      chain,
      streetAddress,
      city,
      state,
      zipCode,
      phone,
      stateTaxRate,
      countyTaxRate,
      cityTaxRate,
      specialTaxRate,
      isDefault,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "Store ID is required" }, { status: 400 });
    }

    if (isDefault) {
      await db.update(stores).set({ isDefault: false });
    }

    const [updated] = await db.update(stores).set({
      name,
      chain,
      streetAddress,
      city,
      state,
      zipCode,
      phone,
      stateTaxRate: stateTaxRate !== undefined ? String(stateTaxRate) : undefined,
      countyTaxRate: countyTaxRate !== undefined ? String(countyTaxRate) : undefined,
      cityTaxRate: cityTaxRate !== undefined ? String(cityTaxRate) : undefined,
      specialTaxRate: specialTaxRate !== undefined ? String(specialTaxRate) : undefined,
      isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined,
      notes,
    }).where(eq(stores.id, Number(id))).returning();

    return NextResponse.json({ ok: true, store: updated });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Store ID is required" }, { status: 400 });
    }

    await db.update(stores).set({ isDefault: false });
    const [updated] = await db.update(stores).set({ isDefault: true }).where(eq(stores.id, Number(id))).returning();

    return NextResponse.json({ ok: true, store: updated });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "Store ID is required" }, { status: 400 });
    }

    await db.delete(stores).where(eq(stores.id, Number(id)));
    return NextResponse.json({ ok: true, message: "Store removed" });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
