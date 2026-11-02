"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  TrendingUp,
  DollarSign,
  Calendar,
  Store,
  Tag,
  Receipt,
  RotateCcw,
  Trash2,
  Eye,
  ShoppingBag,
  Award,
  Sparkles,
} from "lucide-react";
import { soundFX } from "@/lib/audio";

interface HistoryStatsViewProps {
  onRefreshCart: () => Promise<void>;
  onNavigateTab: (tab: string) => void;
}

export const HistoryStatsView: React.FC<HistoryStatsViewProps> = ({
  onRefreshCart,
  onNavigateTab,
}) => {
  const [trips, setTrips] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tripsRes, statsRes] = await Promise.all([
        fetch(`/api/history?q=${encodeURIComponent(searchQuery)}`),
        fetch("/api/statistics"),
      ]);
      const tripsData = await tripsRes.json();
      const statsData = await statsRes.json();
      if (tripsData.ok) setTrips(tripsData.trips);
      if (statsData.ok) setStats(statsData.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const handleRestoreTrip = async (tripId: number) => {
    soundFX.playSuccess();
    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", tripId }),
      });
      const data = await res.json();
      if (data.ok) {
        await onRefreshCart();
        onNavigateTab("cart");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTrip = async (tripId: number) => {
    if (!confirm("Delete this trip record from history?")) return;
    soundFX.playClick();
    try {
      const res = await fetch(`/api/history?id=${tripId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        fetchData();
        if (selectedTrip?.id === tripId) setSelectedTrip(null);
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
            <History className="h-5 w-5 text-cyan-400" />
            Shopping History & Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track past shopping sessions, inspect itemized receipts, and view lifetime spending statistics.
          </p>
        </div>
      </div>

      {/* Analytics KPI Tiles */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Money Spent</span>
            <div className="mt-2 text-2xl font-black text-white sm:text-3xl">${stats.moneySpent}</div>
            <span className="mt-1 block text-xs text-slate-500">{stats.trips} trips recorded</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Trip Cost</span>
            <div className="mt-2 text-2xl font-black text-cyan-400 sm:text-3xl">${stats.averageTrip}</div>
            <span className="mt-1 block text-xs text-slate-500">Max: ${stats.largestTrip} • Min: ${stats.smallestTrip}</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Taxes Paid</span>
            <div className="mt-2 text-2xl font-black text-amber-400 sm:text-3xl">${stats.taxesPaid}</div>
            <span className="mt-1 block text-xs text-slate-500">Pueblo CO itemized taxes</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Money Saved</span>
            <div className="mt-2 text-2xl font-black text-emerald-400 sm:text-3xl">${stats.moneySaved}</div>
            <span className="mt-1 block text-xs text-slate-500">{stats.couponsUsed} coupons redeemed</span>
          </div>
        </div>
      )}

      {/* Category Breakdown & Insights */}
      {stats && stats.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Favorite store & most bought item */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" />
              Shopping Habits
            </h3>
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-500">Favorite Store:</span>
                <p className="text-sm font-bold text-white mt-0.5">{stats.favoriteStore}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-500">Most Purchased Item:</span>
                <p className="text-sm font-bold text-cyan-400 mt-0.5">{stats.mostPurchasedItem}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-500">Total Items Acquired:</span>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">{stats.itemsPurchased} Units</p>
              </div>
            </div>
          </div>

          {/* Category spending bars */}
          <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              Spending by Department
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.categoryBreakdown).map(([category, amount]: [string, any]) => {
                const total = parseFloat(stats.moneySpent) || 1;
                const amt = parseFloat(amount) || 0;
                const pct = ((amt / total) * 100).toFixed(1);
                return (
                  <div key={category} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-300">{category}</span>
                      <span className="font-bold text-cyan-400">${amt.toFixed(2)} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, parseFloat(pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* History Log Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Completed Shopping Trips ({trips.length})</h3>
        </div>

        {trips.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <History className="mx-auto h-10 w-10 stroke-1 text-slate-600 mb-2" />
            <p className="font-semibold text-slate-400">No completed trips in history yet.</p>
            <p className="text-xs text-slate-600 mt-1">Complete a trip from the cart or dashboard to log it here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {trips.map((trip) => (
              <div key={trip.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{trip.listName}</h4>
                    <span className="rounded bg-slate-800 px-2 py-0.2 text-[10px] font-bold text-slate-300">
                      {trip.storeName}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      {new Date(trip.completedAt).toLocaleString()}
                    </span>
                    <span>•</span>
                    <span>{trip.itemsCount} Items</span>
                    <span>•</span>
                    <span>Taxes: <strong className="text-amber-400">${Number(trip.totalTax).toFixed(2)}</strong></span>
                    {Number(trip.moneySaved) > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">Saved ${Number(trip.moneySaved).toFixed(2)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Total Paid</span>
                    <span className="text-base font-black text-cyan-400">${Number(trip.grandTotal).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => setSelectedTrip(trip)}
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Inspect</span>
                  </button>
                  <button
                    onClick={() => handleRestoreTrip(trip.id)}
                    className="flex items-center gap-1 rounded-lg border border-cyan-800/60 bg-cyan-950/40 px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/60"
                    title="Restore items to active cart"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTrip(trip.id)}
                    className="rounded p-1 text-slate-500 hover:text-rose-400"
                    title="Delete record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspect Trip Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white">{selectedTrip.listName}</h3>
                <p className="text-xs text-slate-400">{selectedTrip.storeName} • {new Date(selectedTrip.completedAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedTrip(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300"
              >
                Close
              </button>
            </div>

            {/* Items table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Items Purchased ({selectedTrip.items?.length || 0})</h4>
              <div className="divide-y divide-slate-800/60 max-h-56 overflow-y-auto text-xs">
                {(selectedTrip.items || []).map((it: any, i: number) => (
                  <div key={i} className="py-2 flex justify-between">
                    <div>
                      <span className="font-semibold text-white">{it.name}</span>
                      <span className="text-slate-500 ml-2">({it.quantity}x @ ${Number(it.unitPrice).toFixed(2)})</span>
                    </div>
                    <span className="font-bold text-cyan-400">${Number(it.netSubtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Merchandise Subtotal:</span>
                <span className="font-semibold text-white">${Number(selectedTrip.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-cyan-300">
                <span>Colorado State Tax:</span>
                <span>${Number(selectedTrip.stateTax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-cyan-300">
                <span>Pueblo County Tax:</span>
                <span>${Number(selectedTrip.countyTax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-cyan-300">
                <span>City of Pueblo Tax:</span>
                <span>${Number(selectedTrip.cityTax).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-800 my-1" />
              <div className="flex justify-between text-sm font-black text-white">
                <span>Grand Total:</span>
                <span className="text-cyan-400">${Number(selectedTrip.grandTotal).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleRestoreTrip(selectedTrip.id)}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Restore to Active Cart</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
