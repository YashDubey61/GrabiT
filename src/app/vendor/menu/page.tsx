"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/constants";
import { PriceTag } from "@/components/ui/PriceTag";

type LocalMenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  in_stock: boolean;
  description: string;
};

const INITIAL_ITEMS: LocalMenuItem[] = [
  { id: "mi1", name: "Samosa", price: 1500, category: "Snacks", in_stock: true, description: "Crispy potato-filled pastry" },
  { id: "mi2", name: "Masala Dosa", price: 4000, category: "Main Course", in_stock: true, description: "South Indian crepe" },
  { id: "mi3", name: "Filter Coffee", price: 2000, category: "Beverages", in_stock: true, description: "Traditional filter coffee" },
  { id: "mi4", name: "Veg Biryani", price: 7000, category: "Main Course", in_stock: true, description: "Fragrant basmati rice" },
  { id: "mi5", name: "Cold Coffee", price: 3500, category: "Beverages", in_stock: true, description: "Chilled coffee with ice cream" },
  { id: "mi6", name: "Paneer Tikka", price: 6000, category: "Snacks", in_stock: true, description: "Grilled cottage cheese" },
  { id: "mi7", name: "Chai", price: 1500, category: "Beverages", in_stock: true, description: "Masala chai brewed fresh" },
  { id: "mi8", name: "Vada Pav", price: 2000, category: "Snacks", in_stock: true, description: "Mumbai-style potato fritter" },
  { id: "mi9", name: "Gulab Jamun", price: 2500, category: "Desserts", in_stock: false, description: "Sweet milk dumplings" },
];

export default function VendorMenuPage() {
  const [items, setItems] = useState<LocalMenuItem[]>(INITIAL_ITEMS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "Snacks", description: "" });

  const toggleStock = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, in_stock: !item.in_stock } : item
      )
    );
  };

  const addItem = () => {
    if (!newItem.name || !newItem.price) return;
    const item: LocalMenuItem = {
      id: `mi-${Date.now()}`,
      name: newItem.name,
      price: parseInt(newItem.price) * 100,
      category: newItem.category,
      in_stock: true,
      description: newItem.description,
    };
    setItems((prev) => [...prev, item]);
    setNewItem({ name: "", price: "", category: "Snacks", description: "" });
    setShowAddForm(false);
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold tracking-tight">Menu</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-dim transition-colors"
        >
          {showAddForm ? "Cancel" : "+ Add Item"}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="rounded-2xl border border-accent/30 bg-surface p-4 mb-6 space-y-3 animate-slide-down">
          <input
            type="text"
            placeholder="Item name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
          />
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Price (₹)"
              value={newItem.price}
              onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
              className="flex-1 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            />
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="flex-1 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            >
              <option>Snacks</option>
              <option>Main Course</option>
              <option>Beverages</option>
              <option>Desserts</option>
            </select>
          </div>
          <button
            onClick={addItem}
            className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-bg hover:bg-accent-dim transition-colors"
          >
            Add to Menu
          </button>
        </div>
      )}

      {/* Menu items list */}
      <div className="space-y-2 stagger-children">
        {items.map((item) => (
          <div
            key={item.id}
            className={`
              flex items-center gap-4 rounded-xl border bg-surface px-4 py-3
              transition-all duration-200
              ${item.in_stock ? "border-border" : "border-error/20 opacity-50"}
            `}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{item.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <PriceTag paise={item.price} size="sm" />
                <span className="text-xs text-text-muted">· {item.category}</span>
              </div>
            </div>

            {/* Stock toggle */}
            <button
              onClick={() => toggleStock(item.id)}
              className={`
                relative h-6 w-10 rounded-full transition-colors duration-300
                ${item.in_stock ? "bg-success" : "bg-surface-3"}
              `}
            >
              <span
                className={`
                  absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300
                  ${item.in_stock ? "translate-x-4" : "translate-x-0.5"}
                `}
              />
            </button>

            {/* Delete */}
            <button
              onClick={() => deleteItem(item.id)}
              className="text-text-muted hover:text-error transition-colors p-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
