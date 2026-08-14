"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";

export default function ProfilePage() {
  const { student, logout } = useAuth();
  const router = useRouter();
  const [classroomMode, setClassroomMode] = useState(false);

  const toggleClassroomMode = () => {
    const next = !classroomMode;
    setClassroomMode(next);
    if (next) {
      document.documentElement.setAttribute("data-mode", "classroom");
    } else {
      document.documentElement.removeAttribute("data-mode");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/app/login");
  };

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold tracking-tight mb-8">Profile</h1>

      {/* Student info */}
      <div className="rounded-2xl border border-border bg-surface p-5 mb-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent text-xl font-bold">
            {student?.name?.charAt(0) || "?"}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{student?.name || "Student"}</h2>
            <p className="text-sm text-text-secondary font-mono">
              +91 {student?.phone || "—"}
            </p>
          </div>
        </div>

        {student?.is_gold_subscriber && (
          <div className="mt-4 rounded-xl bg-accent/10 border border-accent/20 p-3 flex items-center gap-3">
            <span className="text-lg">✦</span>
            <div>
              <p className="text-sm font-semibold text-accent">GrabIt Gold</p>
              <p className="text-xs text-text-secondary">
                Zero platform fees on all orders
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="space-y-3">
        {/* Classroom mode */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Classroom-safe mode</p>
            <p className="text-xs text-text-muted mt-0.5">
              Lower brightness & contrast
            </p>
          </div>
          <button
            onClick={toggleClassroomMode}
            className={`
              relative h-7 w-12 rounded-full transition-colors duration-300
              ${classroomMode ? "bg-accent" : "bg-surface-3"}
            `}
          >
            <span
              className={`
                absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300
                ${classroomMode ? "translate-x-5" : "translate-x-0.5"}
              `}
            />
          </button>
        </div>

        {/* GrabIt Gold */}
        {!student?.is_gold_subscriber && (
          <button className="
            w-full flex items-center justify-between rounded-xl border border-accent/30 bg-accent/5 px-5 py-4
            hover:bg-accent/10 transition-colors
          ">
            <div className="text-left">
              <p className="text-sm font-semibold text-accent">✦ Get GrabIt Gold</p>
              <p className="text-xs text-text-muted mt-0.5">
                Zero platform fees · Priority pickup
              </p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="
            w-full rounded-xl border border-border bg-surface px-5 py-4
            text-left text-sm font-medium text-error
            hover:bg-surface-2 transition-colors
          "
        >
          Log out
        </button>
      </div>
    </div>
  );
}
