import { db } from "@/db";
import { cartItems, shoppingLists, stores } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function formatLine(left: string, right: string, width: number): string {
  const space = width - left.length - right.length;
  if (space < 1) {
    const truncatedLeft = left.slice(0, Math.max(1, width - right.length - 2)) + "..";
    return `${truncatedLeft} ${right}`;
  }
  return `${left}${" ".repeat(space)}${right}`;
}

function centerText(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  const totalPad = width - text.length;
  const leftPad = Math.floor(totalPad / 2);
  const rightPad = totalPad - leftPad;
  return `${" ".repeat(leftPad)}${text}${" ".repeat(rightPad)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { style = "standard", width = 44, listId } = body;
    const receiptWidth = Math.max(32, Math.min(Number(width) || 44, 80));

    // Get active list
    let activeList;
    if (listId) {
      activeList = (await db.select().from(shoppingLists).where(eq(shoppingLists.id, Number(listId))).limit(1))[0];
    } else {
      activeList = (await db.select().from(shoppingLists).where(eq(shoppingLists.isActive, true)).limit(1))[0];
    }

    if (!activeList) {
      return NextResponse.json({ ok: false, error: "No active list found" }, { status: 400 });
    }

    // Get store
    let store = null;
    if (activeList.storeId) {
      store = (await db.select().from(stores).where(eq(stores.id, activeList.storeId)).limit(1))[0];
    }
    if (!store) {
      store = (await db.select().from(stores).where(eq(stores.isDefault, true)).limit(1))[0] || (await db.select().from(stores).limit(1))[0];
    }

    const stateRate = Number(store?.stateTaxRate || "0.0290");
    const countyRate = Number(store?.countyTaxRate || "0.0100");
    const cityRate = Number(store?.cityTaxRate || "0.0370");
    const specialRate = Number(store?.specialTaxRate || "0.0000");

    const items = await db.select().from(cartItems).where(eq(cartItems.listId, activeList.id)).orderBy(asc(cartItems.sortOrder));

    let subtotal = 0;
    let taxableSubtotal = 0;
    let nonTaxableSubtotal = 0;
    let totalSavings = 0;
    let totalQty = 0;

    const processedItems = items.map((item) => {
      const qty = Number(item.quantity || 1);
      const unit = Number(item.unitPrice || 0);
      const sale = Number(item.saleDiscount || 0);
      const coupon = Number(item.couponDiscount || 0);
      const net = Math.max(0, unit - sale - coupon);
      const netTotal = net * qty;
      const savings = (sale + coupon) * qty;

      subtotal += netTotal;
      totalSavings += savings;
      totalQty += qty;

      if (item.isTaxable) {
        taxableSubtotal += netTotal;
      } else {
        nonTaxableSubtotal += netTotal;
      }

      return {
        ...item,
        qty,
        unit,
        sale,
        coupon,
        net,
        netTotal,
        savings,
      };
    });

    const stateTax = Number((taxableSubtotal * stateRate).toFixed(2));
    const countyTax = Number((taxableSubtotal * countyRate).toFixed(2));
    const cityTax = Number((taxableSubtotal * cityRate).toFixed(2));
    const specialTax = Number((taxableSubtotal * specialRate).toFixed(2));
    const totalTax = Number((stateTax + countyTax + cityTax + specialTax).toFixed(2));
    const grandTotal = Number((subtotal + totalTax).toFixed(2));
    const budget = Number(activeList.budget || 150.0);
    const remainingBudget = Number((budget - grandTotal).toFixed(2));
    const percentUsed = budget > 0 ? ((grandTotal / budget) * 100).toFixed(1) : "100.0";

    const visibleTaxes: { name: string; amount: number; rateStr: string }[] = [];
    if (stateRate > 0 || stateTax > 0) visibleTaxes.push({ name: "Colorado State Tax", amount: stateTax, rateStr: `${(stateRate * 100).toFixed(2)}%` });
    if (countyRate > 0 || countyTax > 0) visibleTaxes.push({ name: "Pueblo County Tax", amount: countyTax, rateStr: `${(countyRate * 100).toFixed(2)}%` });
    if (cityRate > 0 || cityTax > 0) visibleTaxes.push({ name: "City of Pueblo Tax", amount: cityTax, rateStr: `${(cityRate * 100).toFixed(2)}%` });
    if (specialRate > 0 || specialTax > 0) visibleTaxes.push({ name: "Special District Tax", amount: specialTax, rateStr: `${(specialRate * 100).toFixed(2)}%` });

    const now = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
    const storeName = store?.name || "Walmart Supercenter";
    const storeAddr = store ? `${store.streetAddress || "4200 Dillon Dr"}, ${store.city || "Pueblo"}, ${store.state || "CO"}` : "Pueblo, CO";
    const storePhone = store?.phone || "(719) 555-0100";

    let receiptContent = "";

    if (style === "standard") {
      const lines = [
        centerText("MJD SHOPPING MANAGER", receiptWidth),
        centerText(`Store: ${storeName}`, receiptWidth),
        centerText(now, receiptWidth),
        "=".repeat(receiptWidth),
        formatLine("ITEM", "PRICE", receiptWidth),
        "-".repeat(receiptWidth),
      ];
      for (const it of processedItems) {
        const flag = it.isTaxable ? " T" : "  ";
        const qStr = it.qty !== 1 ? `${it.qty}x ` : "";
        lines.push(formatLine(`${qStr}${it.name}`, `$${it.netTotal.toFixed(2)}${flag}`, receiptWidth));
        if (it.savings > 0) {
          lines.push(`  * Saved $${it.savings.toFixed(2)}`);
        }
      }
      lines.push("-".repeat(receiptWidth));
      lines.push(formatLine("Subtotal:", `$${subtotal.toFixed(2)}`, receiptWidth));
      for (const t of visibleTaxes) {
        lines.push(formatLine(`${t.name} (${t.rateStr}):`, `$${t.amount.toFixed(2)}`, receiptWidth));
      }
      lines.push(formatLine("Total Sales Tax:", `$${totalTax.toFixed(2)}`, receiptWidth));
      lines.push("=".repeat(receiptWidth));
      lines.push(formatLine("GRAND TOTAL:", `$${grandTotal.toFixed(2)}`, receiptWidth));
      if (totalSavings > 0) lines.push(formatLine("TOTAL SAVINGS:", `$${totalSavings.toFixed(2)}`, receiptWidth));
      lines.push("-".repeat(receiptWidth));
      lines.push(formatLine("Budget:", `$${budget.toFixed(2)}`, receiptWidth));
      const statusLbl = remainingBudget >= 0 ? "Remaining:" : "OVER BUDGET:";
      lines.push(formatLine(statusLbl, `$${Math.abs(remainingBudget).toFixed(2)}`, receiptWidth));
      lines.push("=".repeat(receiptWidth));
      lines.push(centerText("THANK YOU FOR SHOPPING!", receiptWidth));
      lines.push(centerText("Please retain for your records", receiptWidth));
      receiptContent = lines.join("\n");

    } else if (style === "store") {
      const receiptId = `TRX#${Math.floor(100000 + Math.random() * 900000)}`;
      const lines = [
        "*".repeat(receiptWidth),
        centerText(storeName.toUpperCase(), receiptWidth),
        centerText(storeAddr, receiptWidth),
        centerText(`Tel: ${storePhone}`, receiptWidth),
        "*".repeat(receiptWidth),
        formatLine(`Date: ${now}`, "Reg: 04  Seq: 88", receiptWidth),
        formatLine(`Receipt: ${receiptId}`, "Cashier: Self-Check", receiptWidth),
        "-".repeat(receiptWidth),
        formatLine("DESCRIPTION", "AMOUNT", receiptWidth),
        "-".repeat(receiptWidth),
      ];
      for (const it of processedItems) {
        const flag = it.isTaxable ? " T" : " N";
        lines.push(formatLine(it.name.slice(0, receiptWidth - 12), `$${it.netTotal.toFixed(2)}${flag}`, receiptWidth));
        if (it.qty !== 1) lines.push(`  ${it.qty} @ $${it.net.toFixed(2)}/ea`);
        if (it.sale > 0) lines.push(`  SALE DISC -$${(it.sale * it.qty).toFixed(2)}`);
        if (it.coupon > 0) lines.push(`  MFR COUPON -$${(it.coupon * it.qty).toFixed(2)}`);
      }
      lines.push("-".repeat(receiptWidth));
      lines.push(formatLine("SUBTOTAL", `$${subtotal.toFixed(2)}`, receiptWidth));
      for (const t of visibleTaxes) {
        lines.push(formatLine(`TAX (${t.rateStr})`, `$${t.amount.toFixed(2)}`, receiptWidth));
      }
      lines.push(formatLine("TOTAL TAX", `$${totalTax.toFixed(2)}`, receiptWidth));
      lines.push("=".repeat(receiptWidth));
      lines.push(formatLine("TOTAL PAID", `$${grandTotal.toFixed(2)}`, receiptWidth));
      lines.push("=".repeat(receiptWidth));
      lines.push(formatLine("ITEMS SOLD", String(Math.round(totalQty)), receiptWidth));
      if (totalSavings > 0) lines.push(formatLine("YOU SAVED TODAY", `$${totalSavings.toFixed(2)}`, receiptWidth));
      lines.push("-".repeat(receiptWidth));
      lines.push(centerText("RETURN POLICY: 90 DAYS WITH RECEIPT", receiptWidth));
      lines.push(centerText("Visit mjdshopping.local/survey", receiptWidth));
      lines.push("*".repeat(receiptWidth));
      receiptContent = lines.join("\n");

    } else if (style === "detailed") {
      const lines = [
        "#".repeat(receiptWidth),
        centerText("MJD SHOPPING MANAGER - DETAILED AUDIT", receiptWidth),
        centerText(`List: ${activeList.name} | Store: ${storeName}`, receiptWidth),
        centerText(`Generated: ${now}`, receiptWidth),
        "#".repeat(receiptWidth),
      ];

      const byCat: Record<string, typeof processedItems> = {};
      for (const it of processedItems) {
        const cat = it.category || "General";
        if (!byCat[cat]) byCat[cat] = [];
        byCat[cat].push(it);
      }

      for (const [cat, catItems] of Object.entries(byCat)) {
        const catSub = catItems.reduce((acc, i) => acc + i.netTotal, 0);
        lines.push(`\n[${cat.toUpperCase()}] - Subtotal: $${catSub.toFixed(2)}`);
        lines.push(".".repeat(receiptWidth));
        for (const it of catItems) {
          const tLbl = it.isTaxable ? "[Taxable]" : "[Non-Taxable]";
          lines.push(`  * ${it.name}`);
          lines.push(`    Qty: ${it.qty} | Reg: $${it.unit.toFixed(2)} | Net: $${it.net.toFixed(2)} | ${tLbl}`);
          if (it.savings > 0) lines.push(`    Savings: -$${it.savings.toFixed(2)}`);
          if (it.notes) lines.push(`    Note: ${it.notes}`);
          lines.push(formatLine("    Item Total:", `$${it.netTotal.toFixed(2)}`, receiptWidth));
        }
      }

      lines.push("\n" + "=".repeat(receiptWidth));
      lines.push(centerText("AUDIT FINANCIAL SUMMARY", receiptWidth));
      lines.push("-".repeat(receiptWidth));
      lines.push(formatLine("Taxable Net Subtotal:", `$${taxableSubtotal.toFixed(2)}`, receiptWidth));
      lines.push(formatLine("Non-Taxable Subtotal:", `$${nonTaxableSubtotal.toFixed(2)}`, receiptWidth));
      lines.push(formatLine("Net Merchandise Subtotal:", `$${subtotal.toFixed(2)}`, receiptWidth));
      for (const t of visibleTaxes) {
        lines.push(formatLine(`  + ${t.name} (${t.rateStr}):`, `$${t.amount.toFixed(2)}`, receiptWidth));
      }
      lines.push(formatLine("Total Sales Taxes:", `$${totalTax.toFixed(2)}`, receiptWidth));
      lines.push("-".repeat(receiptWidth));
      lines.push(formatLine("FINAL GRAND TOTAL:", `$${grandTotal.toFixed(2)}`, receiptWidth));
      lines.push("#".repeat(receiptWidth));
      receiptContent = lines.join("\n");

    } else if (style === "budget_summary") {
      const lines = [
        "=".repeat(receiptWidth),
        centerText("MJD BUDGET HEALTH & SPENDING REPORT", receiptWidth),
        centerText(`Trip: ${activeList.name}`, receiptWidth),
        centerText(`Store: ${storeName} (${now})`, receiptWidth),
        "=".repeat(receiptWidth),
        formatLine("Allocated Starting Budget:", `$${budget.toFixed(2)}`, receiptWidth),
        formatLine("Total Cart Merchandise:", `$${subtotal.toFixed(2)}`, receiptWidth),
        formatLine("Total Itemized Taxes:", `$${totalTax.toFixed(2)}`, receiptWidth),
        "-".repeat(receiptWidth),
        formatLine("Total Trip Expenditure:", `$${grandTotal.toFixed(2)}`, receiptWidth),
        formatLine("Budget Utilization:", `${percentUsed}%`, receiptWidth),
        "-".repeat(receiptWidth),
      ];
      if (grandTotal > budget) {
        lines.push(centerText("!! WARNING: OVER BUDGET !!", receiptWidth));
        lines.push(formatLine("Over Budget Amount:", `$${(grandTotal - budget).toFixed(2)}`, receiptWidth));
      } else {
        lines.push(centerText("STATUS: UNDER BUDGET - HEALTHY", receiptWidth));
        lines.push(formatLine("Surplus / Remaining Cash:", `$${remainingBudget.toFixed(2)}`, receiptWidth));
      }
      lines.push("-".repeat(receiptWidth));
      lines.push(formatLine("Coupons & Promotional Savings:", `$${totalSavings.toFixed(2)}`, receiptWidth));
      lines.push(formatLine("Total Items Acquired:", String(Math.round(totalQty)), receiptWidth));
      lines.push("=".repeat(receiptWidth));
      receiptContent = lines.join("\n");

    } else {
      // Thermal Receipt
      const tw = Math.min(receiptWidth, 38);
      const lines = [
        ".------------------------------------.",
        `| ${centerText(storeName.slice(0, 34), 34)} |`,
        `| ${centerText("*** THERMAL TICKET ***", 34)} |`,
        `| ${centerText(now.slice(0, 34), 34)} |`,
        "|------------------------------------|",
        "| QTY ITEM                     PRICE |",
        "|------------------------------------|",
      ];
      for (const it of processedItems) {
        const qStr = `${it.qty}x`.padEnd(3).slice(0, 3);
        const nStr = it.name.slice(0, 18).padEnd(18);
        const pStr = `$${it.netTotal.toFixed(2)}`.padStart(8);
        const tFlag = it.isTaxable ? "T" : " ";
        lines.push(`| ${qStr} ${nStr} ${pStr} ${tFlag}|`);
      }
      lines.push("|------------------------------------|");
      lines.push(`| Subtotal:             $${subtotal.toFixed(2).padStart(8)}  |`);
      for (const t of visibleTaxes) {
        const shortName = t.name.replace("Colorado State Tax", "CO State Tax").replace("Pueblo County Tax", "Pueblo Co Tax").slice(0, 18).padEnd(18);
        lines.push(`| ${shortName}   $${t.amount.toFixed(2).padStart(8)}  |`);
      }
      lines.push(`| Total Tax:            $${totalTax.toFixed(2).padStart(8)}  |`);
      lines.push("|====================================|");
      lines.push(`| GRAND TOTAL:          $${grandTotal.toFixed(2).padStart(8)}  |`);
      lines.push("|====================================|");
      lines.push(`| Budget Remaining:     $${remainingBudget.toFixed(2).padStart(8)}  |`);
      lines.push("|                                    |");
      lines.push("|   || | | ||| |||| | || ||||| |||   |");
      lines.push("|        9824 1092 8419 0281         |");
      lines.push("|                                    |");
      lines.push("|        THANK YOU FOR SHOPPING!     |");
      lines.push("'------------------------------------'");
      receiptContent = lines.join("\n");
    }

    return NextResponse.json({
      ok: true,
      style,
      content: receiptContent,
      store: storeName,
      grandTotal,
      savings: totalSavings,
      itemsCount: Math.round(totalQty),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
