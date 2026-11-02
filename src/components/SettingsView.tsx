"use client";

import React, { useState, useEffect } from "react";
import {
  Palette,
  Database,
  DollarSign,
  Save,
  Check,
  Shield,
  Sliders,
  Sparkles,
} from "lucide-react";
import { soundFX } from "@/lib/audio";

interface SettingsViewProps {
  currentTheme: string;
  onSelectTheme: (themeId: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentTheme,
  onSelectTheme,
}) => {
  const [theme, setTheme] = useState(currentTheme || "dark");
  const [currency, setCurrency] = useState("USD");
  const [receiptWidth, setReceiptWidth] = useState(44);
  const [defaultBudget, setDefaultBudget] = useState("150.00");
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [autosaveInterval, setAutosaveInterval] = useState(30);

  // Database settings
  const [dbBackend, setDbBackend] = useState("both");
  const [sqlitePath, setSqlitePath] = useState("data/records.db");
  const [mysqlHost, setMysqlHost] = useState("127.0.0.1");
  const [mysqlPort, setMysqlPort] = useState(3306);
  const [mysqlUser, setMysqlUser] = useState("root");
  const [mysqlTable, setMysqlTable] = useState("shopping_trips");

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.ok && data.settings) {
        const s = data.settings;
        setTheme(s.theme || "dark");
        setCurrency(s.currency || "USD");
        setReceiptWidth(Number(s.receiptWidth || 44));
        setDefaultBudget(s.defaultBudget || "150.00");
        setAutosaveEnabled(s.autosaveEnabled !== false);
        setAutosaveInterval(Number(s.autosaveInterval || 30));
        setDbBackend(s.dbBackend || "both");
        setSqlitePath(s.sqlitePath || "data/records.db");
        setMysqlHost(s.mysqlHost || "127.0.0.1");
        setMysqlPort(Number(s.mysqlPort || 3306));
        setMysqlUser(s.mysqlUser || "root");
        setMysqlTable(s.mysqlTable || "shopping_trips");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    soundFX.playSuccess();
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          currency,
          receiptWidth,
          defaultBudget,
          autosaveEnabled,
          autosaveInterval,
          dbBackend,
          sqlitePath,
          mysqlHost,
          mysqlPort,
          mysqlUser,
          mysqlTable,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        onSelectTheme(theme);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const themeOptions = [
    { id: "dark", name: "MJD Dark Matrix (Default)", bg: "bg-slate-900 border-cyan-500/40" },
    { id: "cyberpunk", name: "Cyberpunk Amber Glow", bg: "bg-zinc-950 border-amber-500/40" },
    { id: "emerald", name: "Emerald Forest", bg: "bg-emerald-950 border-emerald-500/40" },
    { id: "midnight", name: "Midnight OLED Pure", bg: "bg-black border-blue-500/40" },
    { id: "nord", name: "Nord Frost Arctic", bg: "bg-slate-800 border-sky-400/40" },
  ];

  return (
    <form onSubmit={handleSaveSettings} className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Sliders className="h-5 w-5 text-cyan-400" />
            Application Preferences & Database
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure visual themes, currency symbols, autosave timers, and dual database backends (SQLite / PostgreSQL / MySQL).
          </p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-md shadow-cyan-500/20 shrink-0"
        >
          {savedSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{savedSuccess ? "Settings Saved!" : isSaving ? "Saving..." : "Save Preferences"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Col: Themes & Display */}
        <div className="space-y-6">
          {/* Themes Selector */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="h-4 w-4 text-cyan-400" />
              Theme Customization (Dark Default)
            </h3>
            <div className="space-y-2.5">
              {themeOptions.map((t) => (
                <label
                  key={t.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    theme === t.id
                      ? "border-cyan-500 bg-cyan-950/40 shadow-md shadow-cyan-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="theme"
                      value={t.id}
                      checked={theme === t.id}
                      onChange={() => {
                        soundFX.playClick();
                        setTheme(t.id);
                        onSelectTheme(t.id);
                      }}
                      className="text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-xs font-bold text-white">{t.name}</span>
                  </div>
                  <div className={`h-4 w-12 rounded-full ${t.bg}`} />
                </label>
              ))}
            </div>
          </div>

          {/* General App Config */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              General Defaults & Budget
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300">Default Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="USD">USD ($ United States)</option>
                  <option value="EUR">EUR (€ Europe)</option>
                  <option value="GBP">GBP (£ Great Britain)</option>
                  <option value="CAD">CAD ($ Canada)</option>
                  <option value="AUD">AUD ($ Australia)</option>
                  <option value="JPY">JPY (¥ Japan)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300">Default Starting Budget ($)</label>
                <input
                  type="number"
                  step="1"
                  value={defaultBudget}
                  onChange={(e) => setDefaultBudget(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Autosave */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white">Enable Real-Time Autosave</span>
                  <p className="text-[11px] text-slate-400">Persists cart state to `data/autosave.json`</p>
                </div>
                <input
                  type="checkbox"
                  checked={autosaveEnabled}
                  onChange={(e) => setAutosaveEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Database & Storage */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400" />
              Database Engine Configuration
            </h3>
            <p className="text-xs text-slate-400">
              MJD Shopping Manager dual-syncs to local SQLite database files and high-performance relational PostgreSQL/MySQL.
            </p>

            {/* Backend mode */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300">Active Storage Backend</label>
              <select
                value={dbBackend}
                onChange={(e) => setDbBackend(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="both">Both (PostgreSQL / SQLite Dual Sync)</option>
                <option value="sqlite">SQLite Only (Local records.db)</option>
                <option value="mysql">PostgreSQL / MySQL Primary</option>
              </select>
            </div>

            {/* SQLite File path */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300">SQLite Database File Path</label>
              <input
                type="text"
                value={sqlitePath}
                onChange={(e) => setSqlitePath(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* MySQL / Postgres connection details */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
              <span className="text-xs font-bold text-white block">PostgreSQL / MySQL Metadata</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400">Host</label>
                  <input
                    type="text"
                    value={mysqlHost}
                    onChange={(e) => setMysqlHost(e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Port</label>
                  <input
                    type="number"
                    value={mysqlPort}
                    onChange={(e) => setMysqlPort(Number(e.target.value))}
                    className="mt-0.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">User</label>
                  <input
                    type="text"
                    value={mysqlUser}
                    onChange={(e) => setMysqlUser(e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Table Name</label>
                  <input
                    type="text"
                    value={mysqlTable}
                    onChange={(e) => setMysqlTable(e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Folder Paths */}
            <div className="text-[11px] text-slate-400 space-y-1 pt-2">
              <p>• Data Directory: <code className="text-cyan-400">data/</code></p>
              <p>• Exports Directory: <code className="text-cyan-400">exports_output/</code></p>
              <p>• History Directory: <code className="text-cyan-400">history_output/</code></p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
