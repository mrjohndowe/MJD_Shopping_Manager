"use client";

import React, { useState } from "react";
import {
  Sparkles,
  MapPin,
  Percent,
  DollarSign,
  CheckCircle2,
  Store,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import confetti from "canvas-confetti";
import { soundFX } from "@/lib/audio";

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: any[];
  onCompleteSetup: (setupData: any) => Promise<void>;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({
  isOpen,
  onClose,
  stores,
  onCompleteSetup,
}) => {
  const [step, setStep] = useState<number>(1);
  const [userName, setUserName] = useState("Shopper");
  const [city, setCity] = useState("Pueblo");
  const [state, setState] = useState("Colorado");
  const [zip, setZip] = useState("81003");
  const [street, setStreet] = useState("100 Main St");
  const [stateTaxPct, setStateTaxPct] = useState("2.90");
  const [countyTaxPct, setCountyTaxPct] = useState("1.00");
  const [cityTaxPct, setCityTaxPct] = useState("3.70");
  const [defaultStoreId, setDefaultStoreId] = useState<number>(stores[0]?.id || 1);
  const [defaultBudget, setDefaultBudget] = useState("150.00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const totalRatePct = (
    parseFloat(stateTaxPct || "0") +
    parseFloat(countyTaxPct || "0") +
    parseFloat(cityTaxPct || "0")
  ).toFixed(2);

  const handleFinish = async () => {
    setIsSubmitting(true);
    soundFX.playSuccess();
    try {
      await onCompleteSetup({
        userName,
        city,
        state,
        zip,
        street,
        stateTaxRate: (parseFloat(stateTaxPct) / 100).toFixed(4),
        countyTaxRate: (parseFloat(countyTaxPct) / 100).toFixed(4),
        cityTaxRate: (parseFloat(cityTaxPct) / 100).toFixed(4),
        defaultStoreId,
        defaultBudget,
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-6">
        {/* Wizard Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">First-Time Setup System</h3>
              <p className="text-xs text-slate-400">Step {step} of 3 • MJD Shopping Manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-400 hover:text-white"
          >
            Skip
          </button>
        </div>

        {/* Step 1: User & Location */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">1. Location & Address</span>
              <h4 className="text-sm font-bold text-white mt-1">Where do you do your shopping?</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Defaults are pre-configured for Pueblo, Colorado.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300">Your Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-slate-300">Street Address</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">ZIP</label>
                  <input
                    type="text"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Sales Tax Rates */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">2. Regional Tax Rates</span>
              <h4 className="text-sm font-bold text-white mt-1">Confirm Jurisdictional Sales Taxes</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Pueblo, CO itemized taxes: Colorado State (2.90%), Pueblo County (1.00%), City of Pueblo (3.70%).
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400">CO State (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stateTaxPct}
                    onChange={(e) => setStateTaxPct(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Pueblo Co (%)</label>
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
              </div>

              <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Combined Regional Tax:</span>
                <span className="font-bold text-cyan-400 text-sm">{totalRatePct}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Default Store & Budget */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">3. Store & Budget</span>
              <h4 className="text-sm font-bold text-white mt-1">Choose Default Shopping Store & Target Budget</h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300">Default Store</label>
                <select
                  value={defaultStoreId}
                  onChange={(e) => setDefaultStoreId(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city}, {s.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300">Default Target Shopping Budget ($)</label>
                <input
                  type="number"
                  step="1"
                  value={defaultBudget}
                  onChange={(e) => setDefaultBudget(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => {
                soundFX.playClick();
                setStep(step + 1);
              }}
              className="flex items-center gap-1 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
            >
              <span>Continue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2 text-xs font-black text-slate-950 hover:from-cyan-400 hover:to-emerald-400"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? "Finishing..." : "Complete Setup"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
