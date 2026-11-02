"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  Command,
  FileCode,
} from "lucide-react";
import { soundFX } from "@/lib/audio";

interface TerminalHistoryItem {
  command: string;
  output: string;
  error?: string;
  exitCode?: number;
  timestamp: string;
}

export const TerminalView: React.FC = () => {
  const [commandInput, setCommandInput] = useState<string>("python main.py --demo");
  const [history, setHistory] = useState<TerminalHistoryItem[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const presets = [
    { label: "Run Demo Cart", cmd: "python main.py --demo" },
    { label: "Pueblo CO Tax Calc ($100)", cmd: "python main.py --tax-calc 100" },
    { label: "Thermal Receipt", cmd: "python main.py --receipt thermal" },
    { label: "Store Branded Receipt", cmd: "python main.py --receipt store" },
    { label: "Detailed Audit", cmd: "python main.py --receipt detailed" },
    { label: "Budget Summary", cmd: "python main.py --receipt budget" },
    { label: "JSON Summary", cmd: "python main.py --summary" },
    { label: "Lifetime Stats", cmd: "python main.py --stats" },
    { label: "CLI Help", cmd: "python main.py --help" },
  ];

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim() || isRunning) return;
    setIsRunning(true);
    soundFX.playClick();

    try {
      const res = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd.trim() }),
      });
      const data = await res.json();

      const newItem: TerminalHistoryItem = {
        command: cmd.trim(),
        output: data.stdout || "",
        error: data.stderr || "",
        exitCode: data.exitCode || 0,
        timestamp: new Date().toLocaleTimeString(),
      };

      setHistory((prev) => [...prev, newItem]);
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        {
          command: cmd.trim(),
          output: "",
          error: err.message || "Failed to execute command",
          exitCode: 1,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Run demo on initial mount if history empty
    if (history.length === 0) {
      executeCommand("python main.py --demo");
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleCopyAll = () => {
    const fullText = history.map((h) => `$ ${h.command}\n${h.output}\n${h.error ? `ERROR: ${h.error}\n` : ""}`).join("\n");
    soundFX.playClick();
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <TerminalIcon className="h-5 w-5 text-amber-400" />
              Live Python Terminal & CLI Console
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Execute real Python commands (`main.py`, `runSystem.py`, tax calculations) against the backend Python runtime.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Copied" : "Copy Output"}</span>
          </button>
          <button
            onClick={() => {
              soundFX.playClick();
              setHistory([]);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Preset Command Buttons Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-2.5">
          Quick Command Presets
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.cmd}
              onClick={() => {
                setCommandInput(p.cmd);
                executeCommand(p.cmd);
              }}
              disabled={isRunning}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-cyan-300 hover:border-cyan-500/50 hover:bg-slate-900 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <FileCode className="h-3 w-3 text-cyan-400" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Screen Container */}
      <div className="rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-2xl font-mono text-xs text-slate-200">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-rose-500" />
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400 ml-2 font-mono">bash & Python 3.11/3.12 Sandboxed Session</span>
          </div>
          <span className="text-[11px] text-cyan-400 font-mono">MJD Terminal v2.4.0</span>
        </div>

        {/* History Log */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
          {history.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <span className="text-emerald-400">user@mjd-shopping:~$</span>
                <span>{item.command}</span>
                <span className="text-[10px] text-slate-600 ml-auto font-normal">{item.timestamp}</span>
              </div>
              {item.output && (
                <div className="rounded-lg bg-slate-900/90 p-3.5 text-slate-200 whitespace-pre overflow-x-auto leading-relaxed border border-slate-800/80">
                  {item.output}
                </div>
              )}
              {item.error && (
                <div className="rounded-lg bg-rose-950/40 p-3 text-rose-300 whitespace-pre overflow-x-auto border border-rose-800/50">
                  {item.error}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Live Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeCommand(commandInput);
          }}
          className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2"
        >
          <span className="text-emerald-400 font-bold">user@mjd:~$</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type a command (e.g. python main.py --receipt thermal)..."
            className="flex-1 bg-transparent text-white placeholder-slate-600 focus:outline-none text-xs font-mono"
            disabled={isRunning}
          />
          <button
            type="submit"
            disabled={isRunning || !commandInput.trim()}
            className="flex items-center gap-1 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{isRunning ? "Running..." : "Run"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
