import { db } from "@/db";
import { shoppingLists, cartItems, stores } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { eq, desc, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const allLists = await db.select().from(shoppingLists).orderBy(desc(shoppingLists.updatedAt));
    
    // Count items for each list
    const listsWithCounts = await Promise.all(
      allLists.map(async (list) => {
        const items = await db.select().from(cartItems).where(eq(cartItems.listId, list.id));
        let store = null;
        if (list.storeId) {
          const storeRes = await db.select().from(stores).where(eq(stores.id, list.storeId)).limit(1);
          store = storeRes[0] || null;
        }
        return {
          ...list,
          itemsCount: items.length,
          store,
        };
      })
    );

    return NextResponse.json({ ok: true, lists: listsWithCounts });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, storeId, budget = "150.00", notes = "", makeActive = true } = body;

    if (!name) {
      return NextResponse.json({ ok: false, error: "List name is required" }, { status: 400 });
    }

    if (makeActive) {
      await db.update(shoppingLists).set({ isActive: false });
    }

    const [newList] = await db.insert(shoppingLists).values({
      name,
      storeId: storeId ? Number(storeId) : null,
      budget: String(budget),
      notes,
      isActive: Boolean(makeActive),
    }).returning();

    return NextResponse.json({ ok: true, list: newList });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, storeId, budget, notes, isActive } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "List ID is required" }, { status: 400 });
    }

    if (isActive) {
      await db.update(shoppingLists).set({ isActive: false });
    }

    const [updated] = await db.update(shoppingLists).set({
      name: name !== undefined ? String(name) : undefined,
      storeId: storeId !== undefined ? (storeId ? Number(storeId) : null) : undefined,
      budget: budget !== undefined ? String(budget) : undefined,
      notes: notes !== undefined ? String(notes) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      updatedAt: new Date(),
    }).where(eq(shoppingLists.id, Number(id))).returning();

    return NextResponse.json({ ok: true, list: updated });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action, id } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "List ID is required" }, { status: 400 });
    }

    const targetList = (await db.select().from(shoppingLists).where(eq(shoppingLists.id, Number(id))).limit(1))[0];
    if (!targetList) {
      return NextResponse.json({ ok: false, error: "List not found" }, { status: 404 });
    }

    if (action === "switch") {
      await db.update(shoppingLists).set({ isActive: false });
      const [activated] = await db.update(shoppingLists).set({ isActive: true, updatedAt: new Date() }).where(eq(shoppingLists.id, targetList.id)).returning();
      return NextResponse.json({ ok: true, list: activated });
    }

    if (action === "duplicate") {
      await db.update(shoppingLists).set({ isActive: false });
      const [duplicatedList] = await db.insert(shoppingLists).values({
        name: `${targetList.name} (Copy)`,
        storeId: targetList.storeId,
        budget: targetList.budget,
        notes: targetList.notes,
        isActive: true,
      }).returning();

      // Copy items
      const existingItems = await db.select().from(cartItems).where(eq(cartItems.listId, targetList.id)).orderBy(asc(cartItems.sortOrder));
      for (const item of existingItems) {
        await db.insert(cartItems).values({
          listId: duplicatedList.id,
          name: item.name,
          category: item.category,
          department: item.department,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          saleDiscount: item.saleDiscount,
          couponDiscount: item.couponDiscount,
          isTaxable: item.isTaxable,
          isFavorite: item.isFavorite,
          notes: item.notes,
          sortOrder: item.sortOrder,
        });
      }

      return NextResponse.json({ ok: true, list: duplicatedList });
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
      return NextResponse.json({ ok: false, error: "List ID is required" }, { status: 400 });
    }

    await db.delete(cartItems).where(eq(cartItems.listId, Number(id)));
    await db.delete(shoppingLists).where(eq(shoppingLists.id, Number(id)));

    // Ensure at least one active list
    const remaining = await db.select().from(shoppingLists).limit(1);
    if (remaining.length > 0) {
      await db.update(shoppingLists).set({ isActive: true }).where(eq(shoppingLists.id, remaining[0].id));
    }

    return NextResponse.json({ ok: true, message: "List deleted" });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
