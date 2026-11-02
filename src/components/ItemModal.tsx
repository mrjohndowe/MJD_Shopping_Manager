"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Tag, Percent, DollarSign, Star, X } from "lucide-react";
import { soundFX } from "@/lib/audio";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any | null; // null for add, object for edit
  onSave: (itemData: any) => Promise<void>;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Grocery");
  const [department, setDepartment] = useState("Grocery");
  const [quantity, setQuantity] = useState("1.00");
  const [regularPrice, setRegularPrice] = useState("0.00");
  const [saleDiscount, setSaleDiscount] = useState("0.00");
  const [couponDiscount, setCouponDiscount] = useState("0.00");
  const [isTaxable, setIsTaxable] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setCategory(item.category || "Grocery");
      setDepartment(item.department || "Grocery");
      setQuantity(String(item.quantity || "1.00"));
      setRegularPrice(String(item.unitPrice || item.regularPrice || "0.00"));
      setSaleDiscount(String(item.saleDiscount || "0.00"));
      setCouponDiscount(String(item.couponDiscount || "0.00"));
      setIsTaxable(item.isTaxable !== undefined ? Boolean(item.isTaxable) : true);
      setIsFavorite(Boolean(item.isFavorite));
      setNotes(item.notes || "");
    } else {
      setName("");
      setCategory("Grocery");
      setDepartment("Grocery");
      setQuantity("1.00");
      setRegularPrice("0.00");
      setSaleDiscount("0.00");
      setCouponDiscount("0.00");
      setIsTaxable(true);
      setIsFavorite(false);
      setNotes("");
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const regNum = parseFloat(regularPrice) || 0;
  const saleNum = parseFloat(saleDiscount) || 0;
  const coupNum = parseFloat(couponDiscount) || 0;
  const qtyNum = parseFloat(quantity) || 1;
  const netUnit = Math.max(0, regNum - saleNum - coupNum);
  const totalItemSubtotal = netUnit * qtyNum;
  const totalItemSavings = (saleNum + coupNum) * qtyNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    soundFX.playAdd();
    try {
      await onSave({
        id: item?.id,
        name: name.trim(),
        category,
        department,
        quantity: quantity || "1.00",
        regularPrice: regularPrice || "0.00",
        unitPrice: regularPrice || "0.00",
        saleDiscount: saleDiscount || "0.00",
        couponDiscount: couponDiscount || "0.00",
        isTaxable,
        isFavorite,
        notes,
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
      <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            {item ? <Edit2 className="h-4 w-4 text-cyan-400" /> : <Plus className="h-4 w-4 text-cyan-400" />}
            {item ? "Edit Shopping Item" : "Add Item to Cart"}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-300">Item Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Organic Honeycrisp Apples"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="Grocery">Grocery</option>
                <option value="Produce">Produce</option>
                <option value="Dairy & Eggs">Dairy & Eggs</option>
                <option value="Meat & Seafood">Meat & Seafood</option>
                <option value="Bakery">Bakery</option>
                <option value="Frozen Foods">Frozen Foods</option>
                <option value="Beverages">Beverages</option>
                <option value="Snacks & Sweets">Snacks & Sweets</option>
                <option value="Household Essentials">Household Essentials</option>
                <option value="Health & Beauty">Health & Beauty</option>
                <option value="Electronics">Electronics</option>
                <option value="Apparel">Apparel</option>
                <option value="Pet Supplies">Pet Supplies</option>
                <option value="Lawn & Garden">Lawn & Garden</option>
                <option value="Automotive">Automotive</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300">Quantity</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-bold"
              />
            </div>
          </div>

          {/* Pricing & Discounts Grid */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
            <p className="text-xs font-bold text-white">Prices & Promotional Savings</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Reg Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Sale Disc ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={saleDiscount}
                  onChange={(e) => setSaleDiscount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-emerald-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Coupon Disc ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={couponDiscount}
                  onChange={(e) => setCouponDiscount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-emerald-400"
                />
              </div>
            </div>

            {/* Net item summary preview */}
            <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs">
              <span className="text-slate-400">
                Net Unit: <strong className="text-slate-200">${netUnit.toFixed(2)}</strong> • Savings: <strong className="text-emerald-400">${totalItemSavings.toFixed(2)}</strong>
              </span>
              <span className="text-sm font-black text-cyan-400">Subtotal: ${totalItemSubtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isTaxable}
                onChange={(e) => setIsTaxable(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
              />
              <span>Subject to Sales Tax (Pueblo CO 7.6%)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-400 focus:ring-amber-400"
              />
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                Favorite
              </span>
            </label>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300">Notes / Aisle / Brand (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Aisle 4, Large Organic box"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl bg-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              {item ? "Save Changes" : "Add to Cart"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
