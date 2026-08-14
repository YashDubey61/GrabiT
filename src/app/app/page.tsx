"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Canteen } from "@/lib/types/database";
import { useAuth } from "@/lib/store/auth";
import { useCart } from "@/lib/store/cart";
import { formatPrice } from "@/lib/constants";
import { CardSkeleton } from "@/components/ui/Skeleton";

export default function StudentHome() {
  const { student } = useAuth();
  const cart = useCart();
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/canteens")
      .then((r) => r.json())
      .then((data) => setCanteens(data.canteens))
      .finally(() => setLoading(false));
  }, []);

  const firstName = student?.name?.split(" ")[0] || "there";

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Greeting */}
      <div className="mb-8 animate-fade-in">
        <p className="text-text-secondary text-sm">Good afternoon,</p>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5">
          {firstName} 👋
        </h1>
      </div>

      {/* Campus label */}
      <div className="mb-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            IIT Bombay — Canteens
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
      </div>

      {/* Canteen list */}
      <div className="space-y-4 stagger-children">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          canteens.map((canteen) => (
            <Link
              key={canteen.id}
              href={`/app/canteen/${canteen.id}`}
              className="
                block rounded-2xl border border-border bg-surface
                p-5 transition-all duration-200
                hover:border-accent/30 hover:bg-surface-2
                active:scale-[0.98]
              "
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight">
                      {canteen.name}
                    </h2>
                    {/* Open/Closed status dot */}
                    <span
                      className={`
                        inline-block h-2 w-2 rounded-full
                        ${canteen.is_open ? "bg-success" : "bg-text-muted"}
                        ${canteen.is_open ? "animate-pulse" : ""}
                      `}
                    />
                  </div>
                  <p className="text-sm text-text-secondary mt-1">
                    {canteen.location_desc}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs font-mono text-text-muted">
                      {canteen.opening_time.slice(0, 5)} – {canteen.closing_time.slice(0, 5)}
                    </span>
                    <span
                      className={`
                        text-xs font-medium px-2 py-0.5 rounded-full
                        ${
                          canteen.is_open
                            ? "bg-success/10 text-success"
                            : "bg-surface-2 text-text-muted"
                        }
                      `}
                    >
                      {canteen.is_open ? "Open now" : "Closed"}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <svg
                  className="text-text-muted mt-1 flex-shrink-0"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Floating cart bar */}
      {cart.totalItems > 0 && (
        <Link
          href="/app/cart"
          className="
            fixed bottom-20 left-4 right-4 z-30
            flex items-center justify-between
            rounded-2xl bg-accent px-5 py-4
            shadow-[0_8px_32px_rgba(255,109,0,0.3)]
            animate-slide-up
            active:scale-[0.98] transition-transform
          "
        >
          <div>
            <span className="text-bg font-semibold text-sm">
              {cart.totalItems} {cart.totalItems === 1 ? "item" : "items"}
            </span>
            <span className="text-bg/70 text-xs ml-2">
              {formatPrice(cart.subtotalPaise)}
            </span>
          </div>
          <span className="text-bg font-semibold text-sm flex items-center gap-1">
            View Cart
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        </Link>
      )}
    </div>
  );
}
