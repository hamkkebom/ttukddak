"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const inkButton = `flex h-12 w-full items-center justify-center rounded-[10px] bg-ink px-5 text-base font-bold text-white hover:bg-black disabled:cursor-not-allowed ${focusRing}`;
const backLink = `inline-flex min-h-11 items-center gap-1 text-[15px] font-bold text-ink underline underline-offset-4 hover:text-black ${focusRing}`;

// Supabase 의 원래 오류 문구(영어)는 화면에 내보내지 않는다.
function resetErrorMessage(error: { code?: string; status?: number }) {
  if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit" || error.status === 429) {
    return "요청이 많습니다. 잠시 후 다시 시도해 주세요";
  }
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요";
}

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const sentHeadingRef = useRef<HTMLHeadingElement>(null);

  const validate = () => {
    if (!email) {
      setError("이메일을 입력해주세요");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("올바른 이메일 형식이 아닙니다");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setTimeout(() => document.getElementById("forgot-email")?.focus(), 0);
      return;
    }
    setIsLoading(true);

    const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setIsLoading(false);
    if (supabaseError) {
      console.error(supabaseError);
      toast.error(resetErrorMessage(supabaseError));
      return;
    }
    setIsSent(true);
    setTimeout(() => sentHeadingRef.current?.focus(), 0);
    // 가입하지 않은 주소에도 요청은 성공으로 끝난다. "보냈다"고 단정하지 않는다.
    toast.success("메일을 확인해 주세요");
  };

  if (isSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10 text-ink [word-break:keep-all] sm:p-12">
        <div className="w-full max-w-md">
          <h1
            ref={sentHeadingRef}
            tabIndex={-1}
            className="font-display text-[40px] leading-[1.1] tracking-[-0.01em] focus:outline-none"
          >
            메일을 확인해 주세요
          </h1>
          <p className="mt-6 break-all text-[17px] font-bold">{email}</p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#3A3A37]">
            입력한 주소로 가입한 계정이 있으면 비밀번호 재설정 링크를 보냅니다. 메일이 오지 않으면 주소를 확인하거나 스팸함을 살펴보세요.
          </p>
          <div className="mt-8 space-y-3">
            <Link href="/login" className={inkButton}>
              로그인 페이지로 돌아가기
            </Link>
            <button
              type="button"
              disabled={isResending}
              aria-busy={isResending || undefined}
              className={`flex min-h-11 w-full items-center justify-center rounded-[10px] text-[15px] font-medium text-[#56606B] hover:text-ink hover:underline disabled:cursor-not-allowed disabled:opacity-70 ${focusRing}`}
              onClick={async () => {
                if (isResending) return;
                setIsResending(true);
                try {
                  const { error: resendError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth/reset-password`,
                  });
                  if (resendError) {
                    console.error(resendError);
                    toast.error("재발송에 실패했습니다");
                  } else {
                    toast.success("다시 요청했습니다. 메일을 확인해 주세요");
                  }
                } finally {
                  setIsResending(false);
                }
              }}
            >
              이메일을 받지 못하셨나요? 다시 보내기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10 text-ink [word-break:keep-all] sm:p-12">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="font-display text-[40px] leading-[1.1] tracking-[-0.01em]">비밀번호 찾기</h1>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#56606B]">
            가입 시 등록한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="forgot-email" className="mb-2 block text-[15px] font-bold text-ink">
              이메일
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "forgot-email-error" : undefined}
              className={cn(
                "h-12 w-full rounded-[10px] border bg-white px-4 text-base text-ink placeholder:text-[#6B7480] focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink",
                error ? "border-[#B42318]" : "border-[#7B838D]"
              )}
            />
            {error && (
              <p id="forgot-email-error" className="mt-1.5 text-sm text-[#B42318]">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading || undefined}
            className={cn(inkButton, isLoading ? "opacity-70" : "disabled:bg-[#B9BEC5]")}
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> : null}
            재설정 링크 보내기
          </button>
        </form>

        <div className="mt-8 border-t border-[#E2E5E9] pt-4 text-center">
          <Link href="/login" className={backLink}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
