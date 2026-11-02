"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Printer,
  Copy,
  Download,
  Check,
  FileText,
  Sliders,
  Store,
  PieChart,
} from "lucide-react";
import { soundFX } from "@/lib/audio";

interface ReceiptsViewProps {
  summary: any;
  items: any[];
  currentStore: any;
  activeList: any;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({
  summary,
  items,
  currentStore,
  activeList,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<string>("standard");
  const [receiptWidth, setReceiptWidth] = useState<number>(44);
  const [receiptContent, setReceiptContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchReceipt = async (style: string, width: number) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style, width }),
      });
      const data = await res.json();
      if (data.ok) {
        setReceiptContent(data.content);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipt(selectedStyle, receiptWidth);
  }, [selectedStyle, receiptWidth, items, currentStore]);

  const handleCopy = () => {
    soundFX.playClick();
    navigator.clipboard.writeText(receiptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    soundFX.playClick();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>MJD Shopping Manager - Receipt</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              padding: 20px;
              white-space: pre;
              font-size: 13px;
              line-height: 1.3;
            }
          </style>
        </head>
        <body>${receiptContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownload = () => {
    soundFX.playClick();
    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mjd_receipt_${selectedStyle}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stylesList = [
    { id: "standard", label: "1. Standard Receipt", desc: "Clean itemized summary with tax breakdown", icon: FileText },
    { id: "store", label: "2. Store Branded", desc: "Official store header, register & return policy", icon: Store },
    { id: "detailed", label: "3. Detailed Audit", desc: "Categorized by department with unit prices", icon: Sliders },
    { id: "budget_summary", label: "4. Budget Summary", desc: "Spending allocation, visual bar & surplus", icon: PieChart },
    { id: "thermal_receipt", label: "5. Thermal Slip", desc: "Classic 38-col POS paper ticket with barcode", icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            Receipt Studio & Visualizer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Render and print your active cart into 5 distinct commercial receipt formats.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Copied!" : "Copy Text"}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Printer className="h-4 w-4 text-cyan-400" />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-md shadow-cyan-500/20"
          >
            <Download className="h-4 w-4" />
            <span>Download .txt</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Col: Style Selector & Width Customizer */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Select Receipt Style</h3>
            <div className="space-y-2">
              {stylesList.map((st) => {
                const Icon = st.icon;
                const isSelected = selectedStyle === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      soundFX.playClick();
                      setSelectedStyle(st.id);
                    }}
                    className={`w-full text-left rounded-xl border p-3 transition-all ${
                      isSelected
                        ? "border-cyan-500 bg-cyan-950/40 shadow-md shadow-cyan-500/10"
                        : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isSelected ? "text-cyan-400" : "text-slate-400"}`} />
                      <div>
                        <p className={`text-xs font-bold ${isSelected ? "text-cyan-300" : "text-white"}`}>
                          {st.label}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{st.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Width Adjuster */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white">Receipt Width:</span>
              <span className="font-bold text-cyan-400">{receiptWidth} Columns</span>
            </div>
            <input
              type="range"
              min="32"
              max="60"
              step="2"
              value={receiptWidth}
              onChange={(e) => setReceiptWidth(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>32 (Narrow Thermal)</span>
              <span>44 (Standard)</span>
              <span>60 (Wide)</span>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Receipt Preview Canvas */}
        <div className="lg:col-span-2 flex justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-slate-400 ml-2">Receipt Output • {selectedStyle}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Pueblo CO Taxes</span>
            </div>

            {/* Monospace Paper Container */}
            <div className="relative rounded-xl border border-slate-800 bg-slate-900/90 p-5 font-mono text-xs text-slate-200 overflow-x-auto">
              <pre className="leading-relaxed whitespace-pre font-mono select-all">
                {receiptContent || "Generating receipt..."}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
