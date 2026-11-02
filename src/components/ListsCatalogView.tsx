"use client";

import React, { useState, useEffect } from "react";
import {
  List,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Check,
  Search,
  ShoppingCart,
  Star,
  Sparkles,
  ShoppingBag,
  Store,
} from "lucide-react";
import { soundFX } from "@/lib/audio";

interface ListsCatalogViewProps {
  lists: any[];
  activeList: any;
  stores: any[];
  onSwitchList: (listId: number) => Promise<void>;
  onCreateList: (listData: any) => Promise<void>;
  onDuplicateList: (listId: number) => Promise<void>;
  onDeleteList: (listId: number) => Promise<void>;
  onRefreshCart: () => Promise<void>;
}

export const ListsCatalogView: React.FC<ListsCatalogViewProps> = ({
  lists,
  activeList,
  stores,
  onSwitchList,
  onCreateList,
  onDuplicateList,
  onDeleteList,
  onRefreshCart,
}) => {
  // New List State
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListBudget, setNewListBudget] = useState("150.00");
  const [newListStoreId, setNewListStoreId] = useState<number>(stores[0]?.id || 1);

  // Catalog State
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [isAddingCatalogItem, setIsAddingCatalogItem] = useState(false);
  const [catName, setCatName] = useState("");
  const [catPrice, setCatPrice] = useState("0.00");
  const [catCategory, setCatCategory] = useState("Grocery");
  const [catTaxable, setCatTaxable] = useState(true);

  const fetchCatalog = async (q: string = "") => {
    try {
      const res = await fetch(`/api/catalog?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.ok) {
        setCatalogItems(data.catalog);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCatalog(catalogSearch);
  }, [catalogSearch]);

  const handleCreateListSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    soundFX.playAdd();
    await onCreateList({
      name: newListName.trim(),
      budget: newListBudget,
      storeId: newListStoreId,
    });
    setIsCreatingList(false);
    setNewListName("");
  };

  const handleAddCatalogToCart = async (catalogItemId: number) => {
    soundFX.playAdd();
    try {
      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_to_cart", catalogItemId }),
      });
      const data = await res.json();
      if (data.ok) {
        await onRefreshCart();
        fetchCatalog(catalogSearch);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNewCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    soundFX.playAdd();
    try {
      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: catName.trim(),
          regularPrice: catPrice,
          category: catCategory,
          department: "Grocery",
          isTaxable: catTaxable,
          isFavorite: false,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsAddingCatalogItem(false);
        setCatName("");
        setCatPrice("0.00");
        fetchCatalog();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <List className="h-5 w-5 text-cyan-400" />
            Shopping Lists & Item Catalog
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Switch between multiple shopping trips or pick items quickly from your catalog.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingList(true)}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-md shadow-cyan-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>New Shopping List</span>
          </button>
        </div>
      </div>

      {/* Grid: Lists and Catalog */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Col: Shopping Lists */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Saved Shopping Lists ({lists.length})</h3>
          </div>

          {/* New List Form */}
          {isCreatingList && (
            <form onSubmit={handleCreateListSubmit} className="rounded-2xl border border-cyan-500/40 bg-slate-900 p-4 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400">Create New List</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  placeholder="List Name (e.g., Target Weekend Run)"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Budget ($)</label>
                    <input
                      type="number"
                      step="1"
                      value={newListBudget}
                      onChange={(e) => setNewListBudget(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Store</label>
                    <select
                      value={newListStoreId}
                      onChange={(e) => setNewListStoreId(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white"
                    >
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingList(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                >
                  Create & Activate
                </button>
              </div>
            </form>
          )}

          {/* Lists Container */}
          <div className="space-y-2.5">
            {lists.map((l) => {
              const isActive = activeList?.id === l.id;
              return (
                <div
                  key={l.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    isActive
                      ? "border-cyan-500 bg-cyan-950/20 shadow-md shadow-cyan-500/10"
                      : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold text-sm ${isActive ? "text-cyan-300" : "text-white"}`}>
                          {l.name}
                        </h4>
                        {isActive && (
                          <span className="rounded-full bg-cyan-500/20 px-2 py-0.2 text-[10px] font-bold text-cyan-400 border border-cyan-500/30">
                            Active Cart
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>Budget: <strong className="text-white">${Number(l.budget).toFixed(2)}</strong></span>
                        <span>•</span>
                        <span>Items: <strong className="text-white">{l.itemsCount}</strong></span>
                        <span>•</span>
                        <span>Store: <strong className="text-white">{l.store?.name || "Walmart"}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          onClick={() => {
                            soundFX.playClick();
                            onSwitchList(l.id);
                          }}
                          className="rounded-lg border border-cyan-800/60 bg-cyan-950/40 px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/60"
                        >
                          Switch To
                        </button>
                      )}
                      <button
                        onClick={() => {
                          soundFX.playAdd();
                          onDuplicateList(l.id);
                        }}
                        className="rounded p-1 text-slate-400 hover:text-purple-400"
                        title="Duplicate List"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      {lists.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete list "${l.name}"?`)) {
                              soundFX.playClick();
                              onDeleteList(l.id);
                            }
                          }}
                          className="rounded p-1 text-slate-500 hover:text-rose-400"
                          title="Delete List"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Items Catalog */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Reusable Items Catalog</h3>
            <button
              onClick={() => setIsAddingCatalogItem(true)}
              className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add to Catalog</span>
            </button>
          </div>

          {/* Search catalog */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search catalog items..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* New Catalog Form */}
          {isAddingCatalogItem && (
            <form onSubmit={handleCreateNewCatalogItem} className="rounded-2xl border border-cyan-500/40 bg-slate-900 p-4 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400">Add Item to Catalog</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Item Name"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="col-span-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Regular Price ($)"
                  value={catPrice}
                  onChange={(e) => setCatPrice(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                />
                <select
                  value={catCategory}
                  onChange={(e) => setCatCategory(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white"
                >
                  <option value="Grocery">Grocery</option>
                  <option value="Produce">Produce</option>
                  <option value="Dairy & Eggs">Dairy</option>
                  <option value="Meat & Seafood">Meat</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Household Essentials">Home</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Snacks & Sweets">Snacks</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCatalogItem(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                >
                  Save Item
                </button>
              </div>
            </form>
          )}

          {/* Catalog Items Grid / List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
            {catalogItems.map((item) => (
              <div key={item.id} className="p-3 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                <div>
                  <div className="flex items-center gap-1.5">
                    {item.isFavorite && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                    <span className="text-xs font-bold text-white">{item.name}</span>
                    {item.isTaxable && (
                      <span className="rounded bg-cyan-950 px-1 py-0.2 text-[9px] font-bold text-cyan-400 border border-cyan-800/40">
                        Tax
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {item.category} • <span className="font-semibold text-slate-200">${Number(item.regularPrice).toFixed(2)}</span>
                    {item.timesPurchased > 0 && (
                      <span className="text-slate-500 ml-2">({item.timesPurchased}x bought)</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleAddCatalogToCart(item.id)}
                  className="flex items-center gap-1 rounded-lg border border-cyan-800/60 bg-cyan-950/40 px-2.5 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
