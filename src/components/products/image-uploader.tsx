"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { Loader2, Upload, X } from "@/components/ui/material-symbol";

const MAX_IMAGES = 6;

export function ImageUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - value.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      setError(`You can add up to ${MAX_IMAGES} photos.`);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const uploaded = await Promise.all(
        filesToUpload.map((file) =>
          upload(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          })
        )
      );

      onChange([...value, ...uploaded.map((blob) => blob.url)]);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload failed. Try again."
      );
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = (url: string) => {
    onChange(value.filter((existing) => existing !== url));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {value.map((url) => (
          <div
            key={url}
            className="relative aspect-square rounded-2xl border border-[var(--border-subtle)] overflow-hidden group shadow-xs"
          >
            <Image src={url} alt="Listing photo" fill className="object-cover" />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute top-1.5 right-1.5 flex items-center justify-center h-6 w-6 rounded-full bg-black/70 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {value.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="flex flex-col items-center justify-center gap-1 aspect-square rounded-2xl border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--brand-primary)] bg-[var(--input-bg)]/40 hover:bg-[var(--brand-primary-light)]/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-primary)]" />
            ) : (
              <>
                <Upload className="h-5 w-5 text-[var(--text-muted)]" />
                <span className="text-xs font-semibold text-[var(--text-muted)]">Add photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      <p className="text-xs text-[var(--text-muted)]">
        Up to {MAX_IMAGES} photos, JPEG/PNG/WebP, 8MB max each.
      </p>
    </div>
  );
}
