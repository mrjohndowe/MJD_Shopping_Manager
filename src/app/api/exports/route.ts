import { db } from "@/db";
import { cartItems, shoppingLists, stores } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function xorEncrypt(text: string, key: string): string {
  if (!key) return text;
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return "MJD_ENCRYPTED_V1:" + Buffer.from(result, "binary").toString("base64");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { format = "txt", encryptionKey, isReadOnly = true, listId } = body;

    let activeList;
    if (listId) {
      activeList = (await db.select().from(shoppingLists).where(eq(shoppingLists.id, Number(listId))).limit(1))[0];
    } else {
      activeList = (await db.select().from(shoppingLists).where(eq(shoppingLists.isActive, true)).limit(1))[0];
    }

    if (!activeList) {
      return NextResponse.json({ ok: false, error: "No active list found" }, { status: 400 });
    }

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

    const processed = items.map((i) => {
      const q = Number(i.quantity || 1);
      const reg = Number(i.unitPrice || 0);
      const sale = Number(i.saleDiscount || 0);
      const coupon = Number(i.couponDiscount || 0);
      const net = Math.max(0, reg - sale - coupon);
      const sub = net * q;
      const sav = (sale + coupon) * q;

      subtotal += sub;
      totalSavings += sav;
      if (i.isTaxable) taxableSubtotal += sub;
      else nonTaxableSubtotal += sub;

      return { ...i, q, reg, sale, coupon, net, sub, sav };
    });

    const stateTax = Number((taxableSubtotal * stateRate).toFixed(2));
    const countyTax = Number((taxableSubtotal * countyRate).toFixed(2));
    const cityTax = Number((taxableSubtotal * cityRate).toFixed(2));
    const specialTax = Number((taxableSubtotal * specialRate).toFixed(2));
    const totalTax = Number((stateTax + countyTax + cityTax + specialTax).toFixed(2));
    const grandTotal = Number((subtotal + totalTax).toFixed(2));
    const budget = Number(activeList.budget || 150.0);
    const remainingBudget = Number((budget - grandTotal).toFixed(2));

    const dateStr = new Date().toISOString();
    let content = "";
    let mimeType = "text/plain";
    let extension = "txt";

    if (format === "csv") {
      mimeType = "text/csv";
      extension = "csv";
      const rows = [
        [`"MJD Shopping Manager Export"`, `"Store: ${store?.name || "Store"}"`, `"Date: ${dateStr}"`],
        [],
        ["Item Name", "Category", "Department", "Quantity", "Regular Price", "Sale Discount", "Coupon Discount", "Unit Price", "Subtotal", "Savings", "Taxable", "Notes"].map(c => `"${c}"`),
      ];
      for (const it of processed) {
        rows.push([
          `"${it.name}"`,
          `"${it.category}"`,
          `"${it.department}"`,
          `"${it.q}"`,
          `"$${it.reg.toFixed(2)}"`,
          `"$${it.sale.toFixed(2)}"`,
          `"$${it.coupon.toFixed(2)}"`,
          `"$${it.net.toFixed(2)}"`,
          `"$${it.sub.toFixed(2)}"`,
          `"$${it.sav.toFixed(2)}"`,
          `"${it.isTaxable ? "YES" : "NO"}"`,
          `"${it.notes || ""}"`,
        ]);
      }
      rows.push([]);
      rows.push([`"Subtotal"`, `"$${subtotal.toFixed(2)}"`]);
      rows.push([`"Colorado State Tax (${(stateRate * 100).toFixed(2)}%)"`, `"$${stateTax.toFixed(2)}"`]);
      rows.push([`"Pueblo County Tax (${(countyRate * 100).toFixed(2)}%)"`, `"$${countyTax.toFixed(2)}"`]);
      rows.push([`"City of Pueblo Tax (${(cityRate * 100).toFixed(2)}%)"`, `"$${cityTax.toFixed(2)}"`]);
      rows.push([`"Total Tax"`, `"$${totalTax.toFixed(2)}"`]);
      rows.push([`"Grand Total"`, `"$${grandTotal.toFixed(2)}"`]);
      rows.push([`"Total Savings"`, `"$${totalSavings.toFixed(2)}"`]);
      rows.push([`"Budget"`, `"$${budget.toFixed(2)}"`]);
      rows.push([`"Remaining"`, `"$${remainingBudget.toFixed(2)}"`]);
      content = rows.map(r => r.join(",")).join("\n");

    } else if (format === "json") {
      mimeType = "application/json";
      extension = "json";
      const exportObject = {
        application: "MJD Shopping Manager",
        version: "2.4.0",
        exportedAt: dateStr,
        lockedReadOnly: isReadOnly,
        store: store?.name,
        storeAddress: store?.streetAddress,
        budget,
        subtotal,
        taxes: {
          stateRate,
          countyRate,
          cityRate,
          stateTax,
          countyTax,
          cityTax,
          totalTax,
        },
        grandTotal,
        totalSavings,
        remainingBudget,
        items: processed.map(it => ({
          name: it.name,
          category: it.category,
          department: it.department,
          quantity: it.q,
          regularPrice: it.reg,
          saleDiscount: it.sale,
          couponDiscount: it.coupon,
          netUnitPrice: it.net,
          subtotal: it.sub,
          savings: it.sav,
          isTaxable: it.isTaxable,
          notes: it.notes,
        })),
      };
      content = JSON.stringify(exportObject, null, 2);

    } else if (format === "md" || format === "markdown") {
      mimeType = "text/markdown";
      extension = "md";
      const lines = [
        `# 🛒 MJD Shopping Manager - Export Summary`,
        `**List:** ${activeList.name}  `,
        `**Store:** ${store?.name || "Store"} (${store?.streetAddress || "Pueblo, CO"})  `,
        `**Exported:** ${new Date().toLocaleString()}  `,
        `**Protection:** ${isReadOnly ? "🔒 Read-Only Lock" : "Standard"}  `,
        "",
        `## 📦 Itemized Manifest`,
        `| Item | Qty | Reg Price | Discounts | Unit Net | Subtotal | Taxable |`,
        `| :--- | :---: | :---: | :---: | :---: | :---: | :---: |`,
      ];
      for (const it of processed) {
        const discStr = it.sav > 0 ? `-$${it.sav.toFixed(2)}` : "$0.00";
        lines.push(`| **${it.name}** | ${it.q} | $${it.reg.toFixed(2)} | ${discStr} | $${it.net.toFixed(2)} | **$${it.sub.toFixed(2)}** | ${it.isTaxable ? "✓" : "-"} |`);
      }
      lines.push(
        "",
        `## 💰 Financial Breakdown & Taxes`,
        `- **Merchandise Subtotal:** $${subtotal.toFixed(2)}`,
        `- **Colorado State Tax (2.90%):** $${stateTax.toFixed(2)}`,
        `- **Pueblo County Tax (1.00%):** $${countyTax.toFixed(2)}`,
        `- **City of Pueblo Tax (3.70%):** $${cityTax.toFixed(2)}`,
        `- **Total Sales Tax:** $${totalTax.toFixed(2)}`,
        `- **GRAND TOTAL:** **$${grandTotal.toFixed(2)}**`,
        `- **Promotional Savings:** $${totalSavings.toFixed(2)}`,
        "",
        `## 📊 Budget Status`,
        `- **Budget:** $${budget.toFixed(2)}`,
        `- **Remaining Cash:** $${remainingBudget.toFixed(2)}`,
        `- **Status:** ${grandTotal > budget ? "⚠️ Over Budget" : "✅ Under Budget"}`,
        "",
        `---`,
        `*Generated securely by MJD Shopping Manager*`
      );
      content = lines.join("\n");

    } else {
      // Plain text formatted
      const lines = [
        "========================================",
        "         MJD SHOPPING MANAGER           ",
        `Store: ${store?.name || "Store"}`,
        `Date:  ${new Date().toLocaleString()}`,
        `Protection: ${isReadOnly ? "READ-ONLY FILE" : "STANDARD"}`,
        "========================================",
        "",
        "ITEMS:",
      ];
      for (const it of processed) {
        const flag = it.isTaxable ? "[T]" : "[ ]";
        lines.push(`• ${it.q}x ${it.name} - $${it.sub.toFixed(2)} ${flag}`);
        if (it.sav > 0) lines.push(`   Saved: $${it.sav.toFixed(2)}`);
      }
      lines.push(
        "",
        "----------------------------------------",
        `Subtotal:          $${subtotal.toFixed(2)}`,
        `CO State Tax:      $${stateTax.toFixed(2)}`,
        `Pueblo County Tax: $${countyTax.toFixed(2)}`,
        `City of Pueblo:    $${cityTax.toFixed(2)}`,
        `Total Sales Tax:   $${totalTax.toFixed(2)}`,
        "========================================",
        `GRAND TOTAL:       $${grandTotal.toFixed(2)}`,
        `TOTAL SAVINGS:     $${totalSavings.toFixed(2)}`,
        `Starting Budget:   $${budget.toFixed(2)}`,
        `Remaining Balance: $${remainingBudget.toFixed(2)}`,
        "========================================",
        "      THANK YOU FOR SHOPPING!           "
      );
      content = lines.join("\n");
    }

    let finalContent = content;
    let isEncrypted = false;
    if (encryptionKey && encryptionKey.trim()) {
      finalContent = xorEncrypt(content, encryptionKey.trim());
      isEncrypted = true;
      extension += ".enc";
    }

    const filename = `mjd_export_${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`;

    return NextResponse.json({
      ok: true,
      filename,
      mimeType,
      isEncrypted,
      isReadOnly,
      content: finalContent,
      preview: content.slice(0, 800),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
