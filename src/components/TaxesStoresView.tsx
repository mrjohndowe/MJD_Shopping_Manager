"use client";

import React, { useState } from "react";
import {
  Store,
  Percent,
  Plus,
  Check,
  Edit2,
  Trash2,
  Calculator,
  Building,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";
import { soundFX } from "@/lib/audio";

interface TaxesStoresViewProps {
  stores: any[];
  currentStore: any;
  onSelectStore: (storeId: number) => void;
  onSetDefaultStore: (storeId: number) => Promise<void>;
  onAddStore: (storeData: any) => Promise<void>;
  onUpdateStore: (storeData: any) => Promise<void>;
  onDeleteStore: (storeId: number) => Promise<void>;
}

export const TaxesStoresView: React.FC<TaxesStoresViewProps> = ({
  stores,
  currentStore,
  onSelectStore,
  onSetDefaultStore,
  onAddStore,
  onUpdateStore,
  onDeleteStore,
}) => {
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<number | null>(null);

  // New Store Form State
  const [name, setName] = useState("");
  const [chain, setChain] = useState("Custom");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("Pueblo");
  const [state, setState] = useState("CO");
  const [zipCode, setZipCode] = useState("81008");
  const [phone, setPhone] = useState("(719) 555-0100");
  const [stateTaxPct, setStateTaxPct] = useState("2.90");
  const [countyTaxPct, setCountyTaxPct] = useState("1.00");
  const [cityTaxPct, setCityTaxPct] = useState("3.70");
  const [specialTaxPct, setSpecialTaxPct] = useState("0.00");
  const [notes, setNotes] = useState("");

  // Sandbox Calculator State
  const [sandboxAmount, setSandboxAmount] = useState("100.00");
  const [sandboxStoreId, setSandboxStoreId] = useState<number>(currentStore?.id || 1);

  const activeSandboxStore = stores.find((s) => s.id === Number(sandboxStoreId)) || currentStore || stores[0];

  const calcStateRate = Number(activeSandboxStore?.stateTaxRate || "0.0290");
  const calcCountyRate = Number(activeSandboxStore?.countyTaxRate || "0.0100");
  const calcCityRate = Number(activeSandboxStore?.cityTaxRate || "0.0370");
  const calcSpecialRate = Number(activeSandboxStore?.specialTaxRate || "0.0000");
  const calcTotalRate = calcStateRate + calcCountyRate + calcCityRate + calcSpecialRate;

  const sandboxNum = Math.max(0, parseFloat(sandboxAmount) || 0);
  const sandboxStateTax = sandboxNum * calcStateRate;
  const sandboxCountyTax = sandboxNum * calcCountyRate;
  const sandboxCityTax = sandboxNum * calcCityRate;
  const sandboxSpecialTax = sandboxNum * calcSpecialRate;
  const sandboxTotalTax = sandboxStateTax + sandboxCountyTax + sandboxCityTax + sandboxSpecialTax;
  const sandboxGrandTotal = sandboxNum + sandboxTotalTax;

  const handleSaveNewStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    soundFX.playAdd();
    await onAddStore({
      name: name.trim(),
      chain,
      streetAddress,
      city,
      state,
      zipCode,
      phone,
      stateTaxRate: (parseFloat(stateTaxPct) / 100).toFixed(4),
      countyTaxRate: (parseFloat(countyTaxPct) / 100).toFixed(4),
      cityTaxRate: (parseFloat(cityTaxPct) / 100).toFixed(4),
      specialTaxRate: (parseFloat(specialTaxPct) / 100).toFixed(4),
      notes,
    });
    setIsAddingStore(false);
    setName("");
  };

  const handleStartEdit = (store: any) => {
    setEditingStoreId(store.id);
    setName(store.name);
    setChain(store.chain || "Custom");
    setStreetAddress(store.streetAddress || "");
    setCity(store.city || "Pueblo");
    setState(store.state || "CO");
    setZipCode(store.zipCode || "81008");
    setPhone(store.phone || "");
    setStateTaxPct((Number(store.stateTaxRate) * 100).toFixed(2));
    setCountyTaxPct((Number(store.countyTaxRate) * 100).toFixed(2));
    setCityTaxPct((Number(store.cityTaxRate) * 100).toFixed(2));
    setSpecialTaxPct((Number(store.specialTaxRate) * 100).toFixed(2));
    setNotes(store.notes || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStoreId) return;
    soundFX.playClick();
    await onUpdateStore({
      id: editingStoreId,
      name,
      chain,
      streetAddress,
      city,
      state,
      zipCode,
      phone,
      stateTaxRate: (parseFloat(stateTaxPct) / 100).toFixed(4),
      countyTaxRate: (parseFloat(countyTaxPct) / 100).toFixed(4),
      cityTaxRate: (parseFloat(cityTaxPct) / 100).toFixed(4),
      specialTaxRate: (parseFloat(specialTaxPct) / 100).toFixed(4),
      notes,
    });
    setEditingStoreId(null);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-cyan-950 px-3 py-1 text-xs font-bold text-cyan-400 border border-cyan-800/60">
                Pueblo, Colorado Jurisdiction
              </span>
              <span className="text-xs text-slate-400">Total Standard Rate: 7.60%</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-2">Sales Tax & Store Profiles</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Taxes are itemized separately for Colorado State (2.90%), Pueblo County (1.00%), and the City of Pueblo (3.70%). Every store profile can retain custom tax overrides or special district rates.
            </p>
          </div>
          <button
            onClick={() => setIsAddingStore(true)}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Custom Store</span>
          </button>
        </div>
      </div>

      {/* Grid: Stores List & Sandbox Calculator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Store Profiles Table / Cards */}
        <div className="space-y-4 lg:col-span-2">
          {/* Add / Edit Form Modal/Card */}
          {(isAddingStore || editingStoreId !== null) && (
            <form
              onSubmit={editingStoreId ? handleSaveEdit : handleSaveNewStore}
              className="rounded-2xl border border-cyan-500/40 bg-slate-900 p-5 space-y-4 shadow-xl"
            >
              <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <Store className="h-4 w-4" />
                {editingStoreId ? "Edit Store Profile & Taxes" : "Create New Store Profile"}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Store Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Walmart Supercenter #1001"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Chain / Preset</label>
                  <select
                    value={chain}
                    onChange={(e) => setChain(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Walmart">Walmart</option>
                    <option value="Sam's Club">Sam's Club</option>
                    <option value="Costco">Costco</option>
                    <option value="Target">Target</option>
                    <option value="Home Depot">Home Depot</option>
                    <option value="Lowe's">Lowe's</option>
                    <option value="Best Buy">Best Buy</option>
                    <option value="Custom">Custom / Local Store</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Street Address</label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="4200 Dillon Dr"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(719) 555-0100"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tax Rates Inputs */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <p className="text-xs font-bold text-white mb-2">Itemized Tax Rates (%)</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400">CO State Tax (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={stateTaxPct}
                      onChange={(e) => setStateTaxPct(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Pueblo County (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={countyTaxPct}
                      onChange={(e) => setCountyTaxPct(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">City Tax (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={cityTaxPct}
                      onChange={(e) => setCityTaxPct(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Special District (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={specialTaxPct}
                      onChange={(e) => setSpecialTaxPct(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingStore(false);
                    setEditingStoreId(null);
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                >
                  {editingStoreId ? "Save Changes" : "Create Store"}
                </button>
              </div>
            </form>
          )}

          {/* Stores List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 divide-y divide-slate-800">
            {stores.map((s) => {
              const totalRate = (Number(s.stateTaxRate) + Number(s.countyTaxRate) + Number(s.cityTaxRate) + Number(s.specialTaxRate)) * 100;
              const isCurrent = currentStore?.id === s.id;
              return (
                <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{s.name}</h4>
                      {s.isDefault && (
                        <span className="rounded-full bg-emerald-950 px-2 py-0.2 text-[10px] font-bold text-emerald-400 border border-emerald-800/40">
                          Default Store
                        </span>
                      )}
                      {isCurrent && (
                        <span className="rounded-full bg-cyan-950 px-2 py-0.2 text-[10px] font-bold text-cyan-400 border border-cyan-800/40">
                          Active in Cart
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        {s.streetAddress || "Pueblo, CO"}
                      </span>
                      <span>•</span>
                      <span>{s.phone || "(719) 555-0100"}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-2">
                      <span className="rounded bg-slate-950 px-1.5 py-0.5 border border-slate-800">
                        CO State: {(Number(s.stateTaxRate) * 100).toFixed(2)}%
                      </span>
                      <span className="rounded bg-slate-950 px-1.5 py-0.5 border border-slate-800">
                        Pueblo Co: {(Number(s.countyTaxRate) * 100).toFixed(2)}%
                      </span>
                      <span className="rounded bg-slate-950 px-1.5 py-0.5 border border-slate-800">
                        City: {(Number(s.cityTaxRate) * 100).toFixed(2)}%
                      </span>
                      <span className="rounded bg-cyan-950 px-2 py-0.5 font-bold text-cyan-300 border border-cyan-800/40">
                        Total Tax: {totalRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isCurrent && (
                      <button
                        onClick={() => {
                          soundFX.playClick();
                          onSelectStore(s.id);
                        }}
                        className="rounded-lg border border-cyan-800/50 bg-cyan-950/40 px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/50"
                      >
                        Use in Cart
                      </button>
                    )}
                    {!s.isDefault && (
                      <button
                        onClick={() => {
                          soundFX.playClick();
                          onSetDefaultStore(s.id);
                        }}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white"
                        title="Set as Default Store"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleStartEdit(s)}
                      className="rounded p-1 text-slate-400 hover:text-cyan-400"
                      title="Edit Store"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {stores.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete store ${s.name}?`)) {
                            soundFX.playClick();
                            onDeleteStore(s.id);
                          }
                        }}
                        className="rounded p-1 text-slate-500 hover:text-rose-400"
                        title="Delete Store"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Sandbox Tax Calculator */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-cyan-400" />
              Tax Calculator Sandbox
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Test exact Pueblo sales taxes for any arbitrary subtotal against different store profiles.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300">Target Store</label>
                <select
                  value={sandboxStoreId}
                  onChange={(e) => setSandboxStoreId(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300">Merchandise Dollar Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sandboxAmount}
                  onChange={(e) => setSandboxAmount(e.target.value)}
                  placeholder="100.00"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Breakdown Box */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Merchandise Subtotal:</span>
                  <span className="font-semibold text-white">${sandboxNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-cyan-300">
                  <span>Colorado State Tax ({(calcStateRate * 100).toFixed(2)}%):</span>
                  <span className="font-bold text-cyan-400">${sandboxStateTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-cyan-300">
                  <span>Pueblo County Tax ({(calcCountyRate * 100).toFixed(2)}%):</span>
                  <span className="font-bold text-cyan-400">${sandboxCountyTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-cyan-300">
                  <span>City of Pueblo Tax ({(calcCityRate * 100).toFixed(2)}%):</span>
                  <span className="font-bold text-cyan-400">${sandboxCityTax.toFixed(2)}</span>
                </div>
                {calcSpecialRate > 0 && (
                  <div className="flex justify-between text-cyan-300">
                    <span>Special District Tax ({(calcSpecialRate * 100).toFixed(2)}%):</span>
                    <span className="font-bold text-cyan-400">${sandboxSpecialTax.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-slate-800 my-2" />
                <div className="flex justify-between text-sm font-bold text-amber-400">
                  <span>Total Sales Tax ({(calcTotalRate * 100).toFixed(2)}%):</span>
                  <span>${sandboxTotalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-1">
                  <span>Estimated Total:</span>
                  <span className="text-cyan-400">${sandboxGrandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
