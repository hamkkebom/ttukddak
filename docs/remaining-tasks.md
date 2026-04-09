# 뚝딱(TTUKDDAK) 잔여 작업 기획서

---

## 1. 문서 개요

| 항목 | 내용 |
|------|------|
| **작성일** | 2026년 4월 9일 |
| **작성 목적** | Phase 1~5 완료 후 코드베이스 전수 감사 결과 기반, 프로덕션 출시 전 잔여 작업 정의 |
| **감사 범위** | API 라우트 37개, 페이지 40+개, DB 함수 50+개, 컴포넌트 전체 |

---

## 2. 완료 현황 요약

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 1 | 보안, 결제, 파일 업로드, 인증, 법적 페이지 | ✅ |
| Phase 2 | 실시간 메시징, 알림, 납품, 패키지, 리뷰 | ✅ |
| Phase 3 | Admin 대시보드, 정산, 서비스 승인 | ✅ |
| Phase 4 | 견적 응답, 즐겨찾기 DB, 검색 강화, 네이버 OAuth | ✅ |
| Phase 5 | 쿠폰, 기술 부채 정리, 이벤트/고객지원 | ✅ |
| 스키마 정합성 | DB 컬럼명 전체 교정 (v4~v8 마이그레이션 적용) | ✅ |

---

## 3. 잔여 작업 분류

### 심각도 정의

| 등급 | 의미 | 기준 |
|------|------|------|
| 🔴 Critical | 프로덕션 차단 | 보안 취약점, 데이터 무결성 위반, 런타임 에러 |
| 🟡 Important | 출시 전 권장 | UX 결함, 스텁 기능, 성능 문제 |
| 🟢 Nice to have | 출시 후 개선 | 코드 정리, SEO 최적화, 편의 기능 |

---

## 4. 🔴 Critical — 프로덕션 차단 항목

### 4-1. API 인증/인가 누락 (최우선)

현재 다수의 API 라우트에 인증 검사가 없어, 누구나 데이터를 생성/수정/삭제할 수 있음.

| API 라우트 | 문제 | 영향 |
|------------|------|------|
| `POST /api/orders` | 인증 없이 주문 생성 가능 | 가짜 주문 대량 생성 |
| `PATCH/DELETE /api/orders/[id]` | 인증 없이 주문 상태 변경/취소 | 타인 주문 조작 |
| `POST /api/services` | 인증 없이 서비스 등록 | 스팸 서비스 등록 |
| `PATCH/DELETE /api/services/[id]` | 인증 없이 서비스 수정/삭제 | 타인 서비스 파괴 |
| `POST/DELETE /api/reviews` | 인증 없이 리뷰 작성/삭제 | 가짜 리뷰, 리뷰 삭제 |
| `PATCH /api/profile` | 인증 없이 프로필 수정 | 타인 프로필 변조 |
| `POST /api/messages` | 인증 없이 메시지 전송 | 사칭 메시지 |
| `POST /api/conversations` | 인증 없이 대화방 생성 | 스팸 대화방 |
| `PATCH /api/expert-applications` | 인증 없이 승인/거절 | 무단 전문가 승인 |
| `POST/PATCH/DELETE /api/categories` | 인증 없이 카테고리 조작 | 사이트 구조 파괴 |
| `POST /api/quote-requests` | 인증 없이 견적 요청 | 스팸 견적 |
| `POST /api/notifications` | 인증 없이 알림 생성 | 피싱 알림 |

**조치 방안:**
- 모든 상태 변경 API(POST/PATCH/DELETE)에 `createServerSupabaseClient` + `auth.getUser()` 추가
- 소유권 검증: 본인 리소스만 수정 가능 (주문의 buyer/seller, 서비스의 expert 등)
- 관리자 전용 API(카테고리, 전문가 승인)에 role 검사 추가

### 4-2. 결제 보안

| 항목 | 문제 | 조치 |
|------|------|------|
| 결제 확인 API | 인증 없음 + 금액 미검증 | `auth.getUser()` + 주문 금액 대조 |
| 웹훅 | 서명 검증 없음 | PortOne 웹훅 시크릿으로 HMAC 검증 |
| 주문 생성 | 클라이언트 가격 신뢰 | DB에서 서비스/패키지 가격 조회 후 검증 |

### 4-3. React Hooks 규칙 위반

| 파일 | 문제 |
|------|------|
| `src/app/order/[id]/page.tsx:87` | 조건부 return 이후 `useState` 호출 → 런타임 에러 발생 |

**조치:** Hook 선언을 컴포넌트 최상단으로 이동

### 4-4. Error Boundary 부재

- `error.tsx` 파일이 하나도 없음 → 런타임 에러 시 Next.js 기본 에러 페이지 노출
- 최소 `src/app/error.tsx` (루트) + `src/app/order/[id]/error.tsx` (결제 관련) 필요

---

## 5. 🟡 Important — 출시 전 권장 항목

### 5-1. 스텁/미연결 기능

| 기능 | 현재 상태 | 파일 | 조치 |
|------|-----------|------|------|
| 리뷰 답글 버튼 | `toast("준비 중")` | `dashboard/page.tsx:364` | `/api/reviews/[id]/reply` API 이미 존재, 연결만 필요 |
| 회원 탈퇴 버튼 | `toast("고객센터 문의")` | `settings/page.tsx:131` | `/api/account/delete` API 이미 존재, 연결 필요 |
| 채팅 파일 첨부 | 버튼만 존재, 핸들러 없음 | `messages/page.tsx:341` | `FileUpload` 컴포넌트 + Storage 연동 |
| 프로필 사진 변경 | 버튼만 존재 | `settings/page.tsx:188` | `ImageUpload` 컴포넌트 연동 |
| 전문가 계좌 정보 | localStorage만 저장 | `dashboard/settings/page.tsx:107` | DB 저장 (experts 테이블 또는 별도 테이블) |
| 알림 설정 | localStorage만 저장 | `settings/page.tsx:120` | DB 저장 + 실제 이메일 발송 연동 |

### 5-2. 하드코딩/목업 데이터

| 위치 | 내용 | 조치 |
|------|------|------|
| `mypage/page.tsx:51-78` | 최근 주문 3건 하드코딩 | `getOrdersClient()` 호출로 교체 |
| `mypage/page.tsx:187-193` | 진행중/완료 주문 수 "0" 고정 | 실제 주문 카운트 조회 |
| `dashboard/page.tsx:149` | 조회수 = 판매수 × 5 | 실제 `view_count` 합산 |
| `db-server.ts:808-809` | 신고/고객지원 대기 수 0 고정 | `support_tickets` 테이블 쿼리 |

### 5-3. DB 레이어 수정

| 항목 | 문제 | 조치 |
|------|------|------|
| `updateProfileClient` | phone, bio 필드 무시 | DB update에 phone, bio 포함 |
| `dbServiceToApp` (서버) | status, rejectionReason 누락 | 클라이언트 버전과 동일하게 추가 |
| `DEFAULT_PACKAGES` 폴백 | 가격 2x, 3x 자동 생성 | 패키지 없으면 단일 패키지만 표시 |
| 리뷰 생성 후 집계 미갱신 | 서비스 rating/review_count 미업데이트 | INSERT 후 집계 업데이트 또는 DB 트리거 |
| 쿠폰 사용 미처리 | total_used, is_used 미갱신 | 주문 완료 시 쿠폰 사용 처리 |

### 5-4. 성능

| 항목 | 문제 | 조치 |
|------|------|------|
| 홈 페이지 | 서비스+전문가 전체 fetch (limit 없음) | `.limit(20)` 추가 |
| 검색 API | 전문가 전체 fetch 후 JS 필터 | DB 쿼리로 전환 |
| 리뷰 API | 전체 fetch 후 `slice()` 페이지네이션 | DB LIMIT/OFFSET |

### 5-5. 보안 강화

| 항목 | 문제 | 조치 |
|------|------|------|
| `.or()` 필터 문자열 삽입 | userId/검색어가 직접 삽입됨 | 입력값 sanitize 또는 `.filter()` 사용 |
| CSRF 보호 없음 | 쿠키 인증 + JSON → CSRF 가능 | SameSite=Lax 확인 또는 CSRF 토큰 |
| Rate Limiting | 모든 API에 제한 없음 | 미들웨어 레벨 rate limit 추가 |

---

## 6. 🟢 Nice to have — 출시 후 개선

### 6-1. SEO

| 항목 | 조치 |
|------|------|
| 페이지별 메타데이터 | 서비스/전문가/카테고리 페이지에 `generateMetadata()` 추가 |
| robots.txt | `/dashboard/`, `/admin/` 경로 차단 추가 |
| sitemap | 서비스 100개, 전문가 50개 제한 → 동적 확장 |

### 6-2. 코드 정리

| 항목 | 조치 |
|------|------|
| next.config.ts | picsum/unsplash 도메인 제거, Supabase Storage 도메인 추가 |
| package.json | `framer-motion`, `@playwright/test`, `puppeteer` 미사용 의존성 제거 |
| .env.local.example | 미사용 `GEMINI_API_KEY` 제거 |
| git tracked 삭제 파일 | `ServiceCardSkeleton.tsx`, `ui/tabs.tsx`, `lib/supabase/auth.ts` 커밋 정리 |

### 6-3. UX 개선

| 항목 | 조치 |
|------|------|
| `loading.tsx` | 주요 라우트에 로딩 UI 추가 |
| 알림 설정 | 실제 이메일 발송 (Resend/Supabase Edge Functions) |
| 자동 구매확정 | 납품 후 7일 경과 시 자동 확정 (Cron/Edge Function) |

---

## 7. 우선순위별 작업 로드맵

### Phase 6A — 보안 긴급 (예상 1~2일)

```
1. 전체 API 인증/인가 추가 (12개 라우트)
2. 결제 확인 금액 검증 + 웹훅 서명 검증
3. React Hooks 위반 수정
4. error.tsx 추가
5. .or() 필터 입력값 sanitize
```

### Phase 6B — 기능 완성 (예상 2~3일)

```
1. MyPage 실데이터 전환 (주문/통계)
2. 스텁 버튼 연결 (답글, 탈퇴, 사진 변경)
3. DB 레이어 수정 (프로필, 서비스 status, 리뷰 집계)
4. 쿠폰 사용 처리
5. 전문가 계좌 DB 저장
```

### Phase 6C — 성능/SEO (예상 1~2일)

```
1. 홈/검색/리뷰 페이지네이션 + limit
2. 페이지별 메타데이터
3. Rate Limiting 미들웨어
4. next.config.ts 도메인 정리
5. 미사용 의존성 제거
```

---

## 8. 수동 작업 (코드 외)

| 항목 | 담당 | 비고 |
|------|------|------|
| PortOne 콘솔 설정 + 채널 키 | 운영 | 테스트/실거래 채널 |
| Supabase 네이버 OIDC 설정 | 운영 | 네이버 개발자센터 앱 등록 필요 |
| Footer 사업자 정보 입력 | 운영 | 대표자명, 사업자번호, 주소 |
| 도메인 구매 + Vercel 연결 | 운영 | 커스텀 도메인 |
| 법률 검토 의뢰 | 운영 | 이용약관/개인정보처리방침 전문가 검수 |
| 사업자등록 + 통신판매업 신고 | 운영 | 전자상거래법 |

---

## 9. 감사 통계

| 항목 | 수치 |
|------|------|
| 감사 대상 API 라우트 | 37개 |
| 인증 누락 라우트 | 12개 (🔴) |
| 스텁/미연결 기능 | 6개 (🟡) |
| 하드코딩 데이터 | 4곳 (🟡) |
| 성능 이슈 | 3곳 (🟡) |
| 보안 이슈 (인증 외) | 3곳 (🟡) |
| 코드 정리 | 4곳 (🟢) |
| **총 잔여 항목** | **32개** |
