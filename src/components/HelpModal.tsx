"use client";

import React from "react";
import { HelpCircle, Command, X, Sparkles, Terminal, Receipt, CheckCircle2 } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "A", desc: "Quickly open Add Item dialog" },
    { key: "E", desc: "Edit currently selected cart item" },
    { key: "D", desc: "Duplicate highlighted item" },
    { key: "B", desc: "Adjust target shopping budget" },
    { key: "R", desc: "Open Receipt Studio (5 Styles)" },
    { key: "S", desc: "Open Store Profiles & Itemized Tax manager" },
    { key: "X", desc: "Export Cart (TXT / CSV / JSON / MD)" },
    { key: "H", desc: "View Trip History & analytics" },
    { key: "T", desc: "Switch Visual Themes" },
    { key: "?", desc: "Open this Help & shortcuts modal" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-black text-white">MJD Shopping Manager - Guide & Shortcuts</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shortcuts table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Keyboard Shortcuts</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {shortcuts.map((sc) => (
              <div key={sc.key} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-xs">
                <span className="text-slate-300">{sc.desc}</span>
                <kbd className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-bold text-cyan-300">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Pueblo Tax Explanation */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-2 text-xs">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <Receipt className="h-4 w-4 text-cyan-400" />
            Sales Tax Rules (Pueblo, Colorado)
          </h4>
          <p className="text-slate-400">
            MJD Shopping Manager calculates itemized municipal and state taxes with exact precision:
          </p>
          <ul className="list-disc list-inside text-slate-300 space-y-1 pl-1">
            <li><strong>Colorado State Tax:</strong> 2.90%</li>
            <li><strong>Pueblo County Tax:</strong> 1.00%</li>
            <li><strong>City of Pueblo Tax:</strong> 3.70%</li>
            <li><strong>Combined Standard Rate:</strong> 7.60%</li>
          </ul>
          <p className="text-[11px] text-slate-500 italic pt-1">
            * Only active taxes greater than $0.00 are visible on receipts and invoices.
          </p>
        </div>

        {/* Python Terminal Info */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-2 text-xs">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <Terminal className="h-4 w-4 text-amber-400" />
            Dual Terminal & GUI Operation
          </h4>
          <p className="text-slate-400">
            This application can be operated either through this modern web interface or directly via terminal:
          </p>
          <div className="rounded-lg bg-slate-900 p-2 font-mono text-cyan-300 text-[11px]">
            python runSystem.py &nbsp;# or: python main.py --demo
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="rounded-xl bg-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
