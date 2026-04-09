"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, FileText, FileImage, FileVideo } from "lucide-react";
import { uploadFile } from "@/lib/storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
}

interface FileUploadProps {
  bucket: "deliveries" | "attachments";
  folder?: string;
  values: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  className?: string;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return FileImage;
  if (type.startsWith("video/")) return FileVideo;
  return FileText;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function FileUpload({
  bucket,
  folder,
  values,
  onChange,
  maxFiles = 10,
  className,
}: FileUploadProps) {
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
        files.map(async (file) => {
          const result = await uploadFile(bucket, file, folder);
          return {
            url: result.url,
            name: file.name,
            size: file.size,
            type: file.type,
          };
        })
      );
      onChange([...values, ...results]);
      toast.success(`${results.length}개 파일이 업로드되었습니다`);
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
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      {values.length > 0 && (
        <div className="space-y-2">
          {values.map((file, index) => {
            const Icon = getFileIcon(file.type);
            return (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Icon className="h-5 w-5 text-slate-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {values.length < maxFiles && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full p-4 rounded-lg border-2 border-dashed border-slate-300 hover:border-primary/50 transition-colors flex items-center justify-center gap-2 text-slate-500 hover:text-primary"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <span className="text-sm">{isUploading ? "업로드 중..." : "파일 첨부하기"}</span>
        </button>
      )}
    </div>
  );
}
