"use client";

import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/50 bg-black py-16 text-muted">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4">
            <span className="font-display text-3xl font-black tracking-tighter text-primary">
              GrabIt
            </span>
            <p className="max-w-xs text-body-sm text-faint">
              Building the future of campus logistics, one meal at a time. Join the stealth movement.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h5 className="font-display text-caption font-bold uppercase tracking-wider text-foreground">
              Product
            </h5>
            <ul className="space-y-2 text-body-sm">
              <li>
                <Link href="/customer" className="hover:text-primary transition-colors">
                  Student App
                </Link>
              </li>
              <li>
                <Link href="/customer/menu" className="hover:text-primary transition-colors">
                  Campus Menu
                </Link>
              </li>
              <li>
                <Link href="/customer/wallet" className="hover:text-primary transition-colors">
                  Digital Wallet
                </Link>
              </li>
              <li>
                <Link href="/customer/orders" className="hover:text-primary transition-colors">
                  Order Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Surfaces Links */}
          <div className="space-y-3">
            <h5 className="font-display text-caption font-bold uppercase tracking-wider text-foreground">
              Surfaces
            </h5>
            <ul className="space-y-2 text-body-sm">
              <li>
                <Link href="/customer" className="hover:text-primary transition-colors">
                  Student Portal
                </Link>
              </li>
              <li>
                <Link href="/vendor" className="hover:text-primary transition-colors">
                  Vendor Dashboard
                </Link>
              </li>
              <li>
                <Link href="/superadmin" className="hover:text-primary transition-colors">
                  Super Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <h5 className="font-display text-caption font-bold uppercase tracking-wider text-foreground">
              Legal
            </h5>
            <ul className="space-y-2 text-body-sm">
              <li>
                <span className="hover:text-primary transition-colors cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-primary transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-primary transition-colors cursor-pointer">
                  Refunds Policy
                </span>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-3">
            <h5 className="font-display text-caption font-bold uppercase tracking-wider text-foreground">
              Support
            </h5>
            <ul className="space-y-2 text-body-sm">
              <li>
                <span className="hover:text-primary transition-colors cursor-pointer">
                  Help Center
                </span>
              </li>
              <li>
                <span className="hover:text-primary transition-colors cursor-pointer">
                  Contact Support
                </span>
              </li>
              <li>
                <span className="hover:text-primary transition-colors cursor-pointer">
                  System Status
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/40 pt-8 text-caption text-faint">
          <p>© 2026 GrabIt Technologies Inc. Built for the campus hustle.</p>
          <p className="mt-2 sm:mt-0 font-mono">Pickup-First Campus Canteen OS</p>
        </div>
      </div>
    </footer>
  );
}
