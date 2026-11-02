import { db } from "@/db";
import { itemsCatalog, cartItems, shoppingLists } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { eq, desc, ilike, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await ensureDatabaseSeeded();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    let items;
    if (query) {
      items = await db.select().from(itemsCatalog).where(
        or(
          ilike(itemsCatalog.name, `%${query}%`),
          ilike(itemsCatalog.category, `%${query}%`),
          ilike(itemsCatalog.department, `%${query}%`)
        )
      ).orderBy(desc(itemsCatalog.isFavorite), desc(itemsCatalog.timesPurchased));
    } else {
      items = await db.select().from(itemsCatalog).orderBy(desc(itemsCatalog.isFavorite), desc(itemsCatalog.timesPurchased));
    }

    return NextResponse.json({ ok: true, catalog: items });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, catalogItemId, name, category, department, regularPrice, isTaxable, isFavorite, notes } = body;

    // Action: Add catalog item to active cart
    if (action === "add_to_cart" && catalogItemId) {
      const catItemRes = await db.select().from(itemsCatalog).where(eq(itemsCatalog.id, Number(catalogItemId))).limit(1);
      const catItem = catItemRes[0];
      if (!catItem) {
        return NextResponse.json({ ok: false, error: "Catalog item not found" }, { status: 404 });
      }

      // Find active list
      const activeList = (await db.select().from(shoppingLists).where(eq(shoppingLists.isActive, true)).limit(1))[0];
      if (!activeList) {
        return NextResponse.json({ ok: false, error: "No active list found" }, { status: 400 });
      }

      // Check if item already exists in active cart
      const existingInCart = await db.select().from(cartItems).where(eq(cartItems.listId, activeList.id));
      const match = existingInCart.find((i) => i.name.toLowerCase() === catItem.name.toLowerCase());

      if (match) {
        const newQty = (Number(match.quantity || 1) + 1).toFixed(2);
        const [updated] = await db.update(cartItems).set({ quantity: newQty }).where(eq(cartItems.id, match.id)).returning();
        return NextResponse.json({ ok: true, message: "Incremented quantity in cart", item: updated });
      } else {
        const [newItem] = await db.insert(cartItems).values({
          listId: activeList.id,
          catalogItemId: catItem.id,
          name: catItem.name,
          category: catItem.category,
          department: catItem.department,
          quantity: "1.00",
          unitPrice: catItem.regularPrice,
          saleDiscount: "0.00",
          couponDiscount: "0.00",
          isTaxable: catItem.isTaxable,
          isFavorite: catItem.isFavorite,
          notes: catItem.notes,
          sortOrder: existingInCart.length,
        }).returning();

        // Increment timesPurchased in catalog
        await db.update(itemsCatalog).set({ timesPurchased: (catItem.timesPurchased || 0) + 1 }).where(eq(itemsCatalog.id, catItem.id));

        return NextResponse.json({ ok: true, message: "Added to cart", item: newItem });
      }
    }

    // Action: Create new catalog item
    if (!name) {
      return NextResponse.json({ ok: false, error: "Item name is required" }, { status: 400 });
    }

    const [created] = await db.insert(itemsCatalog).values({
      name,
      category: category || "General",
      department: department || "Grocery",
      regularPrice: String(regularPrice || "0.00"),
      isTaxable: isTaxable !== undefined ? Boolean(isTaxable) : true,
      isFavorite: isFavorite !== undefined ? Boolean(isFavorite) : false,
      notes: notes || "",
    }).returning();

    return NextResponse.json({ ok: true, item: created });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
