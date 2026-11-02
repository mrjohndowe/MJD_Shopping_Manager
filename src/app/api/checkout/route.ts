import { db } from "@/db";
import { shoppingHistory, cartItems, shoppingLists, stores } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { listId, notes = "", clearAfterCheckout = true } = body;

    // 1. Get list
    let targetList;
    if (listId) {
      targetList = (await db.select().from(shoppingLists).where(eq(shoppingLists.id, Number(listId))).limit(1))[0];
    } else {
      targetList = (await db.select().from(shoppingLists).where(eq(shoppingLists.isActive, true)).limit(1))[0];
    }

    if (!targetList) {
      return NextResponse.json({ ok: false, error: "No shopping list found" }, { status: 400 });
    }

    // 2. Get store
    let store = null;
    if (targetList.storeId) {
      store = (await db.select().from(stores).where(eq(stores.id, targetList.storeId)).limit(1))[0];
    }
    if (!store) {
      store = (await db.select().from(stores).where(eq(stores.isDefault, true)).limit(1))[0] || (await db.select().from(stores).limit(1))[0];
    }

    const stateRate = Number(store?.stateTaxRate || "0.0290");
    const countyRate = Number(store?.countyTaxRate || "0.0100");
    const cityRate = Number(store?.cityTaxRate || "0.0370");
    const specialRate = Number(store?.specialTaxRate || "0.0000");

    // 3. Get items
    const rawItems = await db.select().from(cartItems).where(eq(cartItems.listId, targetList.id)).orderBy(asc(cartItems.sortOrder));

    if (rawItems.length === 0) {
      return NextResponse.json({ ok: false, error: "Cart is empty. Add items before checking out." }, { status: 400 });
    }

    let subtotal = 0;
    let taxableSubtotal = 0;
    let nonTaxableSubtotal = 0;
    let totalSavings = 0;
    let couponsCount = 0;
    let totalItemsCount = 0;

    const itemsSummary = rawItems.map((item) => {
      const qty = Number(item.quantity || 1);
      const unit = Number(item.unitPrice || 0);
      const sale = Number(item.saleDiscount || 0);
      const coupon = Number(item.couponDiscount || 0);
      const net = Math.max(0, unit - sale - coupon);
      const netTotal = net * qty;
      const savings = (sale + coupon) * qty;

      subtotal += netTotal;
      totalSavings += savings;
      totalItemsCount += qty;
      if (coupon > 0) couponsCount++;

      if (item.isTaxable) {
        taxableSubtotal += netTotal;
      } else {
        nonTaxableSubtotal += netTotal;
      }

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        department: item.department,
        quantity: qty,
        unitPrice: unit,
        saleDiscount: sale,
        couponDiscount: coupon,
        netUnitPrice: Number(net.toFixed(2)),
        netSubtotal: Number(netTotal.toFixed(2)),
        totalSavings: Number(savings.toFixed(2)),
        isTaxable: item.isTaxable,
        notes: item.notes,
      };
    });

    const stateTax = Number((taxableSubtotal * stateRate).toFixed(2));
    const countyTax = Number((taxableSubtotal * countyRate).toFixed(2));
    const cityTax = Number((taxableSubtotal * cityRate).toFixed(2));
    const specialTax = Number((taxableSubtotal * specialRate).toFixed(2));
    const totalTax = Number((stateTax + countyTax + cityTax + specialTax).toFixed(2));
    const grandTotal = Number((subtotal + totalTax).toFixed(2));

    const budget = Number(targetList.budget || 150.0);
    const remainingBudget = Number((budget - grandTotal).toFixed(2));

    // Insert into Postgres shoppingHistory
    const [historyRecord] = await db.insert(shoppingHistory).values({
      listName: targetList.name,
      storeName: store?.name || "Store",
      storeAddress: store ? `${store.streetAddress || ""}, ${store.city || "Pueblo"}, ${store.state || "CO"}`.trim() : "",
      budget: String(budget.toFixed(2)),
      subtotal: String(subtotal.toFixed(2)),
      stateTax: String(stateTax.toFixed(2)),
      countyTax: String(countyTax.toFixed(2)),
      cityTax: String(cityTax.toFixed(2)),
      totalTax: String(totalTax.toFixed(2)),
      grandTotal: String(grandTotal.toFixed(2)),
      moneySaved: String(totalSavings.toFixed(2)),
      remainingBudget: String(remainingBudget.toFixed(2)),
      itemsCount: Math.round(totalItemsCount),
      couponsCount,
      itemsJson: JSON.stringify(itemsSummary),
      notes,
    }).returning();

    // Clear autosave file on disk if exists
    try {
      const autosavePath = path.join(process.cwd(), "data", "autosave.json");
      if (fs.existsSync(autosavePath)) {
        fs.unlinkSync(autosavePath);
      }
    } catch {
      // Ignore
    }

    // Optionally clear cart after checkout
    if (clearAfterCheckout) {
      await db.delete(cartItems).where(eq(cartItems.listId, targetList.id));
    }

    return NextResponse.json({
      ok: true,
      trip: historyRecord,
      summary: {
        budget,
        subtotal: Number(subtotal.toFixed(2)),
        stateTax,
        countyTax,
        cityTax,
        totalTax,
        grandTotal,
        totalSavings: Number(totalSavings.toFixed(2)),
        remainingBudget,
        itemsCount: Math.round(totalItemsCount),
        couponsCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
