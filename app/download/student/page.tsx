import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Download GRABIT Student App",
  description: "Order from your campus canteen faster. Download the GRABIT Student Android app.",
};

const APK_SIZE_MB = "64.6";
const APK_VERSION = "1.0";
const RELEASE_DATE = "24 August 2026";
const MIN_ANDROID = "Android 7.0 (Nougat) or later";

export default function StudentAppDownloadPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center px-6 py-16 text-center">
      <Image
        src="/grabit-logo.png"
        alt="GRABIT"
        width={96}
        height={96}
        className="mb-6 rounded-2xl"
        priority
      />

      <h1 className="font-display text-title font-800 text-foreground">
        GRABIT Student App
      </h1>
      <p className="mt-2 text-body text-muted">
        Order from your campus canteen faster.
      </p>

      <a
        href="/grabit-student.apk"
        download
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-body font-700 text-on-primary shadow-glow-primary transition-transform active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          android
        </span>
        Download GRABIT Student App
      </a>

      <dl className="mt-10 w-full space-y-3 rounded-2xl border border-border-subtle bg-surface-elevated/60 p-5 text-left">
        <div className="flex items-center justify-between">
          <dt className="text-caption text-muted">Version</dt>
          <dd className="text-caption font-700 text-foreground">{APK_VERSION}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-caption text-muted">File size</dt>
          <dd className="text-caption font-700 text-foreground">{APK_SIZE_MB} MB</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-caption text-muted">Release date</dt>
          <dd className="text-caption font-700 text-foreground">{RELEASE_DATE}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-caption text-muted">Requires</dt>
          <dd className="text-caption font-700 text-foreground">{MIN_ANDROID}</dd>
        </div>
      </dl>

      <p className="mt-6 text-label text-muted">
        This app is not distributed through the Google Play Store. Your device may show an
        "Install unknown apps" prompt — this is expected for direct APK installs.
      </p>
    </main>
  );
}
