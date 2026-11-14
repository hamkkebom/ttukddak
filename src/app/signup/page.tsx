"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Check, X } from "lucide-react";
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
const toggleButton = `absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[10px] text-[#56606B] hover:text-ink ${focusRing}`;
const checkboxClass = "h-5 w-5 shrink-0 cursor-pointer accent-ink";

const GENERIC_SIGNUP_ERROR = "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요";

// Supabase 의 원래 오류 문구(영어)는 화면에 내보내지 않고, 코드에 따라 정해 둔 문구를 보여 준다.
function signupErrorMessage(error: { code?: string; status?: number; message: string }) {
  if (error.code === "user_already_exists" || error.message.includes("already registered")) {
    return "가입을 진행할 수 없습니다. 이미 가입했다면 로그인하거나 비밀번호 찾기를 이용해 주세요";
  }
  if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit" || error.status === 429) {
    return "요청이 많습니다. 잠시 후 다시 시도해 주세요";
  }
  return GENERIC_SIGNUP_ERROR;
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>로딩중...</p></div>}>
      <SignUpContent />
    </Suspense>
  );
}

function SignUpContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  // 사이트 안의 경로만 허용한다 (외부 주소로의 리다이렉트 방지).
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));
  // 로그인 화면으로 갈 때도 돌아갈 주소를 넘긴다.
  const loginHref = redirectTo === "/" ? "/login" : `/login?redirect=${encodeURIComponent(redirectTo)}`;
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // 메일 확인이 필요한 가입: 확인 메일을 보낸 주소. 값이 있으면 양식 대신 안내를 보여 준다.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const sentHeadingRef = useRef<HTMLHeadingElement>(null);
  // 검사에 걸린 첫 입력란 (화면이 다시 그려진 뒤 그 칸으로 초점을 옮긴다)
  const firstInvalid = useRef<string | null>(null);

  const focusField = (key: string | null) => {
    if (!key) return;
    const id = key === "agreements" ? "signup-terms" : `signup-${key}`;
    setTimeout(() => document.getElementById(id)?.focus(), 0);
  };

  const passwordRules = [
    { label: "8자 이상", test: (pw: string) => pw.length >= 8 },
    { label: "영문 포함", test: (pw: string) => /[a-zA-Z]/.test(pw) },
    { label: "숫자 포함", test: (pw: string) => /[0-9]/.test(pw) },
    { label: "특수문자 포함", test: (pw: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // 필수 약관 두 개에 모두 동의하면 약관 오류 문구를 바로 지운다.
  const clearAgreementsErrorIf = (requiredChecked: boolean) => {
    if (requiredChecked && errors.agreements) {
      setErrors((prev) => ({ ...prev, agreements: "" }));
    }
  };

  const handleAllAgreements = (checked: boolean) => {
    setAgreements({
      all: checked,
      terms: checked,
      privacy: checked,
      marketing: checked,
    });
    clearAgreementsErrorIf(checked);
  };

  const handleAgreement = (key: keyof typeof agreements, checked: boolean) => {
    const newAgreements = { ...agreements, [key]: checked };
    newAgreements.all = newAgreements.terms && newAgreements.privacy && newAgreements.marketing;
    setAgreements(newAgreements);
    clearAgreementsErrorIf(newAgreements.terms && newAgreements.privacy);
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
    } else if (!passwordRules.every((rule) => rule.test(formData.password))) {
      newErrors.password = "비밀번호 조건을 확인해주세요";
    }

    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다";
    }

    if (!formData.name) {
      newErrors.name = "이름을 입력해주세요";
    }

    if (!formData.phone) {
      newErrors.phone = "휴대폰 번호를 입력해주세요";
    } else if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(formData.phone.replace(/-/g, ""))) {
      newErrors.phone = "올바른 휴대폰 번호 형식이 아닙니다";
    }

    if (!agreements.terms || !agreements.privacy) {
      newErrors.agreements = "필수 약관에 동의해주세요";
    }

    setErrors(newErrors);
    firstInvalid.current = Object.keys(newErrors)[0] ?? null;
    return Object.keys(newErrors).length === 0;
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSocialSignup = async (provider: "google" | "kakao" | "naver") => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      focusField(firstInvalid.current);
      return;
    }
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { name: formData.name, phone: formData.phone },
        },
      });

      if (error) {
        console.error(error);
        setIsLoading(false);
        if (error.code === "weak_password") {
          setErrors((prev) => ({ ...prev, password: "비밀번호 조건을 확인해주세요" }));
          focusField("password");
        } else {
          toast.error(signupErrorMessage(error));
        }
        return;
      }

      if (data.session) {
        // 이미 로그인된 상태다. 가려던 곳으로 보낸다. 화면이 넘어가는 중이라 버튼은 다시 켜지 않는다.
        toast.success("회원가입이 완료되었습니다");
        router.push(redirectTo);
        router.refresh();
        return;
      }

      // 메일 확인을 켜 둔 경우: 아직 가입이 끝나지 않았다.
      // 이미 가입된 주소여도 같은 안내를 보여 준다 (가입 여부를 드러내지 않는다).
      setIsLoading(false);
      setSentTo(formData.email);
      setTimeout(() => sentHeadingRef.current?.focus(), 0);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      toast.error(GENERIC_SIGNUP_ERROR);
    }
  };

  // 오류가 있는 입력란의 테두리 색과, 오류 문구를 읽어 주도록 잇는 속성
  const fieldState = (key: string) => ({
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `signup-${key}-error` : undefined,
  });
  const borderFor = (key: string) => (errors[key] ? "border-[#B42318]" : "border-[#7B838D]");
  // 필수 약관 체크 상자: 약관 오류가 보이는 동안 잘못된 것으로 표시하고 오류 문구를 잇는다.
  const agreementState = {
    "aria-invalid": errors.agreements ? true : undefined,
    "aria-describedby": errors.agreements ? "signup-agreements-error" : undefined,
  };

  // 왼쪽 안내 영역 (넓은 화면에서만)
  const sidePanel = (
    <AuthSidePanel
      title={
        <>
          가입하고
          <br />
          물어보세요
        </>
      }
      lead="가입하면 전문가에게 문의하고, 필요한 영상의 견적을 요청할 수 있습니다."
    />
  );

  if (sentTo !== null) {
    return (
      <div className="min-h-screen flex">
        {sidePanel}
        <div className="flex flex-1 items-center justify-center bg-white px-4 py-10 text-ink [word-break:keep-all] sm:p-12">
          <div className="w-full max-w-md">
            <h1
              ref={sentHeadingRef}
              tabIndex={-1}
              className="font-display text-[40px] leading-[1.1] tracking-[-0.01em] focus:outline-none"
            >
              메일을 확인해 주세요
            </h1>
            <p className="mt-6 break-all text-[17px] font-bold">{sentTo}</p>
            <p className="mt-2 text-[15px] leading-[1.7] text-[#3A3A37]">
              입력한 주소로 확인 메일을 보냈다면, 메일의 링크를 누르면 가입이 끝납니다. 메일이 오지 않으면 주소를 확인하거나 스팸함을 살펴보세요.
            </p>
            <Link
              href={loginHref}
              className={`mt-8 flex h-12 w-full items-center justify-center rounded-[10px] bg-ink px-5 text-base font-bold text-white hover:bg-black ${focusRing}`}
            >
              로그인 화면으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {sidePanel}

      {/* 오른쪽: 가입 양식 */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-white px-4 py-10 text-ink [word-break:keep-all] sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="font-display text-[40px] leading-[1.1] tracking-[-0.01em]">회원가입</h1>
            <p className="mt-3 text-[15px] text-[#56606B]">계정을 만들고 시작하세요</p>
          </div>

          {/* 소셜 가입 */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSocialSignup("google")}
              className={cn(socialButton, "w-full border border-[#7B838D] bg-white text-ink hover:bg-paper")}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 시작하기
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialSignup("kakao")}
                className={cn(socialButton, "bg-[#FEE500] text-[#3C1E1E] hover:brightness-95")}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.647 4.093 5.903-.14.53-.527 1.924-.604 2.22-.093.36.132.354.278.258.115-.075 1.83-1.213 2.573-1.71.548.076 1.107.116 1.66.116 5.523 0 10-3.477 10-7.787C20 6.477 15.523 3 12 3z"/>
                </svg>
                카카오
              </button>
              <button
                type="button"
                onClick={() => handleSocialSignup("naver")}
                className={cn(socialButton, "bg-[#03C75A] text-white hover:brightness-95")}
              >
                <span className="text-lg font-black" aria-hidden="true">N</span>
                네이버
              </button>
            </div>
          </div>

          <div className="my-8 flex items-center gap-4 text-sm text-[#56606B]">
            <span className="h-px flex-1 bg-[#E2E5E9]" aria-hidden="true" />
            또는 이메일로 가입
            <span className="h-px flex-1 bg-[#E2E5E9]" aria-hidden="true" />
          </div>

          {/* 이메일 가입 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="signup-email" className={labelClass}>이메일</label>
              <input
                id="signup-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                {...fieldState("email")}
                className={cn(inputClass, borderFor("email"))}
              />
              {errors.email && <p id="signup-email-error" className={errorClass}>{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="signup-password" className={labelClass}>비밀번호</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleChange}
                  {...fieldState("password")}
                  className={cn(inputClass, "pr-14", borderFor("password"))}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  className={toggleButton}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <p id="signup-password-error" className={errorClass}>{errors.password}</p>}
              {formData.password && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {passwordRules.map((rule) => (
                    <span
                      key={rule.label}
                      className={cn(
                        "flex h-7 items-center gap-1 rounded-full border px-3 text-[13px] font-bold",
                        rule.test(formData.password)
                          ? "border-ink bg-ink text-white"
                          : "border-[#D5D9DE] bg-white text-[#56606B]"
                      )}
                    >
                      {rule.test(formData.password) ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}
                      {rule.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="signup-passwordConfirm" className={labelClass}>비밀번호 확인</label>
              <div className="relative">
                <input
                  id="signup-passwordConfirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  name="passwordConfirm"
                  autoComplete="new-password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  {...fieldState("passwordConfirm")}
                  className={cn(inputClass, "pr-14", borderFor("passwordConfirm"))}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  aria-label={showPasswordConfirm ? "비밀번호 확인 숨기기" : "비밀번호 확인 보기"}
                  className={toggleButton}
                >
                  {showPasswordConfirm ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              {errors.passwordConfirm && <p id="signup-passwordConfirm-error" className={errorClass}>{errors.passwordConfirm}</p>}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-3">
              <div>
                <label htmlFor="signup-name" className={labelClass}>이름</label>
                <input
                  id="signup-name"
                  name="name"
                  autoComplete="name"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={handleChange}
                  {...fieldState("name")}
                  className={cn(inputClass, borderFor("name"))}
                />
                {errors.name && <p id="signup-name-error" className={errorClass}>{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="signup-phone" className={labelClass}>휴대폰</label>
                <input
                  id="signup-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="010-1234-5678"
                  value={formData.phone}
                  onChange={handleChange}
                  {...fieldState("phone")}
                  className={cn(inputClass, borderFor("phone"))}
                />
                {errors.phone && <p id="signup-phone-error" className={errorClass}>{errors.phone}</p>}
              </div>
            </div>

            {/* 약관 동의 */}
            <fieldset
              aria-describedby={errors.agreements ? "signup-agreements-error" : undefined}
              className="rounded-[20px] border border-[#D5D9DE] p-4"
            >
              <legend className="sr-only">약관 동의</legend>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-[#E2E5E9] pb-3 text-[15px] font-bold">
                <input
                  type="checkbox"
                  checked={agreements.all}
                  onChange={(e) => handleAllAgreements(e.target.checked)}
                  className={checkboxClass}
                />
                전체 동의
              </label>

              <div className="pt-2">
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-[#3A3A37]">
                  <input
                    id="signup-terms"
                    type="checkbox"
                    checked={agreements.terms}
                    onChange={(e) => handleAgreement("terms", e.target.checked)}
                    {...agreementState}
                    className={checkboxClass}
                  />
                  <span>
                    <span className="font-bold text-ink">[필수]</span>{" "}
                    <Link href="/terms" className={textLink}>이용약관</Link> 동의
                  </span>
                </label>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-[#3A3A37]">
                  <input
                    type="checkbox"
                    checked={agreements.privacy}
                    onChange={(e) => handleAgreement("privacy", e.target.checked)}
                    {...agreementState}
                    className={checkboxClass}
                  />
                  <span>
                    <span className="font-bold text-ink">[필수]</span>{" "}
                    <Link href="/privacy" className={textLink}>개인정보처리방침</Link> 동의
                  </span>
                </label>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-[#3A3A37]">
                  <input
                    type="checkbox"
                    checked={agreements.marketing}
                    onChange={(e) => handleAgreement("marketing", e.target.checked)}
                    className={checkboxClass}
                  />
                  <span>[선택] 마케팅 정보 수신 동의</span>
                </label>
              </div>
            </fieldset>
            {errors.agreements && <p id="signup-agreements-error" className="-mt-3 text-sm text-[#B42318]">{errors.agreements}</p>}

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
              {isLoading ? "가입 중..." : "회원가입"}
            </button>
          </form>

          <p className="mt-8 border-t border-[#E2E5E9] pt-6 text-center text-[15px] text-[#56606B]">
            이미 계정이 있으신가요?{" "}
            <Link href={loginHref} className={textLink}>
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
