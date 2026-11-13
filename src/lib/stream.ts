// Cloudflare Stream 에 올린 영상에서 한 장면을 이미지로 가져오는 주소를 만든다.
//
// 서비스의 images 에는 `https://customer-xxx.cloudflarestream.com/<uid>/thumbnails/thumbnail.jpg`
// 형태의 주소가 들어 있다. 여기에 시점과 크기를 붙이면 그 장면을 원하는 크기로 받을 수 있다.

const STREAM_URL = /^(https:\/\/[a-z0-9-]+\.cloudflarestream\.com)\/([a-f0-9]{32})\//;

export function streamFrameUrl(
  source: string | undefined,
  options: { width: number; height: number; time?: string }
): string | null {
  const match = source?.match(STREAM_URL);
  if (!match) return null;

  const params = new URLSearchParams({
    // 첫 프레임은 검은 화면이나 제목 화면인 경우가 많아 기본으로 3초 지점을 쓴다.
    time: options.time ?? "3s",
    width: String(options.width),
    height: String(options.height),
    fit: "crop",
  });
  return `${match[1]}/${match[2]}/thumbnails/thumbnail.jpg?${params}`;
}
