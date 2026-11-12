# AI 마켓플랫폼 공개 테스트 운영판

`27 - AI마켓플랫폼`은 고객이 AI 영상/콘텐츠 전문가를 찾고, 플랫폼 메시지 안에서 협의한 뒤, 합의견적을 주문과 테스트 결제로 전환하는 Next.js 기반 마켓플레이스입니다.

## 공개 테스트 원칙

- 공개 테스트 기간에는 실결제와 실정산을 하지 않습니다.
- `NEXT_PUBLIC_PAYMENT_MODE=test`를 유지하고 PortOne 테스트 채널만 사용합니다.
- 고객과 프리랜서는 전화/카톡 전환이 아니라 플랫폼 메시지와 첨부파일로 요구사항, 금액, 납기, 수정 범위를 협의합니다.
- 주문 생성 기준은 서비스 패키지 직접 주문 또는 대화방 안의 합의견적 수락입니다.

## 핵심 플로우

1. 고객이 서비스 상세에서 `문의하기`를 누르면 `/api/conversations/start`가 대화방을 만들고 첫 메시지를 저장합니다.
2. 프리랜서는 메시지 화면에서 금액, 작업 범위, 납기, 수정 횟수를 담은 합의견적을 제안합니다.
3. 고객이 합의견적을 수락하면 서버가 `deal_offers`를 `accepted`로 바꾸고 주문을 생성합니다.
4. `/order/{orderId}`에서 기존 주문 금액 그대로 PortOne 테스트 결제를 진행합니다.
5. 공개 견적요청도 프리랜서 응답 수락 시 같은 대화방, 합의견적, 주문 생성 흐름으로 합류합니다.

## 환경변수

`.env.local.example`을 기준으로 설정합니다.

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Supabase DB 적용: `SUPABASE_DB_URL` (로컬/배포 환경변수에만 보관)
- PortOne 테스트 결제: `NEXT_PUBLIC_PORTONE_STORE_ID`, `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`, `PORTONE_API_SECRET`, `PORTONE_WEBHOOK_SECRET`
- 공개 테스트 고정: `NEXT_PUBLIC_PAYMENT_MODE=test`
- 운영 URL: `NEXT_PUBLIC_APP_URL`
- Cron 보호: `CRON_SECRET`
- 관측/알림: `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_SENTRY_DSN` 또는 `SENTRY_DSN`, `RESEND_API_KEY`

`/api/health`는 DB, 필수 env, 결제 테스트 모드, GA/Sentry/Resend 연결 상태를 반환합니다.

## DB 적용 순서

새 Supabase 프로젝트에서는 기준 스키마와 마이그레이션을 같은 순서로 적용합니다.

1. `supabase/schema.sql`
2. 필요한 경우 `supabase/migration_v2.sql`, `supabase/migration_v3_nofts.sql`, `supabase/migration_v3_patch.sql`
3. `supabase/migrations/*.sql` timestamp 순서

주요 보강:

- `conversations.quote_request_id`
- `messages.message_type`의 `deal_offer`, `system`
- `deal_offers` 테이블과 RLS
- `orders.deal_offer_id`
- Realtime publication idempotent 처리

## 개발 및 검증

```bash
npm run dev
npm run type-check
npm run lint
npm run build
npm run test
npm run test:e2e
npm run check:remote
npm run test:flow
npm run audit
npm run db:rehearse:fresh
npm run verify:preopen
npm run verify:100
```

외부 공개 URL smoke test는 다음처럼 실행합니다.

```bash
PREOPEN_BASE_URL=https://your-public-url.example npm run test:e2e
```

PowerShell:

```powershell
$env:PREOPEN_BASE_URL="https://your-public-url.example"; npm run test:e2e
```

`verify:preopen`은 타입체크, 린트, 빌드, 테스트, smoke test, 프로덕션 의존성 audit를 순서대로 실행합니다.

`db:rehearse:fresh`는 Docker 임시 Postgres에 `supabase/schema.sql`과 `supabase/migrations/*.sql`을 순서대로 적용하고, 공개 테스트 핵심 테이블과 컬럼이 재현되는지 확인합니다. 레거시 v2/v3 SQL까지 포함해 점검해야 하는 경우 다음처럼 실행합니다.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/rehearse-fresh-db.ps1 -IncludeLegacy
```

## 100% 공개 전 게이트

원격 Supabase에 공개 테스트 마이그레이션을 적용합니다.

```powershell
$env:SUPABASE_DB_URL="postgresql://postgres.<project-ref>:<db-password>@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
npm run db:apply:preopen
```

그 다음 공개 URL을 지정하고 100% 게이트를 실행합니다.

```powershell
$env:PREOPEN_BASE_URL="https://your-public-url.example"
npm run verify:100
```

`verify:100`은 기존 품질 게이트에 fresh DB 리허설, 원격 DB 스키마, `/api/health`, 고객-프리랜서 협의, 합의견적 수락, 주문 생성, 납품, 공개 견적 수락 플로우까지 더해 API로 검증합니다.
