"use client";

import React, { useState } from "react";
import {
  DollarSign,
  TrendingDown,
  Percent,
  Receipt,
  Plus,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  Tag,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { soundFX } from "@/lib/audio";

interface DashboardViewProps {
  summary: any;
  items: any[];
  currentStore: any;
  activeList: any;
  onAddItem: (itemData: any) => Promise<void>;
  onDeleteItem: (id: number) => Promise<void>;
  onQuickUpdateQty: (id: number, newQty: number) => Promise<void>;
  onNavigateTab: (tab: string) => void;
  onCheckout: () => void;
  recentTrips: any[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  items,
  currentStore,
  activeList,
  onAddItem,
  onDeleteItem,
  onQuickUpdateQty,
  onNavigateTab,
  onCheckout,
  recentTrips,
}) => {
  const [quickName, setQuickName] = useState("");
  const [quickPrice, setQuickPrice] = useState("");
  const [quickCategory, setQuickCategory] = useState("Grocery");
  const [quickTaxable, setQuickTaxable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;
    setIsSubmitting(true);
    try {
      soundFX.playAdd();
      await onAddItem({
        name: quickName.trim(),
        regularPrice: quickPrice || "0.00",
        unitPrice: quickPrice || "0.00",
        quantity: "1.00",
        category: quickCategory,
        department: "Grocery",
        isTaxable: quickTaxable,
      });
      setQuickName("");
      setQuickPrice("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const budget = summary ? Number(summary.budget) : 150;
  const grandTotal = summary ? Number(summary.grandTotal) : 0;
  const remaining = summary ? Number(summary.remainingBudget) : budget;
  const percentUsed = summary ? Number(summary.percentUsed) : 0;
  const isOverspent = summary ? summary.isOverspent : false;
  const totalSavings = summary ? Number(summary.totalSavings) : 0;
  const totalTax = summary ? Number(summary.totalTax) : 0;
  const subtotal = summary ? Number(summary.subtotal) : 0;
  const visibleTaxes = summary?.visibleTaxes || [];

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Over Budget */}
      {isOverspent && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-rose-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold text-rose-300">Over Budget Warning!</p>
              <p className="text-xs text-rose-300/80">
                Current total is <span className="font-bold text-white">${grandTotal.toFixed(2)}</span>, exceeding your budget of ${budget.toFixed(2)} by <span className="font-bold text-rose-400">${Math.abs(remaining).toFixed(2)}</span>.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("cart")}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-colors"
          >
            Review Cart
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Starting Budget */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Allocated Budget</span>
            <DollarSign className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white sm:text-3xl">
            ${budget.toFixed(2)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span>List:</span>
            <span className="font-semibold text-cyan-400">{activeList?.name || "My Shopping List"}</span>
          </div>
        </div>

        {/* Card 2: Grand Total (with Tax) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Current Grand Total</span>
            <Receipt className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-400 sm:text-3xl">
            ${grandTotal.toFixed(2)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
            <span>Subtotal: ${subtotal.toFixed(2)}</span>
            <span className="text-amber-400 font-semibold">+${totalTax.toFixed(2)} Tax</span>
          </div>
        </div>

        {/* Card 3: Remaining Budget */}
        <div className={`rounded-2xl border p-4 shadow-sm backdrop-blur-sm ${
          isOverspent ? "border-rose-900/60 bg-rose-950/20" : "border-slate-800 bg-slate-900/70"
        }`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              {isOverspent ? "Overspent Amount" : "Remaining Cash"}
            </span>
            <TrendingDown className={`h-4 w-4 ${isOverspent ? "text-rose-400" : "text-emerald-400"}`} />
          </div>
          <div className={`mt-2 text-2xl font-black sm:text-3xl ${isOverspent ? "text-rose-400" : "text-emerald-400"}`}>
            {isOverspent ? `-$${Math.abs(remaining).toFixed(2)}` : `$${remaining.toFixed(2)}`}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">{percentUsed}%</span> of total budget spent
          </div>
        </div>

        {/* Card 4: Total Savings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Promotional Savings</span>
            <Tag className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400 sm:text-3xl">
            ${totalSavings.toFixed(2)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {summary?.couponsCount || 0} coupons applied
          </div>
        </div>
      </div>

      {/* Main Row: Instant Budget Meter & Tax Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Budget Progress & Quick Add */}
        <div className="space-y-6 lg:col-span-2">
          {/* Real-time Budget Progress Bar Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
                <h3 className="font-bold text-white">Live Budget Utilization</h3>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isOverspent
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : percentUsed >= 85
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}>
                {percentUsed}% Utilized
              </span>
            </div>

            {/* Progress Track */}
            <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-slate-800 border border-slate-700/60 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverspent
                    ? "bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600"
                    : percentUsed >= 85
                    ? "bg-gradient-to-r from-emerald-500 to-amber-500"
                    : "bg-gradient-to-r from-teal-500 to-emerald-500"
                }`}
                style={{ width: `${Math.min(100, percentUsed)}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>$0.00</span>
              <span>50% (${(budget * 0.5).toFixed(2)})</span>
              <span>Budget Limit (${budget.toFixed(2)})</span>
            </div>
          </div>

          {/* Quick Add Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-cyan-400" />
              Quick Add Item to Cart
            </h3>
            <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Item name (e.g., Honeycrisp Apples)"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                required
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Price ($)"
                  value={quickPrice}
                  onChange={(e) => setQuickPrice(e.target.value)}
                  className="w-24 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Grocery">Grocery</option>
                  <option value="Produce">Produce</option>
                  <option value="Dairy & Eggs">Dairy</option>
                  <option value="Meat & Seafood">Meat</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Household Essentials">Home</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Snacks & Sweets">Snacks</option>
                  <option value="Health & Beauty">Health</option>
                </select>
                <button
                  type="button"
                  onClick={() => setQuickTaxable(!quickTaxable)}
                  className={`rounded-xl border px-2.5 py-2 text-xs font-semibold transition-colors ${
                    quickTaxable
                      ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-400"
                      : "border-slate-700 bg-slate-950 text-slate-400"
                  }`}
                  title={quickTaxable ? "Taxable Item" : "Non-Taxable Item"}
                >
                  {quickTaxable ? "Taxable" : "No Tax"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !quickName.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors shadow-md shadow-cyan-500/20"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Cart Items Preview */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-cyan-400" />
                <h3 className="font-bold text-white">
                  Cart Items ({items.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab("cart")}
                className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
              >
                <span>Full Cart Table</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                <ShoppingBag className="h-10 w-10 stroke-1 mb-2 text-slate-600" />
                <p className="text-sm">Your shopping cart is empty.</p>
                <p className="text-xs text-slate-600 mt-1">Use the quick add bar above or browse the catalog.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {items.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onQuickUpdateQty(item.id, Math.max(1, Number(item.quantity) - 1))}
                          className="h-6 w-6 rounded border border-slate-700 bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-white">
                          {Number(item.quantity).toFixed(0)}
                        </span>
                        <button
                          onClick={() => onQuickUpdateQty(item.id, Number(item.quantity) + 1)}
                          className="h-6 w-6 rounded border border-slate-700 bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                        >
                          +
                        </button>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{item.name}</span>
                          {item.isTaxable && (
                            <span className="rounded bg-cyan-950 px-1.5 py-0.2 text-[10px] font-bold text-cyan-400 border border-cyan-800/40">
                              Taxable
                            </span>
                          )}
                          {item.itemSavings > 0 && (
                            <span className="rounded bg-emerald-950 px-1.5 py-0.2 text-[10px] font-bold text-emerald-400 border border-emerald-800/40">
                              Save ${item.itemSavings.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {item.category} • ${Number(item.unitPrice).toFixed(2)} ea
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-cyan-400">
                        ${Number(item.itemSubtotal).toFixed(2)}
                      </span>
                      <button
                        onClick={() => {
                          soundFX.playClick();
                          onDeleteItem(item.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {items.length > 5 && (
              <p className="mt-3 text-center text-xs text-slate-500">
                + {items.length - 5} more items in cart. Click Full Cart Table to manage.
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Taxes & Quick Actions */}
        <div className="space-y-6">
          {/* Sales Tax Itemized Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Receipt className="h-4 w-4 text-cyan-400" />
                Pueblo, CO Tax Breakdown
              </h3>
              <span className="text-[11px] font-semibold text-cyan-400">
                Store: {currentStore?.name || "Walmart"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Taxable Subtotal</span>
                <span className="font-semibold text-white">${summary?.taxableSubtotal?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Non-Taxable Subtotal</span>
                <span className="font-semibold text-white">${summary?.nonTaxableSubtotal?.toFixed(2) || "0.00"}</span>
              </div>

              <div className="my-2 border-t border-slate-800" />

              {/* Itemized Visible Taxes only */}
              {visibleTaxes.map((tax: any) => (
                <div key={tax.name} className="flex justify-between text-cyan-300">
                  <span>{tax.name} ({tax.percentageStr})</span>
                  <span className="font-bold text-cyan-400">${tax.amount.toFixed(2)}</span>
                </div>
              ))}

              <div className="my-2 border-t border-slate-800" />

              <div className="flex justify-between text-sm font-bold text-white">
                <span>Total Sales Tax</span>
                <span className="text-amber-400">${totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-1">
                <span>Grand Total</span>
                <span className="text-cyan-400">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                soundFX.playSuccess();
                onCheckout();
              }}
              disabled={items.length === 0}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-black text-slate-950 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Complete Shopping Trip</span>
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="font-bold text-white text-sm mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigateTab("receipts")}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-semibold text-slate-300 hover:border-cyan-500/50 hover:text-white transition-all"
              >
                <Sparkles className="h-5 w-5 text-cyan-400 mb-1" />
                <span>Receipt Studio</span>
              </button>
              <button
                onClick={() => onNavigateTab("terminal")}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-semibold text-slate-300 hover:border-amber-500/50 hover:text-white transition-all"
              >
                <ExternalLink className="h-5 w-5 text-amber-400 mb-1" />
                <span>Python CLI</span>
              </button>
              <button
                onClick={() => onNavigateTab("taxes")}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-semibold text-slate-300 hover:border-cyan-500/50 hover:text-white transition-all"
              >
                <Tag className="h-5 w-5 text-purple-400 mb-1" />
                <span>Store Taxes</span>
              </button>
              <button
                onClick={() => onNavigateTab("exports")}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-semibold text-slate-300 hover:border-cyan-500/50 hover:text-white transition-all"
              >
                <Receipt className="h-5 w-5 text-emerald-400 mb-1" />
                <span>Export Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
