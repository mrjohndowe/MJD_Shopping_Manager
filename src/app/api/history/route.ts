import { db } from "@/db";
import { shoppingHistory, cartItems, shoppingLists } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { eq, desc, ilike, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await ensureDatabaseSeeded();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    let trips;
    if (query) {
      trips = await db.select().from(shoppingHistory).where(
        or(
          ilike(shoppingHistory.listName, `%${query}%`),
          ilike(shoppingHistory.storeName, `%${query}%`),
          ilike(shoppingHistory.notes, `%${query}%`)
        )
      ).orderBy(desc(shoppingHistory.completedAt));
    } else {
      trips = await db.select().from(shoppingHistory).orderBy(desc(shoppingHistory.completedAt));
    }

    const parsedTrips = trips.map((t) => {
      let items = [];
      try {
        items = JSON.parse(t.itemsJson || "[]");
      } catch {
        items = [];
      }
      return {
        ...t,
        items,
      };
    });

    return NextResponse.json({ ok: true, trips: parsedTrips });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, tripId } = body;

    if (action === "restore" && tripId) {
      const tripRes = await db.select().from(shoppingHistory).where(eq(shoppingHistory.id, Number(tripId))).limit(1);
      const trip = tripRes[0];
      if (!trip) {
        return NextResponse.json({ ok: false, error: "Trip not found" }, { status: 404 });
      }

      let parsedItems: any[] = [];
      try {
        parsedItems = JSON.parse(trip.itemsJson || "[]");
      } catch {
        parsedItems = [];
      }

      // Create new active list for restored trip
      await db.update(shoppingLists).set({ isActive: false });
      const [restoredList] = await db.insert(shoppingLists).values({
        name: `${trip.listName} (Restored)`,
        budget: trip.budget,
        notes: `Restored from shopping session at ${trip.storeName} on ${new Date(trip.completedAt).toLocaleDateString()}`,
        isActive: true,
      }).returning();

      for (let idx = 0; idx < parsedItems.length; idx++) {
        const item = parsedItems[idx];
        await db.insert(cartItems).values({
          listId: restoredList.id,
          name: item.name,
          category: item.category || "General",
          department: item.department || "Grocery",
          quantity: String(item.quantity || "1.00"),
          unitPrice: String(item.unitPrice || "0.00"),
          saleDiscount: String(item.saleDiscount || "0.00"),
          couponDiscount: String(item.couponDiscount || "0.00"),
          isTaxable: item.isTaxable !== undefined ? Boolean(item.isTaxable) : true,
          isFavorite: false,
          notes: item.notes || "",
          sortOrder: idx,
        });
      }

      return NextResponse.json({ ok: true, message: "Trip restored into active cart", list: restoredList });
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "Trip ID is required" }, { status: 400 });
    }

    await db.delete(shoppingHistory).where(eq(shoppingHistory.id, Number(id)));
    return NextResponse.json({ ok: true, message: "Trip deleted from history" });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
