import { db } from "@/db";
import { shoppingHistory } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const trips = await db.select().from(shoppingHistory).orderBy(desc(shoppingHistory.completedAt));
    const totalTrips = trips.length;

    if (totalTrips === 0) {
      return NextResponse.json({
        ok: true,
        stats: {
          trips: 0,
          moneySpent: "0.00",
          averageTrip: "0.00",
          largestTrip: "0.00",
          smallestTrip: "0.00",
          favoriteStore: "N/A",
          mostPurchasedItem: "N/A",
          itemsPurchased: 0,
          taxesPaid: "0.00",
          moneySaved: "0.00",
          couponsUsed: 0,
          averageItemPrice: "0.00",
          categoryBreakdown: {},
          storeDistribution: {},
        },
      });
    }

    let totalMoneySpent = 0;
    let totalTaxesPaid = 0;
    let totalMoneySaved = 0;
    let totalItemsPurchased = 0;
    let totalCouponsUsed = 0;
    const tripTotals: number[] = [];
    const storeCounts: Record<string, number> = {};
    const itemCounts: Record<string, number> = {};
    const categorySpending: Record<string, number> = {};

    for (const t of trips) {
      const grandTotal = Number(t.grandTotal || 0);
      const tax = Number(t.totalTax || 0);
      const saved = Number(t.moneySaved || 0);
      const itemsCnt = Number(t.itemsCount || 0);
      const coupons = Number(t.couponsCount || 0);

      totalMoneySpent += grandTotal;
      totalTaxesPaid += tax;
      totalMoneySaved += saved;
      totalItemsPurchased += itemsCnt;
      totalCouponsUsed += coupons;
      tripTotals.push(grandTotal);

      storeCounts[t.storeName] = (storeCounts[t.storeName] || 0) + 1;

      try {
        const items = JSON.parse(t.itemsJson || "[]");
        for (const item of items) {
          const name = item.name || "Item";
          const qty = Number(item.quantity || 1);
          const cat = item.category || "General";
          const subtotal = Number(item.netSubtotal || 0);

          itemCounts[name] = (itemCounts[name] || 0) + qty;
          categorySpending[cat] = (categorySpending[cat] || 0) + subtotal;
        }
      } catch {
        // Continue
      }
    }

    const largestTrip = Math.max(...tripTotals);
    const smallestTrip = Math.min(...tripTotals);
    const averageTrip = totalMoneySpent / totalTrips;
    const averageItemPrice = totalItemsPurchased > 0 ? totalMoneySpent / totalItemsPurchased : 0;

    let favoriteStore = "N/A";
    let maxStoreCount = 0;
    for (const [store, count] of Object.entries(storeCounts)) {
      if (count > maxStoreCount) {
        maxStoreCount = count;
        favoriteStore = store;
      }
    }

    let mostPurchasedItem = "N/A";
    let maxItemCount = 0;
    for (const [item, count] of Object.entries(itemCounts)) {
      if (count > maxItemCount) {
        maxItemCount = count;
        mostPurchasedItem = item;
      }
    }

    const categoryBreakdownFormatted: Record<string, string> = {};
    for (const [cat, amt] of Object.entries(categorySpending)) {
      categoryBreakdownFormatted[cat] = amt.toFixed(2);
    }

    return NextResponse.json({
      ok: true,
      stats: {
        trips: totalTrips,
        moneySpent: totalMoneySpent.toFixed(2),
        averageTrip: averageTrip.toFixed(2),
        largestTrip: largestTrip.toFixed(2),
        smallestTrip: smallestTrip.toFixed(2),
        favoriteStore,
        mostPurchasedItem,
        itemsPurchased: totalItemsPurchased,
        taxesPaid: totalTaxesPaid.toFixed(2),
        moneySaved: totalMoneySaved.toFixed(2),
        couponsUsed: totalCouponsUsed,
        averageItemPrice: averageItemPrice.toFixed(2),
        categoryBreakdown: categoryBreakdownFormatted,
        storeDistribution: storeCounts,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
