"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Star,
  Trash2,
  Copy,
  Edit2,
  ArrowUp,
  ArrowDown,
  Tag,
  Receipt,
  DollarSign,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { soundFX } from "@/lib/audio";

interface CartViewProps {
  items: any[];
  summary: any;
  currentStore: any;
  activeList: any;
  onAddItemClick: () => void;
  onEditItemClick: (item: any) => void;
  onDuplicateItem: (id: number) => Promise<void>;
  onDeleteItem: (id: number) => Promise<void>;
  onToggleFavorite: (id: number) => Promise<void>;
  onToggleTaxable: (id: number) => Promise<void>;
  onMoveItem: (id: number, direction: "up" | "down") => Promise<void>;
  onQuickUpdateQty: (id: number, newQty: number) => Promise<void>;
  onClearCart: () => Promise<void>;
  onCheckout: () => void;
  onUpdateBudget: (newBudget: string) => Promise<void>;
}

export const CartView: React.FC<CartViewProps> = ({
  items,
  summary,
  currentStore,
  activeList,
  onAddItemClick,
  onEditItemClick,
  onDuplicateItem,
  onDeleteItem,
  onToggleFavorite,
  onToggleTaxable,
  onMoveItem,
  onQuickUpdateQty,
  onClearCart,
  onCheckout,
  onUpdateBudget,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterTaxable, setFilterTaxable] = useState<"all" | "taxable" | "non-taxable">("all");
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetValue, setBudgetValue] = useState(summary?.budget?.toString() || "150.00");

  const categories = Array.from(new Set(items.map((i) => i.category || "General")));

  const filteredItems = items.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCategory = item.category?.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      if (!matchName && !matchCategory && !matchNotes) return false;
    }
    if (selectedCategory !== "all" && item.category !== selectedCategory) {
      return false;
    }
    if (filterFavorites && !item.isFavorite) {
      return false;
    }
    if (filterTaxable === "taxable" && !item.isTaxable) return false;
    if (filterTaxable === "non-taxable" && item.isTaxable) return false;
    return true;
  });

  const handleSaveBudget = async () => {
    await onUpdateBudget(budgetValue);
    setIsEditingBudget(false);
  };

  const budget = summary ? Number(summary.budget) : 150;
  const grandTotal = summary ? Number(summary.grandTotal) : 0;
  const remaining = summary ? Number(summary.remainingBudget) : budget;
  const isOverspent = summary ? summary.isOverspent : false;
  const visibleTaxes = summary?.visibleTaxes || [];

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">Shopping Cart & Planner</h2>
            <span className="rounded-full bg-cyan-950 px-2.5 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-800/40">
              {items.length} Items
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Store: <span className="text-white font-semibold">{currentStore?.name}</span> • Target Budget:{" "}
            {isEditingBudget ? (
              <span className="inline-flex items-center gap-1">
                <input
                  type="number"
                  step="1"
                  value={budgetValue}
                  onChange={(e) => setBudgetValue(e.target.value)}
                  className="w-20 rounded border border-cyan-500 bg-slate-950 px-1 py-0.5 text-xs text-white"
                />
                <button
                  onClick={handleSaveBudget}
                  className="rounded bg-cyan-500 px-2 py-0.5 text-[10px] font-bold text-slate-950"
                >
                  Save
                </button>
              </span>
            ) : (
              <button
                onClick={() => setIsEditingBudget(true)}
                className="font-bold text-cyan-400 underline hover:text-cyan-300"
              >
                ${budget.toFixed(2)} (Click to edit)
              </button>
            )}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              soundFX.playClick();
              onAddItemClick();
            }}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-md shadow-cyan-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Add Item</span>
          </button>
          <button
            onClick={() => {
              soundFX.playSuccess();
              onCheckout();
            }}
            disabled={items.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-md shadow-emerald-500/20"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Complete Trip</span>
          </button>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to clear all items from this shopping cart?")) {
                soundFX.playClick();
                onClearCart();
              }
            }}
            disabled={items.length === 0}
            className="flex items-center gap-1 rounded-xl border border-rose-800/60 bg-rose-950/30 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/50 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Cart</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search cart items by name, brand, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Category filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Favorite & Taxable filter buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterFavorites(!filterFavorites)}
            className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
              filterFavorites
                ? "border-amber-500/50 bg-amber-950/50 text-amber-300"
                : "border-slate-700 bg-slate-950 text-slate-400"
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${filterFavorites ? "fill-amber-400 text-amber-400" : ""}`} />
            <span>Favorites</span>
          </button>
          <button
            onClick={() => {
              if (filterTaxable === "all") setFilterTaxable("taxable");
              else if (filterTaxable === "taxable") setFilterTaxable("non-taxable");
              else setFilterTaxable("all");
            }}
            className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              filterTaxable !== "all"
                ? "border-cyan-500/50 bg-cyan-950/50 text-cyan-300"
                : "border-slate-700 bg-slate-950 text-slate-400"
            }`}
          >
            {filterTaxable === "all" ? "All Tax" : filterTaxable === "taxable" ? "Taxable Only" : "Non-Tax Only"}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 pl-4 pr-1 text-center w-8">#</th>
                <th className="py-3 px-1 text-center w-8">Fav</th>
                <th className="py-3 px-3">Item Details</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center w-28">Quantity</th>
                <th className="py-3 px-3 text-right">Reg Price</th>
                <th className="py-3 px-3 text-right">Discounts</th>
                <th className="py-3 px-3 text-right">Net Unit</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
                <th className="py-3 px-2 text-center w-16">Tax</th>
                <th className="py-3 pl-2 pr-4 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <ShoppingBag className="mx-auto h-10 w-10 stroke-1 text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-400">No items found matching your filters</p>
                    <p className="text-xs text-slate-600 mt-1">Try resetting search or click Add Item above.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Index & Reorder */}
                    <td className="py-3 pl-4 pr-1 text-center text-slate-500">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => onMoveItem(item.id, "up")}
                          disabled={idx === 0}
                          className="text-slate-600 hover:text-cyan-400 disabled:opacity-20"
                          title="Move up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <span className="text-[11px] font-bold text-slate-400">{idx + 1}</span>
                        <button
                          onClick={() => onMoveItem(item.id, "down")}
                          disabled={idx === filteredItems.length - 1}
                          className="text-slate-600 hover:text-cyan-400 disabled:opacity-20"
                          title="Move down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                    </td>

                    {/* Favorite */}
                    <td className="py-3 px-1 text-center">
                      <button
                        onClick={() => {
                          soundFX.playClick();
                          onToggleFavorite(item.id);
                        }}
                        title={item.isFavorite ? "Remove favorite" : "Mark favorite"}
                      >
                        <Star className={`h-4 w-4 ${item.isFavorite ? "fill-amber-400 text-amber-400" : "text-slate-600 hover:text-amber-400"}`} />
                      </button>
                    </td>

                    {/* Name & Notes */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-white text-sm">{item.name}</div>
                      {item.notes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">{item.notes}</div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                        {item.category || "General"}
                      </span>
                    </td>

                    {/* Quantity Step Controls */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950 p-0.5">
                        <button
                          onClick={() => onQuickUpdateQty(item.id, Math.max(1, Number(item.quantity) - 1))}
                          className="h-6 w-6 rounded bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-white">
                          {Number(item.quantity).toFixed(0)}
                        </span>
                        <button
                          onClick={() => onQuickUpdateQty(item.id, Number(item.quantity) + 1)}
                          className="h-6 w-6 rounded bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Regular Price */}
                    <td className="py-3 px-3 text-right font-medium text-slate-300">
                      ${Number(item.regularPriceNum || item.unitPrice).toFixed(2)}
                    </td>

                    {/* Discounts */}
                    <td className="py-3 px-3 text-right">
                      {item.itemSavings > 0 ? (
                        <span className="rounded bg-emerald-950/80 px-1.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-800/40">
                          -${Number(item.itemSavings).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-600">$0.00</span>
                      )}
                    </td>

                    {/* Net Unit Price */}
                    <td className="py-3 px-3 text-right font-semibold text-slate-200">
                      ${Number(item.netUnitPrice).toFixed(2)}
                    </td>

                    {/* Item Subtotal */}
                    <td className="py-3 px-3 text-right font-black text-cyan-400 text-sm">
                      ${Number(item.itemSubtotal).toFixed(2)}
                    </td>

                    {/* Taxable Flag Toggle */}
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => {
                          soundFX.playClick();
                          onToggleTaxable(item.id);
                        }}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                          item.isTaxable
                            ? "bg-cyan-950 text-cyan-400 border-cyan-800/60"
                            : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}
                        title={item.isTaxable ? "Taxable (Click to exempt)" : "Non-Taxable (Click to tax)"}
                      >
                        {item.isTaxable ? "TAX" : "NO"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 pl-2 pr-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEditItemClick(item)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-400"
                          title="Edit Item"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            soundFX.playAdd();
                            onDuplicateItem(item.id);
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-purple-400"
                          title="Duplicate Item"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            soundFX.playClick();
                            onDeleteItem(item.id);
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400"
                          title="Delete Item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Totals */}
        <div className="border-t border-slate-800 bg-slate-950/80 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Taxes summary inline */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>Merchandise: <strong className="text-white">${summary?.subtotal?.toFixed(2) || "0.00"}</strong></span>
              {visibleTaxes.map((t: any) => (
                <span key={t.name} className="text-cyan-300">
                  {t.name} ({t.percentageStr}): <strong className="text-cyan-400">${t.amount.toFixed(2)}</strong>
                </span>
              ))}
              <span>Total Tax: <strong className="text-amber-400">${summary?.totalTax?.toFixed(2) || "0.00"}</strong></span>
            </div>

            {/* Final Grand Total and Budget Remaining */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[11px] uppercase font-bold text-slate-400">Grand Total</span>
                <div className="text-xl font-black text-cyan-400">${grandTotal.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase font-bold text-slate-400">
                  {isOverspent ? "Over Budget" : "Remaining"}
                </span>
                <div className={`text-xl font-black ${isOverspent ? "text-rose-400" : "text-emerald-400"}`}>
                  {isOverspent ? `-$${Math.abs(remaining).toFixed(2)}` : `$${remaining.toFixed(2)}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
