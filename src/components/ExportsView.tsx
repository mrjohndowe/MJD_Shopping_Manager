"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Lock,
  FileText,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  Sparkles,
  Eye,
  Key,
  Copy,
  Check,
} from "lucide-react";
import { soundFX } from "@/lib/audio";

interface ExportsViewProps {
  activeList: any;
  currentStore: any;
  items: any[];
}

export const ExportsView: React.FC<ExportsViewProps> = ({
  activeList,
  currentStore,
  items,
}) => {
  const [format, setFormat] = useState<string>("txt");
  const [encryptionKey, setEncryptionKey] = useState<string>("");
  const [isReadOnly, setIsReadOnly] = useState<boolean>(true);
  const [exportData, setExportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const generateExport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          encryptionKey: encryptionKey.trim() || undefined,
          isReadOnly,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setExportData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateExport();
  }, [format, encryptionKey, isReadOnly, items]);

  const handleDownload = () => {
    if (!exportData) return;
    soundFX.playClick();
    const blob = new Blob([exportData.content], { type: exportData.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportData.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!exportData) return;
    soundFX.playClick();
    navigator.clipboard.writeText(exportData.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatOptions = [
    { id: "txt", label: "Text Slip (.txt)", desc: "Clean human-readable formatted summary", icon: FileText },
    { id: "csv", label: "Spreadsheet (.csv)", desc: "Excel & Sheets compatible tabular rows", icon: FileSpreadsheet },
    { id: "json", label: "Data Object (.json)", desc: "Full JSON object with item metadata", icon: FileCode },
    { id: "md", label: "Markdown Document (.md)", desc: "Formatted markdown table for notes/docs", icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Download className="h-5 w-5 text-cyan-400" />
            Export & Security Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Export shopping cart manifests and reports in multiple formats with optional encryption protection.
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={!exportData}
          className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-md shadow-cyan-500/20 shrink-0 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span>Download Export File</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Col: Export Config Options */}
        <div className="space-y-4">
          {/* Format Selector */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Target Format</h3>
            <div className="space-y-2">
              {formatOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = format === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      soundFX.playClick();
                      setFormat(opt.id);
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
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Security & Encryption Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Security & Locking Options
            </h3>

            {/* Read-Only Lock */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isReadOnly}
                onChange={(e) => setIsReadOnly(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
              />
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-cyan-400" />
                  Read-Only File Attribute
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Marks export manifest as tamper-resistant and read-only.
                </p>
              </div>
            </label>

            {/* Encryption Key */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-amber-400" />
                Password Encryption Key (Optional)
              </label>
              <input
                type="password"
                placeholder="Leave blank for unencrypted export"
                value={encryptionKey}
                onChange={(e) => setEncryptionKey(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />
              {encryptionKey && (
                <p className="text-[10px] text-amber-300">
                  🔒 File will be encrypted with key and saved as .enc extension.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Live Output Preview */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-cyan-400" />
              Export Payload Preview ({exportData?.filename || "file"})
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy Content"}</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px]">
            <pre className="whitespace-pre leading-relaxed font-mono">
              {exportData ? exportData.content : "Generating export preview..."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
