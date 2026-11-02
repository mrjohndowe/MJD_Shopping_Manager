"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { DashboardView } from "@/components/DashboardView";
import { CartView } from "@/components/CartView";
import { TaxesStoresView } from "@/components/TaxesStoresView";
import { ReceiptsView } from "@/components/ReceiptsView";
import { ListsCatalogView } from "@/components/ListsCatalogView";
import { HistoryStatsView } from "@/components/HistoryStatsView";
import { ExportsView } from "@/components/ExportsView";
import { TerminalView } from "@/components/TerminalView";
import { SettingsView } from "@/components/SettingsView";
import { SetupWizardModal } from "@/components/SetupWizardModal";
import { ItemModal } from "@/components/ItemModal";
import { HelpModal } from "@/components/HelpModal";
import { soundFX } from "@/lib/audio";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [cartData, setCartData] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [theme, setTheme] = useState<string>("dark");
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  // Modals
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<any | null>(null);

  // Fetch active cart and totals
  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (data.ok) {
        setCartData(data);
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    }
  }, []);

  // Fetch stores
  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch("/api/stores");
      const data = await res.json();
      if (data.ok) {
        setStores(data.stores);
      }
    } catch (err) {
      console.error("Failed to load stores:", err);
    }
  }, []);

  // Fetch lists
  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch("/api/lists");
      const data = await res.json();
      if (data.ok) {
        setLists(data.lists);
      }
    } catch (err) {
      console.error("Failed to load lists:", err);
    }
  }, []);

  // Fetch recent history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (data.ok) {
        setRecentTrips(data.trips);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }, []);

  // Check setup on initial mount
  useEffect(() => {
    const initSetup = async () => {
      try {
        const res = await fetch("/api/setup");
        const data = await res.json();
        if (data.ok && data.profile) {
          if (!data.profile.setupCompleted) {
            setIsSetupWizardOpen(true);
          }
          if (data.profile.preferredTheme) {
            setTheme(data.profile.preferredTheme);
          }
        }
      } catch (err) {
        console.error("Setup check error:", err);
      }
    };

    initSetup();
    fetchCart();
    fetchStores();
    fetchLists();
    fetchHistory();
  }, [fetchCart, fetchStores, fetchLists, fetchHistory]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in form inputs
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) {
        return;
      }

      const key = e.key.toUpperCase();
      if (key === "?") {
        e.preventDefault();
        soundFX.playClick();
        setIsHelpModalOpen(true);
      } else if (key === "A" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        soundFX.playClick();
        setSelectedItemForEdit(null);
        setIsItemModalOpen(true);
      } else if (key === "R" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        soundFX.playClick();
        setActiveTab("receipts");
      } else if (key === "S" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        soundFX.playClick();
        setActiveTab("taxes");
      } else if (key === "X" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        soundFX.playClick();
        setActiveTab("exports");
      } else if (key === "H" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        soundFX.playClick();
        setActiveTab("history");
      } else if (key === "T" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        soundFX.playClick();
        setActiveTab("terminal");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Cart Handlers
  const handleAddItem = async (itemData: any) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditItem = async (itemData: any) => {
    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      const res = await fetch(`/api/cart?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateItem = async (id: number) => {
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", id }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_favorite", id }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTaxable = async (id: number) => {
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_taxable", id }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveItem = async (id: number, direction: "up" | "down") => {
    soundFX.playClick();
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move", id, direction }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickUpdateQty = async (id: number, newQty: number) => {
    soundFX.playClick();
    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantity: String(newQty) }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearCart = async () => {
    try {
      const res = await fetch("/api/cart?clear=true", { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBudget = async (newBudget: string) => {
    if (!cartData?.list?.id) return;
    try {
      const res = await fetch("/api/lists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cartData.list.id, budget: newBudget }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
        await fetchLists();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectStore = async (storeId: number) => {
    if (!cartData?.list?.id) return;
    try {
      const res = await fetch("/api/lists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cartData.list.id, storeId }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefaultStore = async (storeId: number) => {
    try {
      const res = await fetch("/api/stores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: storeId }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchStores();
        await fetchCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStore = async (storeData: any) => {
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeData),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchStores();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStore = async (storeData: any) => {
    try {
      const res = await fetch("/api/stores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeData),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchStores();
        await fetchCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStore = async (storeId: number) => {
    try {
      const res = await fetch(`/api/stores?id=${storeId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        await fetchStores();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = async () => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearAfterCheckout: true }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
        await fetchHistory();
        setActiveTab("history");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchList = async (listId: number) => {
    try {
      const res = await fetch("/api/lists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch", id: listId }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
        await fetchLists();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateList = async (listData: any) => {
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listData),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
        await fetchLists();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateList = async (listId: number) => {
    try {
      const res = await fetch("/api/lists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", id: listId }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
        await fetchLists();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteList = async (listId: number) => {
    try {
      const res = await fetch(`/api/lists?id=${listId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
        await fetchLists();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteSetup = async (setupData: any) => {
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setupData),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchCart();
        await fetchStores();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Theme styling mapping
  const themeContainerClasses: Record<string, string> = {
    dark: "bg-slate-950 text-slate-100",
    cyberpunk: "bg-zinc-950 text-amber-100",
    emerald: "bg-emerald-950 text-emerald-100",
    midnight: "bg-black text-white",
    nord: "bg-[#2e3440] text-slate-100",
  };

  const currentThemeClass = themeContainerClasses[theme] || themeContainerClasses.dark;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${currentThemeClass}`}>
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        summary={cartData?.summary}
        stores={stores}
        currentStore={cartData?.store}
        onSelectStore={handleSelectStore}
        theme={theme}
        onSelectTheme={setTheme}
        isSoundMuted={isSoundMuted}
        setIsSoundMuted={setIsSoundMuted}
        onOpenSetup={() => setIsSetupWizardOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
      />

      {/* Main App Content View Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === "dashboard" && (
          <DashboardView
            summary={cartData?.summary}
            items={cartData?.items || []}
            currentStore={cartData?.store}
            activeList={cartData?.list}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onQuickUpdateQty={handleQuickUpdateQty}
            onNavigateTab={setActiveTab}
            onCheckout={handleCheckout}
            recentTrips={recentTrips}
          />
        )}

        {activeTab === "cart" && (
          <CartView
            items={cartData?.items || []}
            summary={cartData?.summary}
            currentStore={cartData?.store}
            activeList={cartData?.list}
            onAddItemClick={() => {
              setSelectedItemForEdit(null);
              setIsItemModalOpen(true);
            }}
            onEditItemClick={(item) => {
              setSelectedItemForEdit(item);
              setIsItemModalOpen(true);
            }}
            onDuplicateItem={handleDuplicateItem}
            onDeleteItem={handleDeleteItem}
            onToggleFavorite={handleToggleFavorite}
            onToggleTaxable={handleToggleTaxable}
            onMoveItem={handleMoveItem}
            onQuickUpdateQty={handleQuickUpdateQty}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
            onUpdateBudget={handleUpdateBudget}
          />
        )}

        {activeTab === "taxes" && (
          <TaxesStoresView
            stores={stores}
            currentStore={cartData?.store}
            onSelectStore={handleSelectStore}
            onSetDefaultStore={handleSetDefaultStore}
            onAddStore={handleAddStore}
            onUpdateStore={handleUpdateStore}
            onDeleteStore={handleDeleteStore}
          />
        )}

        {activeTab === "receipts" && (
          <ReceiptsView
            summary={cartData?.summary}
            items={cartData?.items || []}
            currentStore={cartData?.store}
            activeList={cartData?.list}
          />
        )}

        {activeTab === "lists" && (
          <ListsCatalogView
            lists={lists}
            activeList={cartData?.list}
            stores={stores}
            onSwitchList={handleSwitchList}
            onCreateList={handleCreateList}
            onDuplicateList={handleDuplicateList}
            onDeleteList={handleDeleteList}
            onRefreshCart={fetchCart}
          />
        )}

        {activeTab === "history" && (
          <HistoryStatsView
            onRefreshCart={fetchCart}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "exports" && (
          <ExportsView
            activeList={cartData?.list}
            currentStore={cartData?.store}
            items={cartData?.items || []}
          />
        )}

        {activeTab === "terminal" && <TerminalView />}

        {activeTab === "settings" && (
          <SettingsView
            currentTheme={theme}
            onSelectTheme={setTheme}
          />
        )}
      </main>

      {/* Modals */}
      <SetupWizardModal
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
        stores={stores}
        onCompleteSetup={handleCompleteSetup}
      />

      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setSelectedItemForEdit(null);
        }}
        item={selectedItemForEdit}
        onSave={selectedItemForEdit ? handleEditItem : handleAddItem}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
