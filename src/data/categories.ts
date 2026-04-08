import { Category } from "@/types";

// ===== 대분류 (메인 카테고리) =====
export const mainCategories: Category[] = [
  {
    id: "video",
    name: "영상",
    slug: "video",
    description: "광고, 숏폼, 유튜브, 교육 등 모든 종류의 영상 제작",
    icon: "Play",
    serviceCount: 342,
  },
  {
    id: "cg",
    name: "컴퓨터 그래픽(CG)",
    slug: "cg",
    description: "모션그래픽, 인포그래픽, 3D 모델링, AR/VR",
    icon: "Zap",
    serviceCount: 156,
  },
  {
    id: "animation",
    name: "애니메이션",
    slug: "animation",
    description: "2D, 3D, 화이트보드, 로티/웹 애니메이션",
    icon: "Layers",
    serviceCount: 98,
  },
  {
    id: "ai-content",
    name: "AI 콘텐츠",
    slug: "ai-content",
    description: "AI 영상, AI 이미지, AI 음향 생성",
    icon: "Sparkles",
    serviceCount: 124,
  },
  {
    id: "photo",
    name: "사진",
    slug: "photo",
    description: "제품, 프로필, 이벤트 촬영 및 보정",
    icon: "ImageIcon",
    serviceCount: 87,
  },
  {
    id: "audio",
    name: "음향",
    slug: "audio",
    description: "성우, 음악, 오디오 콘텐츠, 엔지니어링",
    icon: "Volume2",
    serviceCount: 93,
  },
  {
    id: "entertainer",
    name: "엔터테이너",
    slug: "entertainer",
    description: "모델, 배우, 쇼호스트, MC, 공연",
    icon: "UserCircle",
    serviceCount: 45,
  },
  {
    id: "etc",
    name: "기타",
    slug: "etc",
    description: "콘티, 헤어메이크업, 스튜디오 렌탈 등",
    icon: "LayoutGrid",
    serviceCount: 38,
  },
];

// ===== 소분류 (서브 카테고리) =====
export const subCategories: Category[] = [
  // 영상
  { id: "ad-video", name: "광고·홍보 영상", slug: "ad-video", description: "기업 광고, 바이럴, 홍보 영상", icon: "ShoppingBag", serviceCount: 52, parentId: "video" },
  { id: "short-form", name: "숏폼 영상", slug: "short-form", description: "쇼츠, 릴스, 틱톡 세로형 영상", icon: "Smartphone", serviceCount: 68, parentId: "video" },
  { id: "industry-video", name: "업종별 영상", slug: "industry-video", description: "부동산, 의료, 법률 등 업종 특화 영상", icon: "Building", serviceCount: 34, parentId: "video" },
  { id: "product-video", name: "제품 영상", slug: "product-video", description: "제품 소개, 언박싱, 상세페이지 영상", icon: "Box", serviceCount: 41, parentId: "video" },
  { id: "edu-video", name: "교육 영상", slug: "edu-video", description: "온라인 강의, 튜토리얼, e-러닝", icon: "GraduationCap", serviceCount: 35, parentId: "video" },
  { id: "event-video", name: "행사 영상", slug: "event-video", description: "세미나, 컨퍼런스, 웨딩, 돌잔치", icon: "Heart", serviceCount: 28, parentId: "video" },
  { id: "youtube", name: "유튜브 영상", slug: "youtube", description: "유튜브 편집, 인트로, 채널 브랜딩", icon: "Play", serviceCount: 56, parentId: "video" },
  { id: "live-stream", name: "온라인 중계", slug: "live-stream", description: "라이브 방송, 웨비나, 스트리밍", icon: "Share2", serviceCount: 12, parentId: "video" },
  { id: "drone", name: "드론 촬영", slug: "drone", description: "항공 촬영, 드론 영상", icon: "Film", serviceCount: 8, parentId: "video" },
  { id: "post-production", name: "영상 후반작업", slug: "post-production", description: "색보정, 자막, 더빙, 음향 믹싱", icon: "Palette", serviceCount: 45, parentId: "video" },
  { id: "field-staff", name: "현장 스탭", slug: "field-staff", description: "촬영감독, 조명, 음향 스탭", icon: "UserCircle", serviceCount: 15, parentId: "video" },
  { id: "video-etc", name: "영상 기타", slug: "video-etc", description: "기타 영상 관련 서비스", icon: "LayoutGrid", serviceCount: 10, parentId: "video" },

  // 컴퓨터 그래픽(CG)
  { id: "motion-graphics", name: "모션그래픽", slug: "motion-graphics", description: "로고 모션, 타이틀, 인포그래픽 애니메이션", icon: "Zap", serviceCount: 54, parentId: "cg" },
  { id: "infographic", name: "인포그래픽", slug: "infographic", description: "데이터 시각화, 인포그래픽 영상", icon: "Layers", serviceCount: 22, parentId: "cg" },
  { id: "media-art", name: "미디어 아트", slug: "media-art", description: "미디어 아트, 실험적 비주얼", icon: "Brush", serviceCount: 12, parentId: "cg" },
  { id: "intro-logo", name: "인트로·로고", slug: "intro-logo", description: "브랜드 인트로, 로고 애니메이션", icon: "Sparkle", serviceCount: 38, parentId: "cg" },
  { id: "typography", name: "타이포그래피", slug: "typography", description: "키네틱 타이포, 텍스트 애니메이션", icon: "Captions", serviceCount: 16, parentId: "cg" },
  { id: "3d-modeling", name: "3D 모델링", slug: "3d-modeling", description: "3D 모델링, 렌더링, 건축 시각화", icon: "Box", serviceCount: 32, parentId: "cg" },
  { id: "ar-vr-xr", name: "AR·VR·XR", slug: "ar-vr-xr", description: "증강현실, 가상현실, 확장현실 콘텐츠", icon: "Gamepad2", serviceCount: 8, parentId: "cg" },

  // 애니메이션
  { id: "2d-animation", name: "2D 애니메이션", slug: "2d-animation", description: "캐릭터 애니메이션, 설명 애니메이션", icon: "Layers", serviceCount: 39, parentId: "animation" },
  { id: "3d-animation", name: "3D 애니메이션", slug: "3d-animation", description: "3D 캐릭터, 시네마틱, 제품 3D", icon: "Box", serviceCount: 28, parentId: "animation" },
  { id: "whiteboard", name: "화이트보드 애니메이션", slug: "whiteboard", description: "화이트보드 드로잉 스타일 애니메이션", icon: "FileText", serviceCount: 15, parentId: "animation" },
  { id: "lottie-web", name: "로티·web 애니메이션", slug: "lottie-web", description: "Lottie, CSS, SVG 웹 애니메이션", icon: "Flame", serviceCount: 16, parentId: "animation" },

  // AI 콘텐츠
  { id: "ai-video", name: "AI 영상", slug: "ai-video", description: "Sora, Runway 등 AI 영상 생성, 아바타, 립싱크", icon: "Sparkles", serviceCount: 76, parentId: "ai-content" },
  { id: "ai-image", name: "AI 이미지", slug: "ai-image", description: "AI 이미지 생성, 편집, 스타일 변환", icon: "Wand2", serviceCount: 34, parentId: "ai-content" },
  { id: "ai-audio", name: "AI 음향", slug: "ai-audio", description: "AI 음성 합성, AI 배경음악 생성", icon: "Mic", serviceCount: 14, parentId: "ai-content" },

  // 사진
  { id: "product-photo", name: "제품·홍보 사진", slug: "product-photo", description: "제품 촬영, 홍보 사진, 음식 사진", icon: "ShoppingBag", serviceCount: 32, parentId: "photo" },
  { id: "profile-photo", name: "개인·프로필 사진", slug: "profile-photo", description: "프로필, 증명사진, 스냅 포트레이트", icon: "UserCircle", serviceCount: 24, parentId: "photo" },
  { id: "event-snap", name: "이벤트 스냅", slug: "event-snap", description: "행사, 웨딩, 돌잔치 스냅 촬영", icon: "Heart", serviceCount: 18, parentId: "photo" },
  { id: "photo-edit", name: "사진 보정", slug: "photo-edit", description: "색보정, 리터칭, 합성, 복원", icon: "Palette", serviceCount: 13, parentId: "photo" },

  // 음향
  { id: "voice-actor", name: "성우", slug: "voice-actor", description: "내레이션, 더빙, 광고 성우", icon: "Mic", serviceCount: 28, parentId: "audio" },
  { id: "music", name: "음악·음원", slug: "music", description: "작곡, 편곡, BGM, 음원 제작", icon: "Music", serviceCount: 25, parentId: "audio" },
  { id: "audio-content", name: "오디오 콘텐츠", slug: "audio-content", description: "팟캐스트, ASMR, 오디오북", icon: "Volume2", serviceCount: 12, parentId: "audio" },
  { id: "audio-engineering", name: "오디오 엔지니어링", slug: "audio-engineering", description: "믹싱, 마스터링, 사운드 디자인", icon: "Volume2", serviceCount: 18, parentId: "audio" },
  { id: "audio-etc", name: "기타 음향·음악", slug: "audio-etc", description: "효과음, 징글, 기타 음향", icon: "Music", serviceCount: 10, parentId: "audio" },

  // 엔터테이너
  { id: "model", name: "모델", slug: "model", description: "광고 모델, 피팅 모델, 핸드 모델", icon: "UserCircle", serviceCount: 15, parentId: "entertainer" },
  { id: "actor", name: "배우", slug: "actor", description: "광고 배우, 단역, 엑스트라", icon: "Film", serviceCount: 10, parentId: "entertainer" },
  { id: "show-host", name: "쇼호스트", slug: "show-host", description: "라이브커머스, 홈쇼핑 호스트", icon: "ShoppingCart", serviceCount: 8, parentId: "entertainer" },
  { id: "mc", name: "MC", slug: "mc", description: "행사 MC, 사회자, 진행자", icon: "Mic", serviceCount: 7, parentId: "entertainer" },
  { id: "performance", name: "공연", slug: "performance", description: "공연 기획, 무대 연출", icon: "Music", serviceCount: 5, parentId: "entertainer" },

  // 기타
  { id: "storyboard", name: "콘티·스토리보드", slug: "storyboard", description: "영상 기획, 콘티, 스토리보드, 대본", icon: "FileText", serviceCount: 18, parentId: "etc" },
  { id: "hair-makeup", name: "헤어메이크업", slug: "hair-makeup", description: "촬영용 헤어, 메이크업, 스타일링", icon: "Sparkle", serviceCount: 8, parentId: "etc" },
  { id: "studio-rental", name: "스튜디오 렌탈", slug: "studio-rental", description: "촬영 스튜디오, 장비 렌탈", icon: "Building", serviceCount: 6, parentId: "etc" },
  { id: "other", name: "기타 영상·사진·음향", slug: "other", description: "기타 영상/사진/음향 관련 서비스", icon: "LayoutGrid", serviceCount: 6, parentId: "etc" },
];

// 전체 카테고리 (대분류 + 소분류)
export const categories: Category[] = [
  ...mainCategories.map((cat) => ({
    ...cat,
    children: subCategories.filter((sub) => sub.parentId === cat.id),
  })),
];

// 모든 카테고리 (flat)
export const allCategories: Category[] = [...mainCategories, ...subCategories];

export function getCategoryBySlug(slug: string): Category | undefined {
  return allCategories.find((c) => c.slug === slug);
}

export function getCategoryById(id: string): Category | undefined {
  return allCategories.find((c) => c.id === id);
}

export function getSubcategories(parentId: string): Category[] {
  return subCategories.filter((c) => c.parentId === parentId);
}
