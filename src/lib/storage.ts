import { createClient } from "@/lib/supabase/client";

type BucketName = "avatars" | "portfolios" | "deliveries" | "attachments" | "service-images";

interface UploadResult {
  url: string;
  path: string;
}

// Max file sizes per bucket (in bytes)
const MAX_SIZES: Record<BucketName, number> = {
  avatars: 2 * 1024 * 1024,       // 2MB
  portfolios: 10 * 1024 * 1024,   // 10MB
  deliveries: 100 * 1024 * 1024,  // 100MB
  attachments: 10 * 1024 * 1024,  // 10MB
  "service-images": 5 * 1024 * 1024, // 5MB
};

// Allowed MIME types per bucket
const ALLOWED_TYPES: Record<BucketName, string[]> = {
  avatars: ["image/jpeg", "image/png", "image/webp"],
  portfolios: ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"],
  deliveries: ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "application/pdf", "application/zip", "application/x-rar-compressed"],
  attachments: ["image/jpeg", "image/png", "image/webp", "video/mp4", "application/pdf"],
  "service-images": ["image/jpeg", "image/png", "image/webp"],
};

export async function uploadFile(
  bucket: BucketName,
  file: File,
  folder?: string
): Promise<UploadResult> {
  // Validate file size
  if (file.size > MAX_SIZES[bucket]) {
    const maxMB = MAX_SIZES[bucket] / (1024 * 1024);
    throw new Error(`파일 크기는 ${maxMB}MB 이하여야 합니다`);
  }

  // Validate file type
  if (!ALLOWED_TYPES[bucket].includes(file.type)) {
    throw new Error("지원하지 않는 파일 형식입니다");
  }

  const supabase = createClient();

  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const fileName = `${timestamp}-${random}.${ext}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`업로드 실패: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath,
  };
}

export async function deleteFile(bucket: BucketName, path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw new Error(`삭제 실패: ${error.message}`);
  }
}

export async function uploadMultipleFiles(
  bucket: BucketName,
  files: File[],
  folder?: string
): Promise<UploadResult[]> {
  return Promise.all(files.map((file) => uploadFile(bucket, file, folder)));
}
