"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_PHOTOS = 5;

/** Uploads to the same Supabase Storage project used elsewhere
 * (dish-images pattern) — no second storage system. */
async function uploadCanteenPhoto(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("canteen-photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("canteen-photos").getPublicUrl(path);
  return data.publicUrl;
}

interface CafeteriaPhotoUploaderProps {
  photoUrls: string[];
  onChange: (urls: string[]) => void;
}

/** Cafeteria/shop photo gallery editor — up to 5 photos, individually
 * or multi-selected. First photo is the primary/cover image; Super
 * Admin can reorder, replace, or remove. The client-side 5-photo cap
 * here is a UX convenience only — the server independently re-enforces
 * it (see app/api/superadmin/vendor-management routes). */
export function CafeteriaPhotoUploader({ photoUrls, onChange }: CafeteriaPhotoUploaderProps) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `"${file.name}" isn't a supported image type (JPG, PNG, WebP only).`;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return `"${file.name}" is larger than 5MB.`;
    }
    return null;
  };

  const handleAddFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const files = Array.from(fileList);
    const remainingSlots = MAX_PHOTOS - photoUrls.length;
    if (remainingSlots <= 0) {
      setError("You can upload at most 5 cafeteria photos.");
      return;
    }
    const toUpload = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setError(`Only ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"} can be added (max 5 total).`);
    }

    for (const file of toUpload) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }
      setUploadingCount((n) => n + 1);
      try {
        const url = await uploadCanteenPhoto(file);
        onChange([...photoUrls, url]);
      } catch {
        setError(`Couldn't upload "${file.name}". Please try again.`);
      } finally {
        setUploadingCount((n) => n - 1);
      }
    }
  };

  const handleReplace = async (fileList: FileList | null) => {
    const index = replaceIndexRef.current;
    if (!fileList || fileList.length === 0 || index === null) return;
    const file = fileList[0];
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setUploadingCount((n) => n + 1);
    try {
      const url = await uploadCanteenPhoto(file);
      const next = [...photoUrls];
      next[index] = url;
      onChange(next);
    } catch {
      setError(`Couldn't replace photo. Please try again.`);
    } finally {
      setUploadingCount((n) => n - 1);
      replaceIndexRef.current = null;
    }
  };

  const removeAt = (index: number) => {
    onChange(photoUrls.filter((_, i) => i !== index));
  };

  const moveTo = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= photoUrls.length) return;
    const next = [...photoUrls];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div>
      <p className="mb-1 font-display text-[11px] font-bold uppercase tracking-widest text-faint">Cafeteria Photos</p>
      <p className="mb-2 text-[11px] text-faint">Add up to 5 photos. Upload 1–5 clear photos of the cafeteria/shop.</p>

      {photoUrls.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {photoUrls.map((url, index) => (
            <div key={url + index} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-elevated">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Cafeteria photo ${index + 1}`} className="h-full w-full object-cover" />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-on-primary">
                  Primary
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveTo(index, -1)}
                  aria-label="Move left"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    replaceIndexRef.current = index;
                    replaceInputRef.current?.click();
                  }}
                  aria-label="Replace photo"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white"
                >
                  <span className="material-symbols-outlined text-[14px]">sync</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label="Remove photo"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-danger/80 text-white"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
                <button
                  type="button"
                  disabled={index === photoUrls.length - 1}
                  onClick={() => moveTo(index, 1)}
                  aria-label="Move right"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploadingCount > 0 && <p className="mb-2 text-[11px] text-primary">Uploading {uploadingCount} photo{uploadingCount > 1 ? "s" : ""}…</p>}
      {error && <p className="mb-2 text-[11px] text-danger">{error}</p>}

      <button
        type="button"
        disabled={photoUrls.length >= MAX_PHOTOS || uploadingCount > 0}
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-[11px] font-bold text-muted hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
        Add Photos
      </button>
      <p className="mt-1 text-[10px] text-faint">{photoUrls.length} / {MAX_PHOTOS} photos</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          handleAddFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          handleReplace(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
