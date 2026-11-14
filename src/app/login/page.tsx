"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { AuthSidePanel } from "@/components/AuthSidePanel";
import { Suspense } from "react";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const textLink = `py-1 font-bold text-ink underline underline-offset-4 hover:text-black ${focusRing}`;
const labelClass = "mb-2 block text-[15px] font-bold text-ink";
const inputClass =
  "h-12 w-full rounded-[10px] border bg-white px-4 text-base text-ink placeholder:text-[#6B7480] focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink";
const errorClass = "mt-1.5 text-sm text-[#B42318]";
const socialButton = `flex h-12 items-center justify-center gap-2 rounded-[10px] text-[15px] font-bold ${focusRing}`;

const CREDENTIALS_MESSAGE = "이메일 또는 비밀번호가 올바르지 않습니다";
const RATE_MESSAGE = "요청이 많습니다. 잠시 후 다시 시도해 주세요";
const CALLBACK_MESSAGE = "로그인을 마치지 못했습니다. 다시 시도해 주세요";

// Supabase 의 원래 오류 문구(영어)는 화면에 내보내지 않고, 코드에 따라 정해 둔 문구를 보여 준다.
function loginErrorMessage(error: { code?: string; status?: number; message: string }) {
  if (error.code === "invalid_credentials" || error.message.includes("Invalid login")) return CREDENTIALS_MESSAGE;
  if (error.code === "email_not_confirmed") return "이메일 확인이 끝나지 않았습니다. 가입할 때 받은 메일의 링크를 눌러 주세요";
  if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit" || error.status === 429) return RATE_MESSAGE;
  return "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요";
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>로딩중...</p></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 사이트 안의 경로만 허용한다 (외부 주소로의 리다이렉트 방지).
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));
  const supabase = createClient();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  // /auth/callback 이 소셜 로그인을 마치지 못하면 ?error=auth 로 돌려보낸다. 입력하거나 다시 제출하면 숨긴다.
  const [callbackErrorDismissed, setCallbackErrorDismissed] = useState(false);
  const showCallbackError = searchParams.get("error") === "auth" && !callbackErrorDismissed;
  // 검사에 걸린 첫 입력란 (화면이 다시 그려진 뒤 그 칸으로 초점을 옮긴다)
  const firstInvalid = useRef<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setCallbackErrorDismissed(true);
    if (errors[name] || errors.form) {
      setErrors((prev) => ({ ...prev, [name]: "", form: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "이메일을 입력해주세요";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다";
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요";
    }

    setErrors(newErrors);
    firstInvalid.current = Object.keys(newErrors)[0] ?? null;
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCallbackErrorDismissed(true);
    if (!validate()) {
      const key = firstInvalid.current;
      setTimeout(() => document.getElementById(`login-${key}`)?.focus(), 0);
      return;
    }
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      console.error(error);
      setIsLoading(false);
      setErrors({ form: loginErrorMessage(error) });
      return;
    }

    toast.success("로그인 성공!", { description: "환영합니다!" });
    router.push(redirectTo);
    router.refresh();
  };

  const handleSocialLogin = async (provider: "google" | "kakao" | "naver") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as Parameters<typeof supabase.auth.signInWithOAuth>[0]["provider"],
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      console.error(error);
      toast.error("소셜 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요");
    }
  };

  // 가입 화면으로 갈 때도 로그인 뒤 돌아갈 주소를 넘긴다.
  const signupHref = redirectTo === "/" ? "/signup" : `/signup?redirect=${encodeURIComponent(redirectTo)}`;
  // 양식 전체에 대한 문구 (서버 오류, 또는 소셜 로그인 복귀 실패)
  const formMessage = errors.form || (showCallbackError ? CALLBACK_MESSAGE : "");
  // 이메일이나 비밀번호가 틀렸을 때는 두 입력란 모두 잘못된 것으로 표시하고 양식 아래 문구를 읽게 한다.
  const badCredentials = errors.form === CREDENTIALS_MESSAGE;
  const formError = badCredentials ? "login-form-error" : undefined;

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 안내 영역 (넓은 화면에서만) */}
      <AuthSidePanel
        title={
          <>
            보고 고르고,
            <br />
            바로 맡기세요
          </>
        }
        lead="AI로 영상을 만드는 전문가의 실제 작업을 먼저 보고, 마음에 드는 사람에게 맡기는 곳입니다."
      />

      {/* 오른쪽: 로그인 양식 */}
      <div className="flex flex-1 items-center justify-center bg-white px-4 py-10 text-ink [word-break:keep-all] sm:p-12">
        <div className="w-full max-w-md">
          <h1 className="mb-8 font-display text-[40px] leading-[1.1] tracking-[-0.01em]">로그인</h1>

          {/* 소셜 로그인 */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSocialLogin("google")}
              className={cn(socialButton, "w-full border border-[#7B838D] bg-white text-ink hover:bg-paper")}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 계속하기
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin("kakao")}
                className={cn(socialButton, "bg-[#FEE500] text-[#3C1E1E] hover:brightness-95")}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.647 4.093 5.903-.14.53-.527 1.924-.604 2.22-.093.36.132.354.278.258.115-.075 1.83-1.213 2.573-1.71.548.076 1.107.116 1.66.116 5.523 0 10-3.477 10-7.787C20 6.477 15.523 3 12 3z"/>
                </svg>
                카카오
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin("naver")}
                className={cn(socialButton, "bg-[#03C75A] text-white hover:brightness-95")}
              >
                <span className="text-lg font-black" aria-hidden="true">N</span>
                네이버
              </button>
            </div>
          </div>

          <div className="my-8 flex items-center gap-4 text-sm text-[#56606B]">
            <span className="h-px flex-1 bg-[#E2E5E9]" aria-hidden="true" />
            또는
            <span className="h-px flex-1 bg-[#E2E5E9]" aria-hidden="true" />
          </div>

          {/* 이메일 로그인 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className={labelClass}>이메일</label>
              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={errors.email || badCredentials ? true : undefined}
                aria-describedby={errors.email ? "login-email-error" : formError}
                className={cn(inputClass, errors.email || badCredentials ? "border-[#B42318]" : "border-[#7B838D]")}
              />
              {errors.email && (
                <p id="login-email-error" className={errorClass}>{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className={labelClass}>비밀번호</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={errors.password || badCredentials ? true : undefined}
                  aria-describedby={errors.password ? "login-password-error" : formError}
                  className={cn(inputClass, "pr-14", errors.password || badCredentials ? "border-[#B42318]" : "border-[#7B838D]")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  className={`absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[10px] text-[#56606B] hover:text-ink ${focusRing}`}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && (
                <p id="login-password-error" className={errorClass}>{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className={`inline-flex min-h-6 items-center text-[15px] ${textLink}`}>
                비밀번호 찾기
              </Link>
            </div>

            {formMessage && (
              <p id="login-form-error" role="alert" className="rounded-[10px] border border-[#B42318] px-4 py-3 text-[15px] font-bold text-[#B42318]">
                {formMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading || undefined}
              className={cn(
                "h-12 w-full rounded-[10px] bg-ink px-5 text-base font-bold text-white hover:bg-black disabled:cursor-not-allowed",
                isLoading ? "opacity-70" : "disabled:bg-[#B9BEC5]",
                focusRing
              )}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <div className="mt-8 space-y-3 border-t border-[#E2E5E9] pt-6 text-center text-[15px] text-[#56606B]">
            <p>
              아직 계정이 없으신가요?{" "}
              <Link href={signupHref} className={textLink}>
                회원가입
              </Link>
            </p>
            <p>
              전문가로 활동하고 싶다면{" "}
              <Link href="/expert/register" className={textLink}>
                전문가 등록
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
