// Cloudflare Stream 에 올린 영상에서 한 장면을 이미지로 가져오는 주소를 만든다.
//
// 서비스의 images 에는 `https://customer-xxx.cloudflarestream.com/<uid>/thumbnails/thumbnail.jpg`
// 형태의 주소가 들어 있다. 여기에 시점과 크기를 붙이면 그 장면을 원하는 크기로 받을 수 있다.

// 주의: 이 주소를 next/image 의 최적화(unoptimized 없이)로 쓰려면 해당 호스트가
// next.config.ts 의 images.remotePatterns 에 있어야 한다. 지금은 계정 하나만 등록되어 있다.
const STREAM_URL = /^(https:\/\/[a-z0-9-]+\.cloudflarestream\.com)\/([a-f0-9]{32})\//;

// 주소가 Cloudflare Stream 영상을 가리키면 그 영상의 id 를 돌려준다. 아니면 null.
export function streamUid(source: string | undefined): string | null {
  return source?.match(STREAM_URL)?.[2] ?? null;
}

export function streamFrameUrl(
  source: string | undefined,
  options: { width: number; height: number; time?: string }
): string | null {
  const match = source?.match(STREAM_URL);
  if (!match) return null;

  const params = new URLSearchParams({
    // 첫 프레임은 검은 화면이나 제목 화면인 경우가 많아 기본으로 3초 지점을 쓴다.
    // 영상이 그보다 짧으면 400 이 오므로, 쓰는 쪽에서 대신 보여 줄 이미지를 준비해야 한다 (SceneImage).
    time: options.time ?? "3s",
    width: String(options.width),
    height: String(options.height),
    fit: "crop",
  });
  return `${match[1]}/${match[2]}/thumbnails/thumbnail.jpg?${params}`;
}
