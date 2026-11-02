"use client";

import React from "react";
import {
  ShoppingCart,
  Store,
  Palette,
  Volume2,
  VolumeX,
  Terminal,
  HelpCircle,
  Sparkles,
  Sliders,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { soundFX } from "@/lib/audio";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  summary: any;
  stores: any[];
  currentStore: any;
  onSelectStore: (storeId: number) => void;
  theme: string;
  onSelectTheme: (themeId: string) => void;
  isSoundMuted: boolean;
  setIsSoundMuted: (muted: boolean) => void;
  onOpenSetup: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  summary,
  stores,
  currentStore,
  onSelectStore,
  theme,
  onSelectTheme,
  isSoundMuted,
  setIsSoundMuted,
  onOpenSetup,
  onOpenHelp,
}) => {
  const percentUsed = summary ? Number(summary.percentUsed) : 0;
  const isOverspent = summary ? summary.isOverspent : false;
  const grandTotal = summary ? Number(summary.grandTotal) : 0;
  const budget = summary ? Number(summary.budget) : 150;
  const remaining = summary ? Number(summary.remainingBudget) : budget;

  // Determine budget progress bar color
  let progressBg = "bg-emerald-500";
  let statusText = "Within Budget";
  let statusBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

  if (isOverspent) {
    progressBg = "bg-rose-500 animate-pulse";
    statusText = `Over by $${Math.abs(remaining).toFixed(2)}`;
    statusBadge = "bg-rose-500/20 text-rose-400 border-rose-500/30";
  } else if (percentUsed >= 85) {
    progressBg = "bg-amber-500";
    statusText = "Budget Warning (85%+)";
    statusBadge = "bg-amber-500/20 text-amber-300 border-amber-500/30";
  }

  const toggleSound = () => {
    const next = !isSoundMuted;
    setIsSoundMuted(next);
    soundFX.enabled = !next;
    if (!next) soundFX.playClick();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      {/* Top Main Navigation Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white sm:text-xl">
                MJD <span className="text-cyan-400">Shopping Manager</span>
              </span>
              <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-800/50">
                v2.4.0
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">
              Intelligent Terminal & Web Budget Engine • Pueblo, CO (7.60% Tax)
            </p>
          </div>
        </div>

        {/* Real-time Budget Status Bar in Header */}
        <div className="hidden lg:flex flex-col items-center gap-1 min-w-[280px]">
          <div className="flex w-full items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              Spent: <span className="text-cyan-400 font-bold">${grandTotal.toFixed(2)}</span> / ${budget.toFixed(2)}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold border ${statusBadge}`}>
              {isOverspent ? <AlertTriangle className="inline h-3 w-3 mr-1" /> : <CheckCircle2 className="inline h-3 w-3 mr-1" />}
              {statusText} ({percentUsed}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80 border border-slate-700/50">
            <div
              className={`h-full transition-all duration-300 ${progressBg}`}
              style={{ width: `${Math.min(100, percentUsed)}%` }}
            />
          </div>
        </div>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-2">
          {/* Store Selector */}
          <div className="relative hidden md:flex items-center">
            <Store className="absolute left-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={currentStore?.id || ""}
              onChange={(e) => {
                soundFX.playClick();
                onSelectStore(Number(e.target.value));
              }}
              className="h-9 rounded-lg border border-slate-700 bg-slate-900 pl-8 pr-8 text-xs font-medium text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({((Number(s.stateTaxRate) + Number(s.countyTaxRate) + Number(s.cityTaxRate) + Number(s.specialTaxRate)) * 100).toFixed(2)}% Tax)
                </option>
              ))}
            </select>
          </div>

          {/* Setup Wizard Button */}
          <button
            onClick={() => {
              soundFX.playClick();
              onOpenSetup();
            }}
            title="Run Setup Wizard"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-cyan-800/60 bg-cyan-950/40 px-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/50 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Setup</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isSoundMuted ? "Unmute Audio FX" : "Mute Audio FX"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            {isSoundMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-cyan-400" />}
          </button>

          {/* Help Button */}
          <button
            onClick={() => {
              soundFX.playClick();
              onOpenHelp();
            }}
            title="Help & Shortcuts (?)"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Primary Tabs Navigation Bar */}
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-1.5 sm:px-6 scrollbar-none border-t border-slate-800/60">
        {[
          { id: "dashboard", label: "Dashboard", icon: Sliders },
          { id: "cart", label: "Cart & Items", icon: ShoppingCart, badge: summary?.distinctItemsCount },
          { id: "taxes", label: "Stores & Taxes", icon: Store },
          { id: "receipts", label: "Receipt Studio", icon: Sparkles },
          { id: "lists", label: "Lists & Catalog", icon: ShoppingCart },
          { id: "history", label: "History & Stats", icon: Sliders },
          { id: "exports", label: "Export Center", icon: Sliders },
          { id: "terminal", label: "Python Terminal", icon: Terminal, highlight: true },
          { id: "settings", label: "Settings", icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundFX.playClick();
                setActiveTab(tab.id);
              }}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? tab.highlight
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : tab.highlight
                  ? "text-amber-400 hover:bg-slate-900 hover:text-amber-300"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive ? "bg-slate-950 text-cyan-400" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
