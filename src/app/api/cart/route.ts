import { db } from "@/db";
import { cartItems, shoppingLists, stores } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { eq, asc, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function calculateCartTotals(items: any[], activeList: any, store: any) {
  const stateRate = Number(store?.stateTaxRate || "0.0290");
  const countyRate = Number(store?.countyTaxRate || "0.0100");
  const cityRate = Number(store?.cityTaxRate || "0.0370");
  const specialRate = Number(store?.specialTaxRate || "0.0000");
  const combinedTaxRate = stateRate + countyRate + cityRate + specialRate;

  let subtotal = 0;
  let regularSubtotal = 0;
  let totalSavings = 0;
  let taxableSubtotal = 0;
  let nonTaxableSubtotal = 0;
  let totalItemsCount = 0;
  let couponsCount = 0;

  const processedItems = items.map((item) => {
    const qty = Number(item.quantity || 1);
    const regularPrice = Number(item.unitPrice || 0);
    const saleDiscount = Number(item.saleDiscount || 0);
    const couponDiscount = Number(item.couponDiscount || 0);
    const netUnit = Math.max(0, regularPrice - saleDiscount - couponDiscount);
    const itemSubtotal = netUnit * qty;
    const itemSavings = (saleDiscount + couponDiscount) * qty;

    totalItemsCount += qty;
    regularSubtotal += regularPrice * qty;
    subtotal += itemSubtotal;
    totalSavings += itemSavings;

    if (couponDiscount > 0) couponsCount++;

    if (item.isTaxable) {
      taxableSubtotal += itemSubtotal;
    } else {
      nonTaxableSubtotal += itemSubtotal;
    }

    return {
      ...item,
      quantityNum: qty,
      regularPriceNum: regularPrice,
      saleDiscountNum: saleDiscount,
      couponDiscountNum: couponDiscount,
      netUnitPrice: Number(netUnit.toFixed(2)),
      itemSubtotal: Number(itemSubtotal.toFixed(2)),
      itemSavings: Number(itemSavings.toFixed(2)),
    };
  });

  const stateTax = Number((taxableSubtotal * stateRate).toFixed(2));
  const countyTax = Number((taxableSubtotal * countyRate).toFixed(2));
  const cityTax = Number((taxableSubtotal * cityRate).toFixed(2));
  const specialTax = Number((taxableSubtotal * specialRate).toFixed(2));
  const totalTax = Number((stateTax + countyTax + cityTax + specialTax).toFixed(2));
  const grandTotal = Number((subtotal + totalTax).toFixed(2));

  const budget = Number(activeList?.budget || 150.0);
  const remainingBudget = Number((budget - grandTotal).toFixed(2));
  const percentUsed = budget > 0 ? Number(((grandTotal / budget) * 100).toFixed(1)) : 100;
  const isOverspent = grandTotal > budget;
  const overspentAmount = isOverspent ? Number((grandTotal - budget).toFixed(2)) : 0;

  // Visible taxes only (value > 0 or rate > 0)
  const visibleTaxes: { name: string; rate: number; percentageStr: string; amount: number }[] = [];
  if (stateRate > 0 || stateTax > 0) {
    visibleTaxes.push({ name: "Colorado State Tax", rate: stateRate, percentageStr: `${(stateRate * 100).toFixed(2)}%`, amount: stateTax });
  }
  if (countyRate > 0 || countyTax > 0) {
    visibleTaxes.push({ name: "Pueblo County Tax", rate: countyRate, percentageStr: `${(countyRate * 100).toFixed(2)}%`, amount: countyTax });
  }
  if (cityRate > 0 || cityTax > 0) {
    visibleTaxes.push({ name: "City of Pueblo Tax", rate: cityRate, percentageStr: `${(cityRate * 100).toFixed(2)}%`, amount: cityTax });
  }
  if (specialRate > 0 || specialTax > 0) {
    visibleTaxes.push({ name: "Special District Tax", rate: specialRate, percentageStr: `${(specialRate * 100).toFixed(2)}%`, amount: specialTax });
  }

  return {
    items: processedItems,
    summary: {
      budget: Number(budget.toFixed(2)),
      subtotal: Number(subtotal.toFixed(2)),
      regularSubtotal: Number(regularSubtotal.toFixed(2)),
      taxableSubtotal: Number(taxableSubtotal.toFixed(2)),
      nonTaxableSubtotal: Number(nonTaxableSubtotal.toFixed(2)),
      stateTax,
      countyTax,
      cityTax,
      specialTax,
      totalTax,
      grandTotal,
      totalSavings: Number(totalSavings.toFixed(2)),
      remainingBudget,
      percentUsed,
      isOverspent,
      overspentAmount,
      totalItemsCount: Number(totalItemsCount.toFixed(2)),
      distinctItemsCount: items.length,
      couponsCount,
      visibleTaxes,
      taxRates: {
        state: stateRate,
        county: countyRate,
        city: cityRate,
        special: specialRate,
        total: combinedTaxRate,
      },
    },
  };
}

export async function GET() {
  try {
    await ensureDatabaseSeeded();

    // 1. Get active shopping list
    const lists = await db.select().from(shoppingLists).where(eq(shoppingLists.isActive, true)).limit(1);
    const activeList = lists[0] || (await db.select().from(shoppingLists).limit(1))[0];

    if (!activeList) {
      return NextResponse.json({ ok: true, list: null, store: null, items: [], summary: null });
    }

    // 2. Get store for list
    let store = null;
    if (activeList.storeId) {
      const storeRes = await db.select().from(stores).where(eq(stores.id, activeList.storeId)).limit(1);
      store = storeRes[0] || null;
    }
    if (!store) {
      const defaultStoreRes = await db.select().from(stores).where(eq(stores.isDefault, true)).limit(1);
      store = defaultStoreRes[0] || (await db.select().from(stores).limit(1))[0];
    }

    // 3. Get items
    const rawItems = await db.select().from(cartItems).where(eq(cartItems.listId, activeList.id)).orderBy(asc(cartItems.sortOrder), asc(cartItems.id));

    const { items, summary } = calculateCartTotals(rawItems, activeList, store);

    return NextResponse.json({
      ok: true,
      list: activeList,
      store,
      items,
      summary,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      category = "General",
      department = "Grocery",
      quantity = "1.00",
      regularPrice = "0.00",
      unitPrice = regularPrice,
      saleDiscount = "0.00",
      couponDiscount = "0.00",
      isTaxable = true,
      isFavorite = false,
      notes = "",
      listId,
    } = body;

    if (!name) {
      return NextResponse.json({ ok: false, error: "Item name is required" }, { status: 400 });
    }

    // Find target list
    let targetListId = listId;
    if (!targetListId) {
      const activeLists = await db.select().from(shoppingLists).where(eq(shoppingLists.isActive, true)).limit(1);
      targetListId = activeLists[0]?.id;
    }

    if (!targetListId) {
      const [createdList] = await db.insert(shoppingLists).values({
        name: "My Shopping List",
        budget: "150.00",
        isActive: true,
      }).returning();
      targetListId = createdList.id;
    }

    // Find highest sort order
    const existing = await db.select().from(cartItems).where(eq(cartItems.listId, targetListId)).orderBy(desc(cartItems.sortOrder)).limit(1);
    const nextOrder = existing.length > 0 ? (existing[0].sortOrder || 0) + 1 : 0;

    const [newItem] = await db.insert(cartItems).values({
      listId: targetListId,
      name,
      category,
      department,
      quantity: String(quantity),
      unitPrice: String(unitPrice || regularPrice),
      saleDiscount: String(saleDiscount),
      couponDiscount: String(couponDiscount),
      isTaxable: Boolean(isTaxable),
      isFavorite: Boolean(isFavorite),
      notes: notes || "",
      sortOrder: nextOrder,
    }).returning();

    return NextResponse.json({ ok: true, item: newItem });
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
      category,
      department,
      quantity,
      regularPrice,
      unitPrice,
      saleDiscount,
      couponDiscount,
      isTaxable,
      isFavorite,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "Item ID is required" }, { status: 400 });
    }

    const priceToSet = unitPrice !== undefined ? unitPrice : regularPrice;

    const [updated] = await db.update(cartItems).set({
      name,
      category,
      department,
      quantity: quantity !== undefined ? String(quantity) : undefined,
      unitPrice: priceToSet !== undefined ? String(priceToSet) : undefined,
      saleDiscount: saleDiscount !== undefined ? String(saleDiscount) : undefined,
      couponDiscount: couponDiscount !== undefined ? String(couponDiscount) : undefined,
      isTaxable: isTaxable !== undefined ? Boolean(isTaxable) : undefined,
      isFavorite: isFavorite !== undefined ? Boolean(isFavorite) : undefined,
      notes: notes !== undefined ? String(notes) : undefined,
    }).where(eq(cartItems.id, Number(id))).returning();

    return NextResponse.json({ ok: true, item: updated });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action, id, direction } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "Item ID is required" }, { status: 400 });
    }

    const itemRes = await db.select().from(cartItems).where(eq(cartItems.id, Number(id))).limit(1);
    const item = itemRes[0];
    if (!item) {
      return NextResponse.json({ ok: false, error: "Item not found" }, { status: 404 });
    }

    if (action === "duplicate") {
      const [clone] = await db.insert(cartItems).values({
        listId: item.listId,
        name: `${item.name} (Copy)`,
        category: item.category,
        department: item.department,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        saleDiscount: item.saleDiscount,
        couponDiscount: item.couponDiscount,
        isTaxable: item.isTaxable,
        isFavorite: item.isFavorite,
        notes: item.notes,
        sortOrder: (item.sortOrder || 0) + 1,
      }).returning();
      return NextResponse.json({ ok: true, item: clone });
    }

    if (action === "toggle_favorite") {
      const [updated] = await db.update(cartItems).set({ isFavorite: !item.isFavorite }).where(eq(cartItems.id, item.id)).returning();
      return NextResponse.json({ ok: true, item: updated });
    }

    if (action === "toggle_taxable") {
      const [updated] = await db.update(cartItems).set({ isTaxable: !item.isTaxable }).where(eq(cartItems.id, item.id)).returning();
      return NextResponse.json({ ok: true, item: updated });
    }

    if (action === "move") {
      const allItems = await db.select().from(cartItems).where(eq(cartItems.listId, item.listId)).orderBy(asc(cartItems.sortOrder), asc(cartItems.id));
      const currentIndex = allItems.findIndex((i) => i.id === item.id);
      if (direction === "up" && currentIndex > 0) {
        const prevItem = allItems[currentIndex - 1];
        await db.update(cartItems).set({ sortOrder: prevItem.sortOrder }).where(eq(cartItems.id, item.id));
        await db.update(cartItems).set({ sortOrder: item.sortOrder }).where(eq(cartItems.id, prevItem.id));
      } else if (direction === "down" && currentIndex < allItems.length - 1) {
        const nextItem = allItems[currentIndex + 1];
        await db.update(cartItems).set({ sortOrder: nextItem.sortOrder }).where(eq(cartItems.id, item.id));
        await db.update(cartItems).set({ sortOrder: item.sortOrder }).where(eq(cartItems.id, nextItem.id));
      }
      return NextResponse.json({ ok: true, message: "Item reordered" });
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clear = searchParams.get("clear");
    const id = searchParams.get("id");
    const listId = searchParams.get("listId");

    if (clear === "true") {
      if (listId) {
        await db.delete(cartItems).where(eq(cartItems.listId, Number(listId)));
      } else {
        const activeLists = await db.select().from(shoppingLists).where(eq(shoppingLists.isActive, true)).limit(1);
        if (activeLists[0]) {
          await db.delete(cartItems).where(eq(cartItems.listId, activeLists[0].id));
        }
      }
      return NextResponse.json({ ok: true, message: "Cart cleared" });
    }

    if (!id) {
      return NextResponse.json({ ok: false, error: "Item ID or clear flag required" }, { status: 400 });
    }

    await db.delete(cartItems).where(eq(cartItems.id, Number(id)));
    return NextResponse.json({ ok: true, message: "Item removed" });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
