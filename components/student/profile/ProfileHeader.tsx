"use client";

import Image from "next/image";
import { useState } from "react";

interface ProfileHeaderProps {
  fullName: string;
  grabitUserId: string;
  avatarUrl: string;
  onEditProfile?: () => void;
}

export function ProfileHeader({
  fullName,
  grabitUserId,
  avatarUrl,
  onEditProfile,
}: ProfileHeaderProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <section className="flex flex-col items-center mb-6 text-center">
      {/* Avatar Container with Edit Badge */}
      <div className="relative mb-4 h-24 w-24">
        <div className="h-full w-full rounded-full border-2 border-primary p-1 shadow-glow-primary overflow-hidden">
          {!imageError && avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={fullName}
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
          onClick={onEditProfile}
          type="button"
          aria-label="Edit profile photo"
          className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-on-primary shadow-md transition-transform hover:scale-110 active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            edit
          </span>
        </button>
      </div>

      {/* Full Name */}
      <h2 className="font-display text-title font-bold text-foreground">
        {fullName}
      </h2>

      {/* Permanent GRABIT User ID */}
      <div className="mt-1 flex items-center justify-center gap-1.5 text-muted">
        <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">
          verified_user
        </span>
        <span className="font-display text-label font-bold tracking-wider uppercase text-primary">
          ID: {grabitUserId}
        </span>
      </div>

      {/* Edit Profile Action Button */}
      <div className="mt-3">
        <button
          type="button"
          onClick={onEditProfile}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-elevated px-4 py-1.5 text-caption font-bold text-muted transition-colors hover:border-primary/50 hover:text-foreground active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            settings
          </span>
          Edit Profile Details
        </button>
      </div>
    </section>
  );
}
