"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Loader2, Plus, X } from "lucide-react";
import { uploadFile } from "@/lib/storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MultiImageUploadProps {
  bucket: "avatars" | "portfolios" | "deliveries" | "attachments" | "service-images";
  folder?: string;
  values: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  className?: string;
}

export function MultiImageUpload({
  bucket,
  folder,
  values,
  onChange,
  maxFiles = 5,
  className,
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = maxFiles - values.length;
    if (files.length > remaining) {
      toast.error(`최대 ${maxFiles}개까지 업로드할 수 있습니다`);
      return;
    }

    setIsUploading(true);
    try {
      const results = await Promise.all(
        files.map((file) => uploadFile(bucket, file, folder))
      );
      onChange([...values, ...results.map((r) => r.url)]);
      toast.success(`${results.length}개 이미지가 업로드되었습니다`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "업로드에 실패했습니다");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {values.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
            <Image src={url} alt={`Image ${index + 1}`} fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {values.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-primary"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
            <span className="text-xs">{isUploading ? "업로드 중" : `${values.length}/${maxFiles}`}</span>
          </button>
        )}
      </div>
    </div>
  );
}
