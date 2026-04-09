"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  bucket: "avatars" | "portfolios" | "deliveries" | "attachments" | "service-images";
  folder?: string;
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  aspect?: "square" | "video";
  placeholder?: string;
}

export function ImageUpload({
  bucket,
  folder,
  value,
  onChange,
  onRemove,
  className,
  aspect = "square",
  placeholder = "이미지를 업로드하세요",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFile(bucket, file, folder);
      onChange(result.url);
      toast.success("이미지가 업로드되었습니다");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "업로드에 실패했습니다");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
      />

      {value ? (
        <div className={cn(
          "relative rounded-lg overflow-hidden border border-slate-200",
          aspect === "video" ? "aspect-video" : "aspect-square"
        )}>
          <Image
            src={value}
            alt="Uploaded"
            fill
            className="object-cover"
            unoptimized
          />
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove()}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-primary",
            aspect === "video" ? "aspect-video" : "aspect-square",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Upload className="h-8 w-8" />
          )}
          <span className="text-sm">{isUploading ? "업로드 중..." : placeholder}</span>
        </button>
      )}
    </div>
  );
}
