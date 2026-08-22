"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { GlobalSearchResultItem, SearchEntityCategory } from "@/lib/supabase/superadmin_search";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchEntityCategory>("ALL");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/superadmin/search?q=${encodeURIComponent(query.trim())}&category=${category}`);
        const data = await res.json();
        if (data.ok) {
          setResults(data.results);
          setSelectedIndex(0);
        }
      } catch {
        // Fallback
      } font: {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, category]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      router.push(results[selectedIndex].deepLink);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-16 sm:pt-24 overflow-y-auto">
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col space-y-0"
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input */}
        <div className="relative p-4 border-b border-zinc-800 flex items-center gap-3">
          <span className="material-symbols-outlined text-zinc-400">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, vendors, orders, campuses, tickets... (⌘K / Esc)"
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {loading && <span className="material-symbols-outlined animate-spin text-zinc-400 text-sm">sync</span>}
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1 bg-zinc-800 rounded">
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-zinc-800/60 p-2">
          {query.trim().length < 2 ? (
            <div className="p-8 text-center text-zinc-500 text-xs space-y-2">
              <span className="material-symbols-outlined text-3xl opacity-50">search</span>
              <p>Type at least 2 characters to search across GRABIT network...</p>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="p-8 text-center text-zinc-400 text-xs space-y-2">
              <span className="material-symbols-outlined text-3xl text-zinc-600">manage_search</span>
              <p className="font-semibold text-zinc-300">No matching records found</p>
              <p className="text-zinc-500">Try searching by ID, name, status, or order number.</p>
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <Link
                  key={`${item.category}-${item.id}-${idx}`}
                  href={item.deepLink}
                  onClick={onClose}
                  className={`p-3 rounded-xl flex items-center justify-between transition-colors ${
                    isSelected ? "bg-orange-950/60 border border-orange-800/80" : "hover:bg-zinc-800/40"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-orange-400 font-bold uppercase">
                        {item.entityName}
                      </span>
                      <span className="font-bold text-xs text-white">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{item.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 uppercase">
                      {item.status}
                    </span>
                    <span className="material-symbols-outlined text-xs text-zinc-500">arrow_forward</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>ESC Close</span>
          </div>
          <Link href="/superadmin/search" onClick={onClose} className="text-orange-400 hover:text-orange-300 font-medium">
            Advanced Search Console →
          </Link>
        </div>
      </div>
    </div>
  );
}
