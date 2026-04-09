"""
Generate marketplace-style thumbnails with:
1. AI-generated work sample image (Gemini 3.1 Flash Image)
2. Text overlay with category + hook phrase (Pillow)
3. Gradient overlay + badge styling
"""
from google import genai
from google.genai import types
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import io, os, time, sys

API_KEY = "***GEMINI_API_KEY_REMOVED***"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "thumbnails")
W, H = 800, 450

FONT_BOLD = "C:/Windows/Fonts/NanumGothicExtraBold.ttf"
FONT_REGULAR = "C:/Windows/Fonts/NanumGothicBold.ttf"

client = genai.Client(api_key=API_KEY)

BASE = "High quality screenshot from a professionally produced AI-generated video. Cinematic 16:9 ratio. No text, no watermark, no UI elements, no letters."

# Each service: AI image prompt + overlay text
SERVICES = [
    # === AI 영상 생성 ===
    {"file": "svc-1.jpg", "category": "AI 제품광고", "hook": "프리미엄 퀄리티",
     "prompt": f"A frame from an AI-generated product commercial: sleek wireless earbuds floating with dynamic neon light trails and particle effects, dark studio background, ultra-modern product visualization. {BASE}"},

    {"file": "svc-2.jpg", "category": "AI 패션영상", "hook": "트렌드 콘텐츠",
     "prompt": f"A frame from an AI-generated fashion video: a model on a futuristic neon-lit runway with holographic shifting clothes, cyberpunk fashion show atmosphere, crowd in background. {BASE}"},

    {"file": "svc-3.jpg", "category": "AI 부동산투어", "hook": "공간을 영상으로",
     "prompt": f"A frame from an AI-generated real estate video: luxury modern apartment interior with floor-to-ceiling windows showing city skyline at golden hour, warm ambient lighting, architectural visualization. {BASE}"},

    {"file": "svc-4.jpg", "category": "AI 푸드광고", "hook": "맛있는 영상",
     "prompt": f"A frame from an AI-generated food commercial: gourmet Korean BBQ in dramatic slow-motion with sizzling meat on a grill, rising steam and dynamic sauce splash, dark moody food photography. {BASE}"},

    {"file": "svc-5.jpg", "category": "AI 여행영상", "hook": "시네마틱 여행",
     "prompt": f"A frame from an AI-generated travel video: aerial drone shot of stunning coastal cliffs with turquoise ocean, white sand beach, dramatic sunset, cinematic travel content. {BASE}"},

    # === AI 아바타 / 립싱크 ===
    {"file": "svc-6.jpg", "category": "AI 아바타", "hook": "가상 프레젠터",
     "prompt": f"A frame from an AI avatar video: a photorealistic AI-generated female presenter in professional studio, clean modern background with subtle blue graphics, corporate presentation, looking at camera. {BASE}"},

    {"file": "svc-7.jpg", "category": "AI 립싱크", "hook": "자연스러운 AI",
     "prompt": f"A frame from an AI lipsync video: a friendly AI-generated male character speaking naturally in a modern bright office setting, warm educational atmosphere, eye contact with camera. {BASE}"},

    # === 유튜브 편집 ===
    {"file": "svc-8.jpg", "category": "게임 하이라이트", "hook": "유튜브 편집",
     "prompt": f"A frame from an AI-enhanced YouTube gaming video: epic FPS game moment with dramatic camera angle, vibrant color grading, dynamic motion blur and lens flare, esports energy. {BASE}"},

    {"file": "svc-9.jpg", "category": "테크 리뷰", "hook": "유튜브 편집",
     "prompt": f"A frame from a tech review YouTube video: latest smartphone on a clean minimal desk with holographic spec data floating around it, professional tech reviewer aesthetic, bright lighting. {BASE}"},

    {"file": "svc-10.jpg", "category": "쿠킹 채널", "hook": "유튜브 편집",
     "prompt": f"A frame from a YouTube cooking video: overhead shot of beautiful Korean dishes being plated, steam rising, ingredients artfully arranged around, warm kitchen lighting, food ASMR quality. {BASE}"},

    # === 숏폼 ===
    {"file": "svc-11.jpg", "category": "숏폼 제작", "hook": "릴스·쇼츠",
     "prompt": f"A frame from a trendy short-form video: dynamic outfit transition freeze-frame with sparkle effects and colorful background, fashion content creator aesthetic, vibrant and eye-catching. {BASE}"},

    {"file": "svc-12.jpg", "category": "숏폼 제작", "hook": "바이럴 콘텐츠",
     "prompt": f"A frame from a viral TikTok video: person doing an amazing dance move captured mid-air with neon light trails, club atmosphere with LED lights, energetic and dynamic. {BASE}"},

    # === 모션그래픽 ===
    {"file": "svc-13.jpg", "category": "모션그래픽", "hook": "인포그래픽",
     "prompt": f"A frame from a motion graphics explainer: colorful isometric 3D infographic showing business data with animated charts morphing into shapes, modern flat design, teal and orange accents. {BASE}"},

    {"file": "svc-14.jpg", "category": "로고 애니메이션", "hook": "모션그래픽",
     "prompt": f"A frame from a logo animation reveal: minimalist geometric logo mid-transformation with liquid gold metal effect, dark elegant background, sleek premium brand reveal moment. {BASE}"},

    # === 제품 광고 ===
    {"file": "svc-15.jpg", "category": "화장품 광고", "hook": "AI 제품영상",
     "prompt": f"A frame from a cosmetics commercial: luxury skincare bottle with water droplets and golden light rays, floating flower petals, premium beauty advertising, soft pink and gold palette. {BASE}"},

    {"file": "svc-16.jpg", "category": "자동차 광고", "hook": "AI 제품영상",
     "prompt": f"A frame from a car commercial: sleek electric vehicle driving through futuristic city tunnel with blue LED light strips, reflective wet road, premium automotive advertising style. {BASE}"},

    {"file": "svc-17.jpg", "category": "스니커즈 광고", "hook": "AI 제품영상",
     "prompt": f"A frame from a sneaker commercial: brand new sneaker exploding with colorful paint splashes and dynamic particles, dark background, hype streetwear product launch. {BASE}"},

    # === 3D / CG ===
    {"file": "svc-18.jpg", "category": "건축 시각화", "hook": "3D 렌더링",
     "prompt": f"A frame from an architectural visualization: stunning modern glass house on hillside at dusk with interior lights glowing, photorealistic 3D render, dramatic landscape. {BASE}"},

    {"file": "svc-19.jpg", "category": "3D 캐릭터", "hook": "CG 애니메이션",
     "prompt": f"A frame from a 3D character animation: cute stylized 3D character (Pixar-like) waving hello in a colorful fantasy world, vibrant lighting, animated movie quality render. {BASE}"},

    # === 기업 홍보 ===
    {"file": "svc-20.jpg", "category": "기업 홍보", "hook": "브랜딩 영상",
     "prompt": f"A frame from a startup pitch video: modern open office with diverse team collaborating, holographic displays, bright optimistic lighting, corporate culture promotional video. {BASE}"},

    {"file": "svc-21.jpg", "category": "병원 홍보", "hook": "브랜딩 영상",
     "prompt": f"A frame from a hospital promotional video: modern bright medical facility interior with clean design, soft blue and white tones, professional healthcare environment. {BASE}"},

    # === 뮤직비디오 ===
    {"file": "svc-22.jpg", "category": "뮤직비디오", "hook": "AI 뮤직비디오",
     "prompt": f"A frame from a K-pop style music video: dramatic solo performer shot with volumetric colored stage lighting, LED wall showing abstract visuals, concert production quality, purple pink lights. {BASE}"},

    {"file": "svc-23.jpg", "category": "뮤직 비주얼", "hook": "AI 뮤직비디오",
     "prompt": f"A frame from a lo-fi music visualizer video: cozy anime-style room at night with city view through window, warm desk lamp glow, cat on desk, rain on window, chill aesthetic. {BASE}"},

    # === 웨딩/이벤트 ===
    {"file": "svc-24.jpg", "category": "웨딩 영상", "hook": "특별한 순간",
     "prompt": f"A frame from a wedding highlight film: beautiful outdoor garden ceremony with flower arch, soft bokeh fairy lights, romantic golden hour, dreamy cinematic wedding look. {BASE}"},

    {"file": "svc-25.jpg", "category": "이벤트 영상", "hook": "특별한 순간",
     "prompt": f"A frame from a birthday celebration video: magical party scene with floating balloons, confetti mid-air, beautiful cake with sparklers, joyful festive warm lighting. {BASE}"},

    # === 교육 ===
    {"file": "svc-26.jpg", "category": "교육 콘텐츠", "hook": "AI 교육영상",
     "prompt": f"A frame from a science education video: beautiful visualization of the solar system with detailed planets orbiting, nebula background, cinematic space documentary quality. {BASE}"},

    {"file": "svc-27.jpg", "category": "다큐멘터리", "hook": "AI 교육영상",
     "prompt": f"A frame from a historical documentary: ancient Korean Joseon dynasty palace scene in photorealistic CGI, hanbok-wearing figures in courtyard, historical reconstruction. {BASE}"},

    # === SNS / 바이럴 ===
    {"file": "svc-28.jpg", "category": "카페 리뷰", "hook": "SNS 콘텐츠",
     "prompt": f"A frame from a cafe review video: beautiful latte art being poured in slow motion at a trendy Korean cafe, aesthetic warm interior background, Instagram-worthy. {BASE}"},

    {"file": "svc-29.jpg", "category": "반려동물", "hook": "SNS 콘텐츠",
     "prompt": f"A frame from a pet content video: adorable golden retriever puppy looking at camera with tilted head in sunny park, shallow depth of field, viral cute animal quality. {BASE}"},

    # === 인테리어 ===
    {"file": "svc-30.jpg", "category": "인테리어 투어", "hook": "공간 시각화",
     "prompt": f"A frame from an interior design walkthrough: Scandinavian living room with natural wood, white walls, large plants, morning sunlight through windows, virtual staging quality. {BASE}"},

    # === 애니메이션 ===
    {"file": "svc-31.jpg", "category": "애니메이션", "hook": "AI 애니영상",
     "prompt": f"A frame from an anime-style short film: a girl on a rooftop looking at spectacular sunset over Japanese city skyline, Makoto Shinkai inspired vivid sky colors, emotional. {BASE}"},

    {"file": "svc-32.jpg", "category": "키즈 애니", "hook": "AI 애니영상",
     "prompt": f"A frame from children's animation: colorful cartoon animals having a picnic in whimsical forest, bright cheerful colors, rounded friendly art style, kids content. {BASE}"},

    # === 게임 / VFX ===
    {"file": "svc-33.jpg", "category": "게임 트레일러", "hook": "VFX 영상",
     "prompt": f"A frame from a game cinematic trailer: armored fantasy warrior facing a massive dragon on cliff edge, epic scale, dramatic storm clouds, AAA game trailer quality. {BASE}"},

    {"file": "svc-34.jpg", "category": "VFX 합성", "hook": "VFX 영상",
     "prompt": f"A frame from a VFX breakdown: city scene split-screen showing raw footage on left and completed VFX with explosions and debris on right, before-after comparison. {BASE}"},

    # === 피트니스 ===
    {"file": "svc-35.jpg", "category": "피트니스 영상", "hook": "라이프스타일",
     "prompt": f"A frame from a fitness video: athletic person mid-workout in modern gym with dramatic side lighting, sweat visible, motivational sports aesthetic, warm orange tones. {BASE}"},

    # === AI 포토 ===
    {"file": "svc-36.jpg", "category": "AI 화보촬영", "hook": "AI 포토",
     "prompt": f"A frame from an AI fashion photography shoot: stunning editorial portrait with creative artistic makeup and dramatic studio lighting, high-fashion magazine cover quality. {BASE}"},

    # === 팟캐스트 ===
    {"file": "svc-37.jpg", "category": "팟캐스트", "hook": "오디오 콘텐츠",
     "prompt": f"A frame from a podcast studio video: professional podcast setup with two condenser microphones, warm ambient lighting, sound wave visualizations, cozy recording atmosphere. {BASE}"},
]


def add_text_overlay(img, category, hook):
    """Add marketplace-style text overlay to thumbnail."""
    draw = ImageDraw.Draw(img)
    w, h = img.size

    # --- Bottom gradient overlay ---
    gradient = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(gradient)
    for y in range(h // 3, h):
        alpha = int(200 * ((y - h // 3) / (h - h // 3)) ** 1.5)
        gdraw.rectangle([(0, y), (w, y + 1)], fill=(0, 0, 0, min(alpha, 200)))
    img = Image.alpha_composite(img.convert("RGBA"), gradient)
    draw = ImageDraw.Draw(img)

    # --- Category badge (top-left) ---
    try:
        font_badge = ImageFont.truetype(FONT_BOLD, 18)
    except:
        font_badge = ImageFont.load_default()

    badge_text = f"  {category}  "
    bbox = font_badge.getbbox(badge_text)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]

    # Badge background
    badge_x, badge_y = 20, 20
    badge_rect = [(badge_x, badge_y), (badge_x + bw + 16, badge_y + bh + 12)]

    # Rounded rectangle for badge
    badge_bg = Image.new("RGBA", img.size, (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(badge_bg)
    bdraw.rounded_rectangle(badge_rect, radius=6, fill=(255, 107, 0, 230))
    img = Image.alpha_composite(img, badge_bg)
    draw = ImageDraw.Draw(img)
    draw.text((badge_x + 8, badge_y + 5), badge_text.strip(), fill="white", font=font_badge)

    # --- Main hook text (bottom-left) ---
    try:
        font_hook = ImageFont.truetype(FONT_BOLD, 32)
        font_sub = ImageFont.truetype(FONT_REGULAR, 16)
    except:
        font_hook = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    # Hook text
    draw.text((28, h - 80), hook, fill="white", font=font_hook,
              stroke_width=2, stroke_fill=(0, 0, 0, 180))

    # Sub text
    draw.text((30, h - 42), "AI 영상 제작 서비스", fill=(255, 255, 255, 200), font=font_sub)

    return img.convert("RGB")


def generate_and_save(svc, index):
    """Generate AI image + add text overlay + save."""
    filepath = os.path.join(OUTPUT_DIR, svc["file"])

    try:
        response = client.models.generate_content(
            model='gemini-3.1-flash-image-preview',
            contents=svc["prompt"],
            config=types.GenerateContentConfig(
                response_modalities=['TEXT', 'IMAGE']
            )
        )

        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                img_data = part.inline_data.data
                img = Image.open(io.BytesIO(img_data))
                img = img.resize((W, H), Image.LANCZOS)
                img = add_text_overlay(img, svc["category"], svc["hook"])
                img.save(filepath, "JPEG", quality=90)
                fsize = os.path.getsize(filepath)
                print(f"[{index}/37] OK {svc['file']} ({fsize//1024}KB)", flush=True)
                return True

        print(f"[{index}/37] FAIL {svc['file']} - No image", flush=True)
        return False

    except Exception as e:
        print(f"[{index}/37] FAIL {svc['file']} - {e}", flush=True)
        return False


if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    start_from = 1
    for arg in sys.argv[1:]:
        if arg.startswith("--start="):
            start_from = int(arg.split("=")[1])

    success = 0
    failed = 0

    for i, svc in enumerate(SERVICES, 1):
        if i < start_from:
            continue
        if generate_and_save(svc, i):
            success += 1
        else:
            failed += 1
        if i < len(SERVICES):
            time.sleep(2)

    print(f"\nDone! Success: {success}, Failed: {failed}", flush=True)
