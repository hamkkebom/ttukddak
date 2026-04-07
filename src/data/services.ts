import { Service } from "@/types";

export const services: Service[] = [
  // AI 영상 생성
  {
    id: "svc-1",
    title: "AI로 만드는 프리미엄 뮤직비디오 & 광고 영상",
    description:
      "Sora, Runway, Pika 등 최신 AI 영상 생성 도구를 활용하여 고품질 영상을 제작합니다.\n\n기업 광고, 유튜브 콘텐츠, SNS 숏폼 등 다양한 목적의 영상을 제작해 드립니다.\n\n작업 과정에서 중간 시안을 공유하며, 고객의 피드백을 적극 반영합니다.",
    thumbnail: "https://picsum.photos/seed/svc1/800/600",
    images: [
      "https://picsum.photos/seed/svc1-1/800/600",
      "https://picsum.photos/seed/svc1-2/800/600",
      "https://picsum.photos/seed/svc1-3/800/600",
    ],
    categoryId: "ai-video",
    expertId: "expert-1",
    price: 150000,
    rating: 4.9,
    reviewCount: 87,
    salesCount: 234,
    tags: ["AI영상", "Sora", "광고", "뮤직비디오"],
    isPrime: true,
    isFastResponse: true,
    packages: [
      {
        name: "베이직",
        price: 150000,
        deliveryDays: 7,
        revisions: 2,
        features: ["30초 영상", "HD 화질", "배경음악 포함", "자막 포함"],
      },
      {
        name: "스탠다드",
        price: 300000,
        deliveryDays: 10,
        revisions: 3,
        features: ["1분 영상", "4K 화질", "배경음악 포함", "자막 포함", "효과음 포함"],
      },
      {
        name: "프리미엄",
        price: 500000,
        deliveryDays: 14,
        revisions: 5,
        features: ["2분 영상", "4K 화질", "맞춤 음악", "자막+효과음", "소스파일 제공"],
      },
    ],
    createdAt: "2024-01-15",
  },
  {
    id: "svc-2",
    title: "Runway Gen-3 활용 시네마틱 AI 영상 제작",
    description:
      "Runway Gen-3를 활용한 시네마틱한 AI 영상을 제작합니다.\n\n자연스러운 화면 전환과 고품질 비주얼로 프로페셔널한 결과물을 제공합니다.",
    thumbnail: "https://picsum.photos/seed/svc2/800/600",
    images: [
      "https://picsum.photos/seed/svc2-1/800/600",
      "https://picsum.photos/seed/svc2-2/800/600",
    ],
    categoryId: "ai-video",
    expertId: "expert-1",
    price: 200000,
    rating: 4.85,
    reviewCount: 56,
    salesCount: 178,
    tags: ["Runway", "시네마틱", "AI영상", "프리미엄"],
    isPrime: true,
    isFastResponse: false,
    packages: [
      {
        name: "베이직",
        price: 200000,
        deliveryDays: 7,
        revisions: 2,
        features: ["30초 영상", "4K 화질", "색보정"],
      },
      {
        name: "스탠다드",
        price: 400000,
        deliveryDays: 12,
        revisions: 3,
        features: ["1분 영상", "4K 화질", "색보정", "사운드 디자인"],
      },
      {
        name: "프리미엄",
        price: 700000,
        deliveryDays: 18,
        revisions: 5,
        features: ["3분 영상", "4K 화질", "풀 포스트 프로덕션", "소스파일"],
      },
    ],
    createdAt: "2024-02-10",
  },
  // 모션그래픽
  {
    id: "svc-3",
    title: "브랜드 인트로 & 로고 모션그래픽 제작",
    description:
      "브랜드의 첫인상을 결정하는 로고 모션과 인트로 영상을 제작합니다.\n\nAfter Effects와 Cinema 4D를 활용한 프리미엄 모션그래픽입니다.",
    thumbnail: "https://picsum.photos/seed/svc3/800/600",
    images: [
      "https://picsum.photos/seed/svc3-1/800/600",
      "https://picsum.photos/seed/svc3-2/800/600",
    ],
    categoryId: "motion-graphics",
    expertId: "expert-2",
    price: 100000,
    rating: 4.8,
    reviewCount: 92,
    salesCount: 189,
    tags: ["모션그래픽", "로고", "인트로", "브랜딩"],
    isPrime: true,
    isFastResponse: true,
    packages: [
      {
        name: "베이직",
        price: 100000,
        deliveryDays: 5,
        revisions: 2,
        features: ["5초 로고 모션", "HD 화질", "투명 배경"],
      },
      {
        name: "스탠다드",
        price: 200000,
        deliveryDays: 7,
        revisions: 3,
        features: ["10초 인트로", "4K 화질", "사운드 포함", "3가지 버전"],
      },
      {
        name: "프리미엄",
        price: 350000,
        deliveryDays: 10,
        revisions: 5,
        features: ["15초 인트로", "4K 화질", "맞춤 사운드", "5가지 버전", "소스파일"],
      },
    ],
    createdAt: "2024-01-20",
  },
  // 2D 애니메이션
  {
    id: "svc-4",
    title: "캐릭터 애니메이션 & 설명 영상 제작",
    description:
      "귀여운 캐릭터 애니메이션으로 메시지를 효과적으로 전달합니다.\n\n인포그래픽, 교육, 마케팅 등 다양한 목적에 맞는 2D 애니메이션을 제작합니다.",
    thumbnail: "https://picsum.photos/seed/svc4/800/600",
    images: [
      "https://picsum.photos/seed/svc4-1/800/600",
    ],
    categoryId: "2d-animation",
    expertId: "expert-3",
    price: 180000,
    rating: 4.9,
    reviewCount: 73,
    salesCount: 156,
    tags: ["2D애니메이션", "캐릭터", "설명영상", "인포그래픽"],
    isPrime: false,
    isFastResponse: false,
    packages: [
      {
        name: "베이직",
        price: 180000,
        deliveryDays: 10,
        revisions: 2,
        features: ["30초 영상", "캐릭터 1명", "단순 배경"],
      },
      {
        name: "스탠다드",
        price: 350000,
        deliveryDays: 14,
        revisions: 3,
        features: ["1분 영상", "캐릭터 2명", "상세 배경", "자막"],
      },
      {
        name: "프리미엄",
        price: 600000,
        deliveryDays: 21,
        revisions: 5,
        features: ["2분 영상", "캐릭터 3명", "풀 배경", "나레이션", "소스파일"],
      },
    ],
    createdAt: "2024-03-01",
  },
  // 3D 애니메이션
  {
    id: "svc-5",
    title: "3D 제품 렌더링 & 애니메이션",
    description:
      "Blender와 Cinema 4D를 활용한 포토리얼리스틱 3D 렌더링 및 제품 애니메이션을 제작합니다.\n\n제품 홍보, 앱 소개, 게임 에셋 등에 활용 가능합니다.",
    thumbnail: "https://picsum.photos/seed/svc5/800/600",
    images: [
      "https://picsum.photos/seed/svc5-1/800/600",
      "https://picsum.photos/seed/svc5-2/800/600",
    ],
    categoryId: "3d-animation",
    expertId: "expert-4",
    price: 250000,
    rating: 4.95,
    reviewCount: 45,
    salesCount: 98,
    tags: ["3D", "렌더링", "Blender", "제품영상"],
    isPrime: true,
    isFastResponse: true,
    packages: [
      {
        name: "베이직",
        price: 250000,
        deliveryDays: 10,
        revisions: 2,
        features: ["정지 렌더링 3컷", "4K 해상도", "기본 조명"],
      },
      {
        name: "스탠다드",
        price: 500000,
        deliveryDays: 15,
        revisions: 3,
        features: ["15초 터닝 영상", "4K 해상도", "스튜디오 라이팅", "배경 커스텀"],
      },
      {
        name: "프리미엄",
        price: 900000,
        deliveryDays: 21,
        revisions: 5,
        features: ["30초 풀 애니메이션", "4K", "커스텀 환경", "사운드", "소스파일"],
      },
    ],
    createdAt: "2024-02-15",
  },
  // 유튜브/숏폼
  {
    id: "svc-6",
    title: "유튜브 영상 편집 (자막+효과+썸네일)",
    description:
      "트렌디한 편집 스타일로 조회수를 높여드립니다.\n\n자막, 효과, 음향, 썸네일까지 원스톱으로 제공합니다.\n\n100만 구독자 채널 편집 경험을 바탕으로 최적의 편집을 해드립니다.",
    thumbnail: "https://picsum.photos/seed/svc6/800/600",
    images: [
      "https://picsum.photos/seed/svc6-1/800/600",
    ],
    categoryId: "youtube-shorts",
    expertId: "expert-5",
    price: 50000,
    rating: 4.7,
    reviewCount: 198,
    salesCount: 512,
    tags: ["유튜브", "편집", "숏폼", "썸네일"],
    isPrime: false,
    isFastResponse: true,
    packages: [
      {
        name: "베이직",
        price: 50000,
        deliveryDays: 3,
        revisions: 1,
        features: ["10분 이내 편집", "자막 포함", "효과음"],
      },
      {
        name: "스탠다드",
        price: 100000,
        deliveryDays: 5,
        revisions: 2,
        features: ["20분 이내 편집", "자막+효과", "썸네일 1개", "음향 보정"],
      },
      {
        name: "프리미엄",
        price: 200000,
        deliveryDays: 7,
        revisions: 3,
        features: ["30분 이내 편집", "풀 효과", "썸네일 3개", "음향+색보정", "인트로"],
      },
    ],
    createdAt: "2024-01-05",
  },
  // 제품/광고
  {
    id: "svc-7",
    title: "제품 홍보 영상 & 바이럴 광고 제작",
    description:
      "제품의 매력을 극대화하는 광고 영상을 제작합니다.\n\n소셜미디어, TV, 유튜브 등 다양한 플랫폼에 최적화된 영상을 제공합니다.",
    thumbnail: "https://picsum.photos/seed/svc7/800/600",
    images: [
      "https://picsum.photos/seed/svc7-1/800/600",
      "https://picsum.photos/seed/svc7-2/800/600",
    ],
    categoryId: "product-ad",
    expertId: "expert-6",
    price: 200000,
    rating: 4.8,
    reviewCount: 67,
    salesCount: 145,
    tags: ["광고", "제품홍보", "바이럴", "마케팅"],
    isPrime: true,
    isFastResponse: false,
    packages: [
      {
        name: "베이직",
        price: 200000,
        deliveryDays: 7,
        revisions: 2,
        features: ["15초 광고", "HD 화질", "기본 효과"],
      },
      {
        name: "스탠다드",
        price: 400000,
        deliveryDays: 10,
        revisions: 3,
        features: ["30초 광고", "4K 화질", "모션그래픽", "나레이션"],
      },
      {
        name: "프리미엄",
        price: 800000,
        deliveryDays: 14,
        revisions: 5,
        features: ["1분 광고", "4K 화질", "풀 프로덕션", "A/B 버전", "소스파일"],
      },
    ],
    createdAt: "2024-02-20",
  },
  // 기업/IR
  {
    id: "svc-8",
    title: "기업 소개 & IR 프레젠테이션 영상",
    description:
      "기업의 비전과 가치를 효과적으로 전달하는 소개 영상을 제작합니다.\n\nIR 자료, 채용 영상, 사내 교육 등 다양한 기업 영상 제작이 가능합니다.",
    thumbnail: "https://picsum.photos/seed/svc8/800/600",
    images: [
      "https://picsum.photos/seed/svc8-1/800/600",
    ],
    categoryId: "corporate",
    expertId: "expert-7",
    price: 300000,
    rating: 4.85,
    reviewCount: 34,
    salesCount: 87,
    tags: ["기업", "IR", "프레젠테이션", "소개영상"],
    isPrime: false,
    isFastResponse: false,
    packages: [
      {
        name: "베이직",
        price: 300000,
        deliveryDays: 10,
        revisions: 2,
        features: ["1분 영상", "4K 화질", "기본 모션"],
      },
      {
        name: "스탠다드",
        price: 600000,
        deliveryDays: 14,
        revisions: 3,
        features: ["3분 영상", "4K 화질", "인포그래픽", "나레이션"],
      },
      {
        name: "프리미엄",
        price: 1200000,
        deliveryDays: 21,
        revisions: 5,
        features: ["5분 영상", "4K 화질", "풀 프로덕션", "한/영 자막", "소스파일"],
      },
    ],
    createdAt: "2024-03-05",
  },
  // 뮤직비디오
  {
    id: "svc-9",
    title: "인디 뮤직비디오 & 라이브 영상 편집",
    description:
      "음악에 시각적 스토리를 입히는 뮤직비디오를 제작합니다.\n\nAI 기술과 전통적인 편집 기법을 결합한 창의적인 영상을 만듭니다.",
    thumbnail: "https://picsum.photos/seed/svc9/800/600",
    images: [
      "https://picsum.photos/seed/svc9-1/800/600",
    ],
    categoryId: "music-video",
    expertId: "expert-8",
    price: 300000,
    rating: 4.75,
    reviewCount: 28,
    salesCount: 67,
    tags: ["뮤직비디오", "인디", "라이브", "음악"],
    isPrime: true,
    isFastResponse: false,
    packages: [
      {
        name: "베이직",
        price: 300000,
        deliveryDays: 14,
        revisions: 2,
        features: ["3분 이내", "HD 화질", "색보정"],
      },
      {
        name: "스탠다드",
        price: 600000,
        deliveryDays: 21,
        revisions: 3,
        features: ["5분 이내", "4K 화질", "색보정", "VFX 기본"],
      },
      {
        name: "프리미엄",
        price: 1000000,
        deliveryDays: 30,
        revisions: 5,
        features: ["제한 없음", "4K 화질", "풀 VFX", "AI 영상 결합", "소스파일"],
      },
    ],
    createdAt: "2024-02-01",
  },
  // 웨딩/이벤트
  {
    id: "svc-10",
    title: "시네마틱 웨딩 & 이벤트 하이라이트 영상",
    description:
      "인생에서 가장 아름다운 순간을 시네마틱하게 담아드립니다.\n\n웨딩, 돌잔치, 기념일 등 특별한 날의 하이라이트 영상을 제작합니다.",
    thumbnail: "https://picsum.photos/seed/svc10/800/600",
    images: [
      "https://picsum.photos/seed/svc10-1/800/600",
    ],
    categoryId: "wedding-event",
    expertId: "expert-9",
    price: 200000,
    rating: 4.9,
    reviewCount: 89,
    salesCount: 203,
    tags: ["웨딩", "이벤트", "시네마틱", "하이라이트"],
    isPrime: false,
    isFastResponse: true,
    packages: [
      {
        name: "베이직",
        price: 200000,
        deliveryDays: 7,
        revisions: 2,
        features: ["3분 하이라이트", "HD 화질", "배경음악"],
      },
      {
        name: "스탠다드",
        price: 400000,
        deliveryDays: 10,
        revisions: 3,
        features: ["5분 하이라이트", "4K 화질", "맞춤 음악", "자막"],
      },
      {
        name: "프리미엄",
        price: 700000,
        deliveryDays: 14,
        revisions: 5,
        features: ["풀 영상+하이라이트", "4K 화질", "드론 편집", "인스타 버전", "소스파일"],
      },
    ],
    createdAt: "2024-01-25",
  },
  // 교육
  {
    id: "svc-11",
    title: "온라인 강의 & 교육 콘텐츠 영상 제작",
    description:
      "복잡한 개념을 쉽고 재미있게 전달하는 교육 영상을 제작합니다.\n\n온라인 강의, e-Learning, 설명 영상 등 교육 목적에 최적화된 영상을 만듭니다.",
    thumbnail: "https://picsum.photos/seed/svc11/800/600",
    images: [
      "https://picsum.photos/seed/svc11-1/800/600",
    ],
    categoryId: "education",
    expertId: "expert-10",
    price: 150000,
    rating: 4.85,
    reviewCount: 76,
    salesCount: 178,
    tags: ["교육", "강의", "e-Learning", "설명영상"],
    isPrime: true,
    isFastResponse: true,
    packages: [
      {
        name: "베이직",
        price: 150000,
        deliveryDays: 7,
        revisions: 2,
        features: ["5분 이내", "HD 화질", "자막", "기본 그래픽"],
      },
      {
        name: "스탠다드",
        price: 300000,
        deliveryDays: 10,
        revisions: 3,
        features: ["10분 이내", "4K 화질", "애니메이션", "나레이션"],
      },
      {
        name: "프리미엄",
        price: 500000,
        deliveryDays: 14,
        revisions: 5,
        features: ["20분 이내", "4K 화질", "인터랙티브 요소", "퀴즈 삽입", "소스파일"],
      },
    ],
    createdAt: "2024-01-30",
  },
  // Additional services for more variety
  {
    id: "svc-12",
    title: "숏폼 콘텐츠 제작 (릴스/틱톡/쇼츠)",
    description:
      "트렌디한 숏폼 콘텐츠를 제작합니다.\n\n인스타 릴스, 틱톡, 유튜브 쇼츠에 최적화된 세로형 영상을 만들어드립니다.",
    thumbnail: "https://picsum.photos/seed/svc12/800/600",
    images: [
      "https://picsum.photos/seed/svc12-1/800/600",
    ],
    categoryId: "youtube-shorts",
    expertId: "expert-5",
    price: 30000,
    rating: 4.65,
    reviewCount: 156,
    salesCount: 423,
    tags: ["숏폼", "릴스", "틱톡", "쇼츠"],
    isPrime: false,
    isFastResponse: true,
    packages: [
      {
        name: "베이직",
        price: 30000,
        deliveryDays: 2,
        revisions: 1,
        features: ["60초 이내", "HD 화질", "자막"],
      },
      {
        name: "스탠다드",
        price: 60000,
        deliveryDays: 3,
        revisions: 2,
        features: ["60초 이내", "4K 화질", "자막+효과", "음향"],
      },
      {
        name: "프리미엄",
        price: 100000,
        deliveryDays: 5,
        revisions: 3,
        features: ["3개 영상", "4K 화질", "풀 효과", "트렌드 음악", "A/B 버전"],
      },
    ],
    createdAt: "2024-03-10",
  },
];

export function getServiceById(id: string): Service | undefined {
  return services.find((s) => s.id === id);
}

export function getServicesByCategory(categoryId: string): Service[] {
  return services.filter((s) => s.categoryId === categoryId);
}

export function getServicesByExpert(expertId: string): Service[] {
  return services.filter((s) => s.expertId === expertId);
}

export function searchServices(query: string): Service[] {
  const lower = query.toLowerCase();
  return services.filter(
    (s) =>
      s.title.toLowerCase().includes(lower) ||
      s.description.toLowerCase().includes(lower) ||
      s.tags.some((t) => t.toLowerCase().includes(lower))
  );
}
