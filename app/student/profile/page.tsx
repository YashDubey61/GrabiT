"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrackEventOnMount } from "@/components/shared/TrackEventOnMount";
import { ProfileHeader } from "@/components/student/profile/ProfileHeader";
import { GrabItGoldCard } from "@/components/student/profile/GrabItGoldCard";
import { ProfileMenuItem } from "@/components/student/profile/ProfileMenuItem";
import { MOCK_STUDENT_PROFILE, type StudentProfile, type GoldSubscription } from "@/lib/mock/student";
import { getLiveStudentProfile, getLiveStudentSubscription } from "@/lib/supabase/student_profile";
import { createClient } from "@/lib/supabase/client";

export default function StudentProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile>(MOCK_STUDENT_PROFILE);
  const [subscription, setSubscription] = useState<GoldSubscription>(MOCK_STUDENT_PROFILE.goldSubscription);
  const [activeToast, setActiveToast] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadLiveData() {
      const liveProf = await getLiveStudentProfile();
      const liveSub = await getLiveStudentSubscription();

      if (isMounted) {
        if (liveProf) {
          setProfile({
            id: liveProf.id,
            studentIdCode: liveProf.studentIdTag,
            name: liveProf.email.split("@")[0].replace(".", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            email: liveProf.email,
            phone: liveProf.phone || "+91 98765 43210",
            campus: liveProf.campusName,
            department: liveProf.department,
            avatarUrl: liveProf.avatarUrl,
            goldSubscription: MOCK_STUDENT_PROFILE.goldSubscription,
          });
        }
        if (liveSub) {
          setSubscription({
            active: liveSub.isActive,
            planName: liveSub.displayPlanName,
            validUntil: liveSub.displayValidUntil,
            perksSummary: liveSub.perksSummary,
          });
        }
      }
    }
    loadLiveData();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (message: string) => {
    setActiveToast(message);
    setTimeout(() => {
      setActiveToast(null);
    }, 3000);
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // safe fallback
    }
    router.push("/");
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <TrackEventOnMount payload={{ eventName: "gold_plan_viewed" }} />

      {/* Top Bar Header */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border-subtle bg-background/80 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[24px] text-primary" aria-hidden="true">
            location_on
          </span>
          <span className="font-display text-title font-extrabold tracking-tight text-primary">
            GrabIt
          </span>
        </div>
        <button
          type="button"
          onClick={() => showToast("Scan QR Code coming soon")}
          className="rounded-full p-2 text-muted transition-transform active:scale-95 hover:text-foreground"
          aria-label="Scan QR Code"
        >
          <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
            qr_code_scanner
          </span>
        </button>
      </header>

      {/* Main Profile Content */}
      <main className="mx-auto max-w-lg px-4 pt-6 pb-24">
        {/* Profile Hero Header */}
        <ProfileHeader
          profile={profile}
          onEditAvatar={() => showToast("Avatar update feature available in profile settings.")}
        />

        {/* GrabIt Gold Subscription Card */}
        <GrabItGoldCard
          subscription={subscription}
          onPurchasePlan={() => showToast("Redirecting to Gold Pass Razorpay checkout...")}
          onManage={() => showToast("Subscription management panel active.")}
        />

        {/* Menu Options */}
        <nav aria-label="Profile navigation" className="space-y-3">
          <ProfileMenuItem
            icon="receipt_long"
            title="Order History"
            subtitle="View all your past campus cravings"
            href="/student/orders"
          />
          <ProfileMenuItem
            icon="location_on"
            title="Saved Addresses"
            subtitle="Hostel blocks & department spots"
            onClick={() => showToast("Saved campus delivery spots: Hostel Block B, Library Plaza")}
          />
          <ProfileMenuItem
            icon="support_agent"
            title="Help & Support"
            subtitle="FAQs, Chat & Contact Support"
            onClick={() => showToast("Support Desk: help@grabit.in | Helpline: 1800-GRABIT")}
          />
          <ProfileMenuItem
            icon="logout"
            title="Logout"
            subtitle="Switch accounts or exit"
            variant="danger"
            onClick={handleLogout}
          />
        </nav>

        {/* Version Footer */}
        <div className="mt-8 text-center">
          <span className="text-caption font-medium opacity-40">
            GrabIt v2.4.0-stealth
          </span>
        </div>
      </main>

      {/* Toast Notification */}
      {activeToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-primary/30 bg-[#1e1f26] px-5 py-2.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <p className="font-display text-caption font-bold text-primary">{activeToast}</p>
        </div>
      )}
    </div>
  );
}
