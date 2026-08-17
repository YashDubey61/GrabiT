"use client";

import Link from "next/link";
import Image from "next/image";

export function LandingFeaturesBento() {
  return (
    <section className="py-20 bg-black px-6 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <h2 className="font-display text-caption font-extrabold uppercase tracking-[0.2em] text-primary">
            Unfair Advantage
          </h2>
          <p className="mt-2 max-w-2xl font-display text-[32px] sm:text-[40px] font-extrabold leading-tight text-foreground">
            Re-engineered for the modern student athlete &amp; late-night scholar.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Feature 1: Stealth Ordering */}
          <div className="md:col-span-8 relative overflow-hidden rounded-3xl border border-border bg-[#1e1f26]/80 p-6 sm:p-8 backdrop-blur-md transition-all hover:border-primary/40 group">
            <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
              <div>
                <span className="material-symbols-outlined text-[38px] text-primary mb-4 block">
                  visibility_off
                </span>
                <h3 className="font-display text-title font-bold text-foreground mb-2">
                  Classroom Stealth Ordering
                </h3>
                <p className="max-w-md text-body-sm text-muted">
                  Our silent UI and haptic-only notifications mean you can secure your lunch slot while still paying attention in the lecture.
                </p>
              </div>

              <div>
                <Link
                  href="/customer"
                  className="inline-flex items-center gap-2 font-display text-caption font-bold uppercase tracking-wider text-primary group-hover:gap-3 transition-all"
                >
                  Explore Stealth Mode
                  <span className="material-symbols-outlined text-[18px]">
                    east
                  </span>
                </Link>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-0 right-0 h-full w-1/2 opacity-30 group-hover:opacity-60 transition-opacity">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCO9fQg1GLCdbip4s5t7v62cycsCO2pq8Qm69XApSngB2U_uE4swKcrWlYPJOv1HGvOocaJWr9IxHDtGmqJiVLHAJz6wIDSFHiFHQRQ1Ky2SMY26m4adQ7xd18bDcJq3cKI-qRBsa4JkCrPY4v5KvJjD6wWAy0XnjuGGivrjl44Zpl0jp-JTTi_4HjYX3HmG-btVZoYCVv8oKNBr8Fs4YIczk8-1foFuN_LsqcB2oL7Tp22pcNfm_Ev"
                alt="Stealth mode in lecture"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Feature 2: Zero Wait Time */}
          <div className="md:col-span-4 flex flex-col items-center justify-center rounded-3xl border border-primary/20 bg-[#1e1f26]/80 p-6 sm:p-8 text-center backdrop-blur-md transition-all hover:border-primary/40 group">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-black transition-transform duration-300 group-hover:scale-110 shadow-glow-primary">
              <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'wght' 700" }}>
                timer_off
              </span>
            </div>
            <h3 className="font-display text-title font-bold text-foreground mb-2">
              Zero Queue Wait
            </h3>
            <p className="text-body-sm text-muted">
              Pick up food immediately upon break start. No queues, no hassle, no missed classes.
            </p>
          </div>

          {/* Feature 3: Digital Wallet */}
          <div className="md:col-span-4 relative overflow-hidden rounded-3xl border border-border bg-[#1e1f26]/80 p-6 sm:p-8 backdrop-blur-md transition-all hover:border-primary/40">
            <h3 className="font-display text-title font-bold text-foreground mb-2">
              Campus Digital Wallet
            </h3>
            <p className="text-body-sm text-muted mb-6">
              Instant 1-tap checkout, cashback rewards, and zero payment gateway fees.
            </p>

            <div className="rounded-2xl border border-white/10 p-4 shadow-lg" style={{ background: "linear-gradient(135deg, #FF6D00 0%, #FFB692 100%)" }}>
              <div className="font-display text-caption font-bold text-white uppercase tracking-wider mb-1">
                GrabIt Balance
              </div>
              <div className="font-display text-title font-extrabold text-white">
                ₹1,240.50
              </div>
            </div>
          </div>

          {/* Feature 4: Verified Campus Vendors */}
          <div className="md:col-span-8 relative overflow-hidden rounded-3xl border border-border min-h-[220px] group">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAtr8OZgRwOgTgFTiJYarO_wqMR0o961ikN78OdZnO9W0zK2MsIhRU8igrwZAEsX1OfQE4MnlknbidLvOYecTAROkHaVJBTSzI-RaXqybG-oYJgh51-hZjWyT7Ok-7AVzi-2WhDBFcSfnnGO2pxHfv_xa2w6sdk7C7YOdptJuJnFGmXa0KsT9u7TW9W-Hl2OB5nEMRVIdT7UuWBfNiddOVpgoDL0OktT62X6IdqXxhc259tKmKhaxB"
              alt="Verified Campus Food"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="font-display text-title font-bold text-foreground mb-1">
                Verified Campus Canteens
              </h3>
              <p className="text-body-sm text-muted">
                Only the best local kitchens on your campus, vetted for hygiene, speed, and taste.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
