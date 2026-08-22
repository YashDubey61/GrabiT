"use client";

import { useState, useMemo, useEffect } from "react";
import type { VendorMenuItem } from "@/lib/mock/vendor";
import { saveOfflineManualOrder, type OfflineManualOrder } from "@/lib/offline/manual_order_db";
import { syncPendingManualCashOrders } from "@/lib/offline/manual_order_sync";

interface ManualCashOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  canteenId: string;
  menuItems: VendorMenuItem[];
  onOrderCreated: (orderNumber?: string) => void;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export function ManualCashOrderModal({
  isOpen,
  onClose,
  canteenId,
  menuItems,
  onOrderCreated,
}: ManualCashOrderModalProps) {
  const [step, setStep] = useState<"select" | "review" | "success">("select");
  const [customerType, setCustomerType] = useState<"walkin" | "student">("walkin");
  const [customerName, setCustomerName] = useState("");
  const [studentIdentifier, setStudentIdentifier] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [createdOrderRef, setCreatedOrderRef] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("select");
      setCart([]);
      setErrorMsg(null);
      setCreatedOrderRef(null);
    }
  }, [isOpen]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ["ALL", ...Array.from(set)];
  }, [menuItems]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() || item.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const handleAddToCart = (item: VendorMenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      } else {
        return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
      }
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.id === itemId) {
            const nextQty = c.quantity + delta;
            return nextQty > 0 ? { ...c, quantity: nextQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== itemId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const itemCountLabel =
    cart.length === 0
      ? "0 Items"
      : cart.length === totalQuantity
        ? `${totalQuantity} Item${totalQuantity === 1 ? "" : "s"}`
        : `${cart.length} Product${cart.length === 1 ? "" : "s"} · ${totalQuantity} Items`;

  const handleProceedToReview = () => {
    if (cart.length === 0) {
      setErrorMsg("Please add at least one item to the manual cash order.");
      return;
    }
    setErrorMsg(null);
    setStep("review");
  };

  const handlePlaceCashOrder = async () => {
    if (cart.length === 0) return;

    setSubmitting(true);
    setErrorMsg(null);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNum = `GRABIT-M-${randomSuffix}`;
    const clientOrderId = `manual_client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const finalCustomerName = customerType === "walkin" ? "Walk-in Customer" : customerName.trim() || "Walk-in Customer";

    const offlinePayload: OfflineManualOrder = {
      clientOrderId,
      canteenId,
      customerName: finalCustomerName,
      studentIdentifier: customerType === "student" ? studentIdentifier.trim() || undefined : undefined,
      customerPhone: customerType === "student" ? customerPhone.trim() || undefined : undefined,
      items: cart.map((c) => ({
        menuItemId: c.id,
        name: c.name,
        price: c.price,
        quantity: c.quantity,
      })),
      totalAmount,
      paymentMethod: "CASH",
      orderType: "MANUAL_CASH_ORDER",
      createdAt: new Date().toISOString(),
      syncStatus: "LOCAL_PENDING",
      serverOrderNumber: `#${orderNum}`,
    };

    // If browser is genuinely offline, no network attempt is possible — queue
    // locally immediately.
    if (!navigator.onLine) {
      await saveOfflineManualOrder(offlinePayload);
      setSubmitting(false);
      setCreatedOrderRef(`#${orderNum} (Offline Sync Pending)`);
      setStep("success");
      onOrderCreated(`#${orderNum}`);
      return;
    }

    // Online: the order must be created on the server directly. Only a
    // genuine network failure (the fetch itself throwing) falls back to the
    // offline queue below — a server response, even an error one, means the
    // server was reachable, so that failure must be shown to the vendor
    // instead of being silently masked as "offline".
    try {
      const response = await fetch("/api/vendor/orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientOrderId,
          canteenId,
          customerName: finalCustomerName,
          studentIdentifier: customerType === "student" ? studentIdentifier.trim() : undefined,
          customerPhone: customerType === "student" ? customerPhone.trim() : undefined,
          items: cart.map((c) => ({
            menuItemId: c.id,
            name: c.name,
            price: c.price,
            quantity: c.quantity,
          })),
          paymentMethod: "CASH",
          orderType: "MANUAL_CASH_ORDER",
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        const finalNum = data.order?.orderNumber
          ? data.order.orderNumber.startsWith("#")
            ? data.order.orderNumber
            : `#${data.order.orderNumber}`
          : `#${orderNum}`;

        setCreatedOrderRef(finalNum);
        setStep("success");
        onOrderCreated(finalNum);
      } else {
        // Server reachable but rejected the order (validation/auth/schema
        // error, etc). Surface the real error and let the vendor retry —
        // never silently queue this as an offline order.
        setErrorMsg(data.error || "Unable to place order. Please try again.");
      }
    } catch (err) {
      // The fetch itself failed — genuine network/server unavailability.
      console.error("Manual cash order network error:", err);
      await saveOfflineManualOrder(offlinePayload);
      syncPendingManualCashOrders(canteenId);
      setCreatedOrderRef(`#${orderNum} (Offline Sync Pending)`);
      setStep("success");
      onOrderCreated(`#${orderNum}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-4 sm:p-5 bg-zinc-950">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[24px]">point_of_sale</span>
              <h2 className="font-display text-title font-bold text-foreground">
                {step === "select"
                  ? "Manual Cash Order"
                  : step === "review"
                  ? "Cash Order Review"
                  : "Order Placed Successfully"}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  isOnline
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                    : "bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse"
                }`}
              >
                {isOnline ? "Online Terminal" : "Offline Mode (Auto-Sync)"}
              </span>
            </div>
            <p className="text-caption text-muted mt-0.5">
              {step === "select"
                ? "Select items & customer details for direct counter cash sales"
                : step === "review"
                ? "Review items and total before placing cash order"
                : "Manual order created directly in active PREPARING status"}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:text-white">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mx-5 mt-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-rose-400">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: ITEM SELECTION & BUILD TICKET */}
        {step === "select" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 flex-1 overflow-hidden">
            {/* Menu Selection Panel */}
            <div className="md:col-span-7 p-4 sm:p-5 border-r border-zinc-800 flex flex-col gap-4 overflow-y-auto">
              {/* Customer Info Selection */}
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-3">
                <div className="text-caption font-bold text-zinc-400 uppercase tracking-wider">
                  Customer Information
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-200">
                    <input
                      type="radio"
                      name="custType"
                      checked={customerType === "walkin"}
                      onChange={() => setCustomerType("walkin")}
                      className="accent-primary"
                    />
                    <span>Walk-in Customer (Default)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-zinc-200">
                    <input
                      type="radio"
                      name="custType"
                      checked={customerType === "student"}
                      onChange={() => setCustomerType("student")}
                      className="accent-primary"
                    />
                    <span>Specify Student / Details</span>
                  </label>
                </div>

                {customerType === "student" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer Name (Optional)"
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={studentIdentifier}
                      onChange={(e) => setStudentIdentifier(e.target.value)}
                      placeholder="Student ID / Enrollment / Phone"
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>

              {/* Search & Category Bar */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search menu items..."
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-primary"
                />

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-lg font-semibold text-caption transition-colors shrink-0 ${
                        selectedCategory === cat
                          ? "bg-primary text-on-primary"
                          : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto max-h-[300px] pr-1">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-2 hover:border-zinc-700 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-body-sm font-bold text-zinc-100 truncate">{item.name}</div>
                      <div className="text-caption font-mono font-semibold text-primary">₹{item.price}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-soft text-on-primary text-caption font-bold rounded-lg shrink-0 transition-all active:scale-95"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart & Order Summary Side Panel */}
            <div className="md:col-span-5 bg-zinc-950 flex flex-col overflow-y-auto">
              {cart.length === 0 ? (
                // Compact empty state — no large empty cart section, doesn't
                // push the menu/product panel out of view on mobile.
                <div className="flex items-center gap-3 p-4 sm:p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500">
                    <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-body-sm font-bold text-zinc-200">Your order is empty</p>
                    <p className="text-caption text-zinc-500">Add items from the menu to create this cash order.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 pb-0 sm:p-5 sm:pb-0 space-y-4 flex-1 overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span className="text-caption font-extrabold uppercase text-zinc-400">Order Items</span>
                      <span className="text-caption font-mono text-primary font-bold">{itemCountLabel}</span>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-zinc-200 truncate">{item.name}</div>
                            <div className="text-caption font-mono text-zinc-400">₹{item.price} × {item.quantity}</div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, -1)}
                              aria-label={`Decrease quantity of ${item.name}`}
                              className="h-7 w-7 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center text-xs"
                            >
                              −
                            </button>
                            <span className="font-mono font-bold text-zinc-100 min-w-[16px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, 1)}
                              aria-label={`Increase quantity of ${item.name}`}
                              className="h-7 w-7 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>

                          <div className="font-mono font-bold text-primary min-w-[46px] text-right">
                            ₹{item.price * item.quantity}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            aria-label={`Remove ${item.name} from order`}
                            className="shrink-0 text-zinc-600 hover:text-rose-400 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-zinc-800/80 p-4 sm:p-5 space-y-1.5">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-caption text-zinc-400">
                        <span className="truncate">{item.name}</span>
                        <span className="font-mono shrink-0">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-body font-bold text-white border-t border-zinc-800/80 pt-2 mt-1.5">
                      <span>TOTAL</span>
                      <span className="font-mono text-title text-primary">₹{totalAmount}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Sticky action area — always visible regardless of cart state */}
              <div className="mt-auto border-t border-zinc-800 p-4 sm:p-5 space-y-3 bg-zinc-950">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Payment Method</span>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[11px] border border-emerald-800 uppercase">
                    Cash (Selected)
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 font-display text-caption font-bold text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>

                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={handleProceedToReview}
                      className="flex-[2] py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-soft text-on-primary font-display text-caption font-extrabold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                    >
                      Review Order · ₹{totalAmount}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ORDER REVIEW & PLACE CASH ORDER CONFIRMATION */}
        {step === "review" && (
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 max-w-xl mx-auto">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="font-display text-caption font-extrabold uppercase text-zinc-400">
                  Cash Order Confirmation
                </span>
                <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-xs border border-emerald-800 uppercase">
                  Payment: CASH
                </span>
              </div>

              <div className="space-y-1 text-xs text-zinc-300">
                <div className="font-bold text-white text-body-sm">
                  {customerType === "walkin" ? "Walk-in Customer" : customerName.trim() || "Walk-in Customer"}
                </div>
                {studentIdentifier && (
                  <div className="text-caption text-zinc-400 font-mono">ID / Phone: {studentIdentifier}</div>
                )}
              </div>

              <div className="divide-y divide-zinc-800/80 border-y border-zinc-800/80 py-2 space-y-2 text-xs">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1">
                    <span className="text-zinc-200 font-medium">
                      {item.quantity} × {item.name}
                    </span>
                    <span className="font-mono font-bold text-zinc-100">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-body font-bold text-white pt-1">
                <span>TOTAL</span>
                <span className="font-mono text-title text-primary font-extrabold">₹{totalAmount}</span>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-caption text-amber-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-sm">info</span>
                <span>
                  Order will be created immediately in <strong>PREPARING</strong> status with no Accept/Reject requirement.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 max-w-xl mx-auto border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setStep("select")}
                className="px-5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 font-display text-caption font-bold text-zinc-400 hover:text-white"
              >
                Back to Items
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handlePlaceCashOrder}
                className="px-8 py-2.5 rounded-xl bg-primary hover:bg-primary-soft disabled:opacity-50 text-on-primary font-display text-body-sm font-extrabold uppercase tracking-wider shadow-xl flex items-center justify-center gap-2"
              >
                {submitting && <span className="material-symbols-outlined text-sm animate-spin">sync</span>}
                PLACE CASH ORDER · ₹{totalAmount}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ORDER CREATED SUCCESS SCREEN */}
        {step === "success" && (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4 my-auto">
            <span className="material-symbols-outlined text-[64px] text-emerald-400 animate-in zoom-in-75">
              check_circle
            </span>
            <div className="space-y-1">
              <h3 className="font-display text-title font-extrabold text-white">ORDER PLACED</h3>
              <p className="font-mono font-bold text-primary text-body">{createdOrderRef}</p>
            </div>

            <div className="flex items-center gap-3 text-xs border border-zinc-800 bg-zinc-950 p-3 rounded-xl">
              <span className="text-zinc-300">Payment: Cash Payment (₹{totalAmount})</span>
              <span className="text-zinc-500">•</span>
              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-bold border border-blue-800 uppercase">
                Status: Preparing
              </span>
            </div>

            <p className="text-caption text-zinc-400 max-w-sm">
              Manual Cash Order created immediately on active kitchen operations board.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-8 py-2.5 bg-primary text-on-primary font-display text-caption font-bold uppercase rounded-xl hover:bg-primary-soft"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
