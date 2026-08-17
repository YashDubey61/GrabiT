"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrackEventOnMount } from "@/components/shared/TrackEventOnMount";
import { ProfileHeader } from "@/components/student/profile/ProfileHeader";
import { EditProfileModal } from "@/components/student/profile/EditProfileModal";
import { SavedAddressesModal } from "@/components/student/profile/SavedAddressesModal";
import { GrabItGoldCard } from "@/components/student/profile/GrabItGoldCard";
import { ProfileMenuItem } from "@/components/student/profile/ProfileMenuItem";
import {
  getLiveStudentProfile,
  getLiveStudentSubscription,
  updateLiveStudentProfile,
  type StudentProfileDetails,
  type StudentSubscriptionDetails,
} from "@/lib/supabase/student_profile";
import { createClient } from "@/lib/supabase/client";

export default function StudentProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfileDetails | null>(null);
  const [subscription, setSubscription] = useState<StudentSubscriptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const [liveProf, liveSub] = await Promise.all([
        getLiveStudentProfile(),
        getLiveStudentSubscription(),
      ]);

      if (isMounted) {
        if (liveProf) {
          setProfile(liveProf);
        } else {
          // Default fallback profile structure
          setProfile({
            id: "guest",
            email: "student@grabit.in",
            fullName: "Grabit Customer",
            phone: "+91 98765 43210",
            role: "student",
            campusId: "",
            campusName: "Campus",
            grabitUserId: "GRB-FE1B32",
            avatarUrl:
              "https://lh3.googleusercontent.com/aida-public/AB6AXuDp0UC7dpD4OUKonC4W287WPg0Gnic80gYNaQUlT5JeKVdN9Qi2mZGcvFp3hdZ05VTrWmjRr-Twvu8fFinGwpcdg0gPV1peTnf5OPY7ytoGnVZ1f_q1Op19HPKnEO3X1GvKha2kWOQqpSRkpPyRjGByLCeqU7qcar10tg5xTuhvKY_nuw8tk-fA7oJzUcBXhBRktsp1XTnf94v1SNBiI-7XR0F0i1Y6PtSMwdTnJwHi4QisCMfCh7_R",
          });
        }
        setSubscription(liveSub);
        setIsLoading(false);
      }
    }

    loadData();
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

  const handleSaveProfile = async (payload: {
    fullName: string;
    phone: string;
    avatarUrl: string;
  }) => {
    const res = await updateLiveStudentProfile(payload);
    if (res.ok) {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              fullName: payload.fullName,
              phone: payload.phone,
              avatarUrl: payload.avatarUrl,
            }
          : prev,
      );
      showToast("Profile updated successfully.");
    } else {
      showToast(res.error || "We couldn't update your profile. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // safe fallback
    }
    router.push("/auth");
  };

  const currentGoldSub = subscription
    ? {
        active: subscription.isActive,
        planName: subscription.displayPlanName,
        validUntil: subscription.isActive ? subscription.displayValidUntil : "Inactive",
        perksSummary: subscription.perksSummary,
      }
    : {
        active: false,
        planName: "GrabIt Gold Pass",
        validUntil: "Inactive",
        perksSummary: "Zero platform fees on canteen orders & priority pickup lane access.",
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
        {isLoading ? (
          <div className="py-16 text-center space-y-4">
            <div className="mx-auto h-24 w-24 rounded-full bg-surface-elevated animate-pulse" />
            <div className="mx-auto h-6 w-48 rounded bg-surface-elevated animate-pulse" />
            <div className="mx-auto h-4 w-32 rounded bg-surface-elevated animate-pulse" />
          </div>
        ) : profile ? (
          <>
            {/* Profile Hero Header */}
            <ProfileHeader
              fullName={profile.fullName}
              grabitUserId={profile.grabitUserId}
              avatarUrl={profile.avatarUrl}
              onEditProfile={() => setIsEditModalOpen(true)}
            />

            {/* GrabIt Gold Subscription Card */}
            <GrabItGoldCard
              subscription={currentGoldSub}
              onPurchasePlan={() => showToast("Redirecting to Gold Pass Razorpay checkout...")}
              onManage={() => showToast("Subscription management panel active.")}
            />

            {/* Menu Options */}
            <nav aria-label="Profile navigation" className="space-y-3">
              <ProfileMenuItem
                icon="receipt_long"
                title="Order History"
                subtitle="View all your past campus orders"
                href="/student/orders"
              />
              <ProfileMenuItem
                icon="location_on"
                title="Saved Addresses"
                subtitle="Manage your delivery & pickup spots"
                onClick={() => setIsAddressModalOpen(true)}
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
          </>
        ) : null}

        {/* Version Footer */}
        <div className="mt-8 text-center">
          <span className="text-caption font-medium opacity-40">
            GrabIt v2.4.0-stealth
          </span>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentFullName={profile.fullName}
          currentPhone={profile.phone}
          currentEmail={profile.email}
          currentAvatarUrl={profile.avatarUrl}
          grabitUserId={profile.grabitUserId}
          onSave={handleSaveProfile}
        />
      )}

      {/* Saved Addresses Modal */}
      <SavedAddressesModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
      />

      {/* Toast Notification */}
      {activeToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-primary/30 bg-[#1e1f26] px-5 py-2.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <p className="font-display text-caption font-bold text-primary">{activeToast}</p>
        </div>
      )}
    </div>
  );
}
