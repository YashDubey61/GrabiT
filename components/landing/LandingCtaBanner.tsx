"use client";

import Link from "next/link";

export function LandingCtaBanner() {
  return (
    <section className="relative overflow-hidden bg-primary px-6 py-20 text-center text-on-primary">
      {/* Pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, #000 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl space-y-6">
        <h2 className="font-display text-[38px] sm:text-[56px] font-black leading-tight text-black">
          Ready to reclaim your
          <br className="hidden sm:block" />
          campus break?
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
          <Link
            href="/student"
            className="flex items-center justify-center gap-2 rounded-2xl bg-black px-8 py-4 font-display text-body font-extrabold text-white transition-transform hover:scale-105 active:scale-95 shadow-2xl"
          >
            Get the Student App
            <span className="material-symbols-outlined text-[20px]">
              download
            </span>
          </Link>

          <Link
            href="/vendor"
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-black px-8 py-4 font-display text-body font-extrabold text-black hover:bg-black hover:text-white transition-colors active:scale-95"
          >
            Register Vendor
          </Link>
        </div>
      </div>
    </section>
  );
}
