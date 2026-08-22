"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GlobalSearchFilterBar } from "@/components/superadmin/search/GlobalSearchFilterBar";
import { GlobalSearchResultGroup } from "@/components/superadmin/search/GlobalSearchResultGroup";
import { GlobalSearchQuickActions } from "@/components/superadmin/search/GlobalSearchQuickActions";
import type {
  GlobalSearchResultItem,
  SearchEntityCategory,
} from "@/lib/supabase/superadmin_search";

export default function SuperAdminSearchPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SearchEntityCategory>("ALL");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const executeSearch = useCallback(async (q: string, cat: SearchEntityCategory) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      params.set("q", q.trim());
      params.set("category", cat);

      const res = await fetch(`/api/superadmin/search?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setResults(data.results);
      } else {
        setErrorMsg(data.error || "Failed to execute global search.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error executing search.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(query, selectedCategory);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, selectedCategory, executeSearch]);

  // Handle '/' and '⌘K' keyboard shortcuts on the search page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus input on '/' if user is not already in an input/textarea
      if (
        e.key === "/" &&
        document.activeElement !== inputRef.current &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Focus input on ⌘K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Global Search & Operations Finder</h1>
            <span className="bg-orange-950/60 border border-orange-800/60 text-orange-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Platform Discovery
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Search across users, vendors, campuses, orders, support tickets, disputes, risk cases, feature flags, and audit events
          </p>
        </div>
      </div>

      {/* Prominent Search Bar Input */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-xl cursor-text transition-colors hover:border-zinc-700"
      >
        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-4 text-zinc-400 text-xl pointer-events-none select-none">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, vendors, orders, campuses, tickets, flags... (Press '/' to focus)"
            className="w-full pl-12 pr-28 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
          />
          <div className="absolute right-4 flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="text-zinc-400 hover:text-zinc-200 text-xs px-2 py-1 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 rounded transition-colors"
              >
                Clear
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-1 text-zinc-500 text-xs font-mono border border-zinc-800 px-2 py-1 rounded bg-zinc-950 select-none pointer-events-none">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-rose-400">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Chips */}
      <GlobalSearchFilterBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Search Results */}
      {query.trim().length >= 2 ? (
        <GlobalSearchResultGroup results={results} loading={loading} />
      ) : (
        <GlobalSearchQuickActions />
      )}
    </div>
  );
}

