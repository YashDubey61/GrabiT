"use client";

import Image from "next/image";
import { useState } from "react";
import type { StudentProfile } from "@/lib/mock/student";

interface ProfileHeaderProps {
  profile: StudentProfile;
  onEditAvatar?: () => void;
}

export function ProfileHeader({ profile, onEditAvatar }: ProfileHeaderProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <section className="flex flex-col items-center mb-6 text-center">
      {/* Avatar Container with Edit Badge */}
      <div className="relative mb-4 h-24 w-24">
        <div className="h-full w-full rounded-full border-2 border-primary p-1 shadow-glow-primary">
          {!imageError ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.name}
              width={96}
              height={96}
              onError={() => setImageError(true)}
              className="h-full w-full rounded-full object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-surface-elevated text-primary">
              <span className="material-symbols-outlined text-[40px]" aria-hidden="true">
                person
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onEditAvatar}
          type="button"
          aria-label="Edit avatar"
          className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-on-primary shadow-md transition-transform hover:scale-110 active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            edit
          </span>
        </button>
      </div>

      {/* Name */}
      <h2 className="font-display text-title font-bold text-foreground">
        {profile.name}
      </h2>

      {/* Meta Info */}
      <div className="mt-1 flex flex-col items-center gap-0.5 text-muted">
        <span className="font-display text-label font-bold tracking-wider uppercase text-primary">
          ID: {profile.studentIdCode}
        </span>
        <span className="text-body-sm text-faint">
          {profile.campus} • {profile.department}
        </span>
      </div>
    </section>
  );
}
