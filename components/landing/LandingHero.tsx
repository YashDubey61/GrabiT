"use client";

import Link from "next/link";
import Image from "next/image";

export function LandingHero() {
  return (
    <header className="relative min-h-[90dvh] flex items-center pt-24 pb-16 overflow-hidden bg-black">
      {/* Glow Effects */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-primary/15 blur-[140px]" />

      <div className="mx-auto max-w-7xl px-6 md:px-12 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
              bolt
            </span>
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Live on Campus • Pickup-First
            </span>
          </div>

          <h1 className="font-display text-[44px] sm:text-[60px] lg:text-[76px] font-black leading-[0.95] tracking-tight text-foreground">
            When hunger hits,
            <br />
            <span className="text-primary drop-shadow-[0_0_25px_rgba(255,109,0,0.4)]">
              GrabIt.
            </span>
          </h1>

          <p className="max-w-xl text-body-lg text-muted font-normal leading-relaxed">
            The ultimate stealth canteen ordering app designed for campus life. Skip the queue, pay with your digital wallet, and pick up your food without missing a lecture.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              href="/customer"
              className="flex items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-4 font-display text-body font-extrabold uppercase tracking-wider text-on-primary shadow-glow-primary transition-all duration-150 active:scale-95 hover:opacity-90"
            >
              Open Student App
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                arrow_forward
              </span>
            </Link>

            <Link
              href="/vendor"
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-foreground px-8 py-4 font-display text-body font-extrabold text-foreground transition-all duration-150 active:scale-95 hover:bg-foreground hover:text-black"
            >
              Partner with us
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-3 overflow-hidden">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1ujAyeQjKkH7gWKKsPq5PFXODV6jHwaJXfiBxzbxQT4SO6jplNrwwkpMto5Pz97BBhdsmaw1O5a1tv1JuwHwnrscTa-oMtqjHSdDo34kNLxaNLJoJCdcHULi1gc22TO7KnV0phv8kkZkEJrJEgPrSuX9QOevpeq3kdmEtAt52seZQwmo9ofvvrG8PN-xbpyTPsPlso5WSjcqnyR-8G9-jJtCqqnhU5Sks9YCPFQNMj3B9Q3v8BlAj"
                alt="Student user"
                width={44}
                height={44}
                className="inline-block h-11 w-11 rounded-full border-2 border-black object-cover"
              />
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuGGLATdPBFwlVh-OwDsY1N4Nf3VQfLeEE9TjwHdxvP7wzfthBjivQsJyTrpKgw-AF4QXfy7YWaMe7VhMhhzqDCmkw1IYKF2_X1VlKFG3_zT5NefzK7WBkGTgJSS5sPbZIbaF71qc06LkNeiicDt54UL8AKnwASwsvhE03wHdaXWPWwRkQDmzCYRiluJsIqOeNmrXjQo-Ujbr1wttepcQUr7dBI8IhD3z5IMubYOmRfL2S0hvRzP6j"
                alt="Student user"
                width={44}
                height={44}
                className="inline-block h-11 w-11 rounded-full border-2 border-black object-cover"
              />
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD34q2hHzpo7aIfmV7kvikd_gz_RoDWdyV29U-yvt1t8FbpqFDKat18A0gCIP-vkEWoAnncU3gyoxteCuf5Ntn9T-9CF8MjdHAn-5swaCTNO2qHPSJ1biiUIW2T8Va7zUZVlu5M6W_dG0KqAVg8ObHg9ENLwwFTDeTqlIALw4XVEh7iaMUTP3sWvXK_pgKScLl2lXqR9uBKvXQqN_vdw5PQVCRzE4A8KjhWAo26fhqAQ6vdJAeGkM9L"
                alt="Student user"
                width={44}
                height={44}
                className="inline-block h-11 w-11 rounded-full border-2 border-black object-cover"
              />
            </div>
            <span className="text-body-sm text-muted font-medium">
              Join <strong className="text-foreground">15,000+</strong> campus students skipping lines daily.
            </span>
          </div>
        </div>

        {/* Hero Visual Card Showcase */}
        <div className="relative hidden lg:block">
          <div className="relative mx-auto max-w-sm rounded-[36px] border border-border bg-surface-elevated/90 p-4 shadow-2xl backdrop-blur-xl">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiniHJLh_lHHwBLzWH9y6cc9d4XJUhDOBngyBDtgNruIG22uqUDJAoURjyqMURuPP4u2mkMMGrAyzVG9e8SL5Dd693ScKynXX7IP60woft0N0v6BjWXKHgvPsz2-vIuJy8mG86tDc6oiY1NqSSK4OhFRHaPQAwcipy_hxxTOa_pdSfcOohTG0o_SOL84wXuxogdg8OdufTXWBzDnHC-rde5mos4Q-lDbN34o1B5_Uw3_8kM9j2JUao"
              alt="GrabIt Mobile App Interface Showcase"
              width={380}
              height={500}
              className="w-full rounded-[28px] object-cover"
            />

            {/* Floating Badges */}
            <div className="absolute -left-8 top-1/4 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-surface-elevated/90 p-3.5 shadow-2xl backdrop-blur-md">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                stars
              </span>
              <span className="font-display text-body-sm font-bold text-foreground">
                Order Received
              </span>
            </div>

            <div className="absolute -right-6 bottom-1/4 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-surface-elevated/90 p-3.5 shadow-2xl backdrop-blur-md">
              <span className="material-symbols-outlined text-success">
                schedule
              </span>
              <span className="font-display text-body-sm font-bold text-foreground">
                2 Min Pickup Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
