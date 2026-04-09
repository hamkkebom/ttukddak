import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'thumbnails');

// 서비스 데이터
const services = [
  { id: "svc-1", name: "새론", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "힐링", "운세"], type: "healing" },
  { id: "svc-2", name: "박건우", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "상담", "홍보"], type: "consulting" },
  { id: "svc-3", name: "여울", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "타로", "운세"], type: "tarot" },
  { id: "svc-4", name: "아이", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "힐링", "소개"], type: "healing" },
  { id: "svc-5", name: "버들", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "기도", "힐링"], type: "prayer" },
  { id: "svc-6", name: "샛별", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "상담", "힐링"], type: "consulting" },
  { id: "svc-7", name: "산다라", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "상담", "기도"], type: "prayer" },
  { id: "svc-8", name: "해솔", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "효심말벗", "상담"], type: "healing" },
  { id: "svc-9", name: "꿈돌", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "기부", "힐링"], type: "healing" },
  { id: "svc-10", name: "늘다온", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "선물", "상담"], type: "consulting" },
  { id: "svc-11", name: "이파", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "타로", "운세"], type: "tarot" },
  { id: "svc-12", name: "온세나래", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "효심", "모집"], type: "healing" },
  { id: "svc-13", name: "밤온", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "선물", "상담"], type: "consulting" },
  { id: "svc-14", name: "달달", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "브랜딩", "소개"], type: "branding" },
  { id: "svc-15", name: "최종일", title: "운세 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "타로", "운세"], type: "tarot" },
  { id: "svc-16", name: "채윤", title: "운세 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "꿈해몽", "고민"], type: "fortune" },
  { id: "svc-17", name: "드림온", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "상담", "꿈해몽"], type: "healing" },
  { id: "svc-18", name: "김소영", title: "운세 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "타로", "운세"], type: "tarot" },
  { id: "svc-19", name: "새벽별", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "기부", "효심"], type: "healing" },
  { id: "svc-20", name: "문상원", title: "운세 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "고민", "상담"], type: "fortune" },
  { id: "svc-21", name: "루다", title: "운세 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "추억", "영상"], type: "fortune" },
  { id: "svc-22", name: "미르길", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "모집", "상담"], type: "healing" },
  { id: "svc-23", name: "누리봄", title: "브랜딩 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "소개", "브랜딩"], type: "branding" },
  { id: "svc-24", name: "초승달", title: "운세 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "고민", "상담"], type: "fortune" },
  { id: "svc-25", name: "빛담은", title: "운세 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "소개", "꿈해몽"], type: "fortune" },
  { id: "svc-26", name: "이다혜", title: "소개 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "소개", "상담"], type: "intro" },
  { id: "svc-27", name: "김현우", title: "힐링 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "소개", "선물"], type: "healing" },
  { id: "svc-28", name: "김찬수", title: "운세 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "띠별운세", "상담"], type: "fortune" },
  { id: "svc-29", name: "심현석", title: "운세 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "고민", "신년운세"], type: "fortune" },
  { id: "svc-30", name: "다솜마루", title: "소개 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "소개", "추억"], type: "intro" },
  { id: "svc-31", name: "온해봄", title: "운세 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "고민", "신년운세"], type: "fortune" },
  { id: "svc-32", name: "잇는길", title: "AI 영상 제작 서비스", category: "AI 영상", tags: ["AI영상", "과제", "영상"], type: "general" },
  { id: "svc-33", name: "이룸", title: "운세 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "소개", "타로"], type: "tarot" },
  { id: "svc-34", name: "이음", title: "소개 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "소개", "상담"], type: "intro" },
  { id: "svc-35", name: "최석진", title: "운세 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "소개", "신년운세"], type: "fortune" },
  { id: "svc-36", name: "사공", title: "소개 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "소개", "상담"], type: "intro" },
  { id: "svc-37", name: "빛난새", title: "브랜딩 AI 영상 제작", category: "AI 영상", tags: ["AI영상", "브랜딩", "퍼스널"], type: "branding" },
];

// 타입별 디자인 테마
const themes = {
  healing: {
    gradients: [
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
      "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
      "linear-gradient(135deg, #96e6a1 0%, #d4fc79 100%)",
    ],
    emoji: "✨",
    subtitle: "마음을 치유하는 영상",
    accent: "#7c3aed",
  },
  consulting: {
    gradients: [
      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    ],
    emoji: "💬",
    subtitle: "전문 상담 영상 제작",
    accent: "#ec4899",
  },
  tarot: {
    gradients: [
      "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
      "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
      "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
      "linear-gradient(135deg, #312e81 0%, #7c3aed 100%)",
    ],
    emoji: "🔮",
    subtitle: "타로 · 운세 영상 전문",
    accent: "#8b5cf6",
  },
  prayer: {
    gradients: [
      "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
      "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
      "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
      "linear-gradient(135deg, #f5af19 0%, #f12711 100%)",
    ],
    emoji: "🙏",
    subtitle: "기도 · 힐링 영상",
    accent: "#f59e0b",
  },
  fortune: {
    gradients: [
      "linear-gradient(135deg, #0c3547 0%, #11998e 100%)",
      "linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)",
      "linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)",
      "linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)",
    ],
    emoji: "⭐",
    subtitle: "운세 · 사주 영상 전문",
    accent: "#06b6d4",
  },
  branding: {
    gradients: [
      "linear-gradient(135deg, #f12711 0%, #f5af19 100%)",
      "linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)",
      "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)",
      "linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)",
    ],
    emoji: "🎯",
    subtitle: "퍼스널 브랜딩 영상",
    accent: "#f97316",
  },
  intro: {
    gradients: [
      "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
      "linear-gradient(135deg, #0061ff 0%, #60efff 100%)",
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "linear-gradient(135deg, #536976 0%, #292E49 100%)",
    ],
    emoji: "👋",
    subtitle: "전문가 소개 영상",
    accent: "#3b82f6",
  },
  general: {
    gradients: [
      "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
      "linear-gradient(135deg, #2af598 0%, #009efd 100%)",
    ],
    emoji: "🎬",
    subtitle: "AI 영상 제작 서비스",
    accent: "#10b981",
  },
};

// 크몽 스타일 디자인 패턴들
const designPatterns = [
  // Pattern 1: 큰 타이포 + 세로선 강조
  (svc, theme, gradient) => `
    <div style="width:800px;height:600px;background:${gradient};display:flex;align-items:center;padding:60px;position:relative;overflow:hidden;font-family:'Pretendard',system-ui,sans-serif;">
      <div style="position:absolute;top:0;right:0;width:50%;height:100%;background:rgba(0,0,0,0.15);"></div>
      <div style="position:absolute;top:40px;right:40px;background:rgba(255,255,255,0.2);backdrop-filter:blur(10px);padding:8px 20px;border-radius:100px;font-size:13px;color:white;font-weight:600;">AI VIDEO</div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:white;opacity:0.3;"></div>
      <div style="z-index:1;">
        <div style="font-size:64px;margin-bottom:16px;">${theme.emoji}</div>
        <div style="width:4px;height:40px;background:white;margin-bottom:24px;border-radius:2px;"></div>
        <h1 style="color:white;font-size:42px;font-weight:800;line-height:1.2;margin:0 0 12px 0;text-shadow:0 2px 20px rgba(0,0,0,0.3);">${svc.name}의<br/>${svc.title}</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:18px;margin:0;font-weight:500;">${theme.subtitle}</p>
        <div style="margin-top:24px;display:flex;gap:8px;">
          ${svc.tags.map(t => `<span style="background:rgba(255,255,255,0.2);color:white;padding:6px 14px;border-radius:100px;font-size:13px;font-weight:500;">#${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `,
  // Pattern 2: 중앙 정렬 + 장식 링
  (svc, theme, gradient) => `
    <div style="width:800px;height:600px;background:${gradient};display:flex;align-items:center;justify-content:center;text-align:center;position:relative;overflow:hidden;font-family:'Pretendard',system-ui,sans-serif;">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:350px;height:350px;border:2px solid rgba(255,255,255,0.15);border-radius:50%;"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:450px;height:450px;border:1px solid rgba(255,255,255,0.08);border-radius:50%;"></div>
      <div style="position:absolute;top:30px;left:30px;right:30px;bottom:30px;border:1px solid rgba(255,255,255,0.1);border-radius:20px;"></div>
      <div style="z-index:1;">
        <div style="font-size:56px;margin-bottom:20px;">${theme.emoji}</div>
        <p style="color:rgba(255,255,255,0.7);font-size:14px;letter-spacing:4px;text-transform:uppercase;margin:0 0 12px 0;font-weight:600;">AI VIDEO CREATION</p>
        <h1 style="color:white;font-size:38px;font-weight:800;line-height:1.3;margin:0 0 8px 0;text-shadow:0 2px 20px rgba(0,0,0,0.2);">${svc.name}의<br/>${svc.title}</h1>
        <p style="color:rgba(255,255,255,0.8);font-size:16px;margin:8px 0 0 0;">${theme.subtitle}</p>
        <div style="margin-top:24px;display:flex;gap:8px;justify-content:center;">
          ${svc.tags.map(t => `<span style="background:rgba(255,255,255,0.15);color:white;padding:5px 12px;border-radius:100px;font-size:12px;">#${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `,
  // Pattern 3: 우측 블록 + 좌측 텍스트 (크몽 인기 스타일)
  (svc, theme, gradient) => `
    <div style="width:800px;height:600px;background:#0f172a;display:flex;position:relative;overflow:hidden;font-family:'Pretendard',system-ui,sans-serif;">
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:50px 40px 50px 50px;z-index:1;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
          <div style="background:${theme.accent};width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;">${theme.emoji}</div>
          <span style="color:${theme.accent};font-size:13px;font-weight:700;letter-spacing:1px;">AI VIDEO EXPERT</span>
        </div>
        <h1 style="color:white;font-size:36px;font-weight:800;line-height:1.3;margin:0 0 12px 0;">${svc.name}의<br/>${svc.title}</h1>
        <p style="color:#94a3b8;font-size:15px;margin:0 0 24px 0;">${theme.subtitle}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${svc.tags.map(t => `<span style="border:1px solid #334155;color:#94a3b8;padding:5px 12px;border-radius:100px;font-size:12px;">#${t}</span>`).join('')}
        </div>
      </div>
      <div style="width:320px;position:relative;">
        <div style="position:absolute;inset:30px;border-radius:20px;background:${gradient};"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:80px;z-index:1;">${theme.emoji}</div>
      </div>
    </div>
  `,
  // Pattern 4: 미니멀 카드 (심플 크몽 스타일)
  (svc, theme, gradient) => `
    <div style="width:800px;height:600px;background:#ffffff;display:flex;flex-direction:column;position:relative;overflow:hidden;font-family:'Pretendard',system-ui,sans-serif;">
      <div style="flex:1;background:${gradient};position:relative;display:flex;align-items:center;justify-content:center;">
        <div style="font-size:100px;filter:drop-shadow(0 4px 20px rgba(0,0,0,0.2));">${theme.emoji}</div>
        <div style="position:absolute;top:20px;right:20px;background:rgba(0,0,0,0.3);backdrop-filter:blur(10px);padding:6px 16px;border-radius:100px;font-size:12px;color:white;font-weight:600;">AI 영상 전문가</div>
      </div>
      <div style="padding:28px 32px;background:white;">
        <h1 style="color:#1e293b;font-size:28px;font-weight:800;margin:0 0 8px 0;">${svc.name}의 ${svc.title}</h1>
        <p style="color:#64748b;font-size:14px;margin:0 0 14px 0;">${theme.subtitle}</p>
        <div style="display:flex;gap:6px;">
          ${svc.tags.map(t => `<span style="background:#f1f5f9;color:#475569;padding:4px 10px;border-radius:6px;font-size:12px;">#${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `,
];

async function generateThumbnails() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600 });

  // Load Pretendard font
  const fontCSS = `
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
    * { margin: 0; padding: 0; box-sizing: border-box; }
  `;

  for (let i = 0; i < services.length; i++) {
    const svc = services[i];
    const theme = themes[svc.type] || themes.general;
    const gradientIdx = i % theme.gradients.length;
    const gradient = theme.gradients[gradientIdx];
    const patternIdx = i % designPatterns.length;
    const html = designPatterns[patternIdx](svc, theme, gradient);

    const fullHTML = `
      <!DOCTYPE html>
      <html><head>
        <meta charset="utf-8">
        <style>${fontCSS}</style>
      </head><body style="margin:0;padding:0;">${html}</body></html>
    `;

    await page.setContent(fullHTML, { waitUntil: 'domcontentloaded', timeout: 5000 });
    await new Promise(r => setTimeout(r, 500));

    const outputPath = path.join(OUTPUT_DIR, `${svc.id}.jpg`);
    await page.screenshot({ path: outputPath, type: 'jpeg', quality: 90 });
    console.log(`Generated: ${svc.id}.jpg (${svc.name} - pattern ${patternIdx + 1})`);
  }

  await browser.close();
  console.log(`\nDone! ${services.length} thumbnails generated in ${OUTPUT_DIR}`);
}

generateThumbnails().catch(console.error);
