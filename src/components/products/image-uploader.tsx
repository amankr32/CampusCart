"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";

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
            className="relative aspect-square rounded-md border-2 border-black overflow-hidden group"
          >
            <Image src={url} alt="Listing photo" fill className="object-cover" />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute top-1 right-1 flex items-center justify-center h-6 w-6 rounded-full bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity"
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
            className="flex flex-col items-center justify-center gap-1 aspect-square rounded-md border-2 border-dashed border-black/30 hover:border-black/60 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Upload className="h-5 w-5 text-black/40" />
                <span className="text-xs text-black/40">Add photo</span>
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

      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-black/40">
        Up to {MAX_IMAGES} photos, JPEG/PNG/WebP, 8MB max each.
      </p>
    </div>
  );
}
