"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Eye, EyeOff, ArrowRight, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

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
  const redirectTo = searchParams.get("redirect") || "/";
  const supabase = createClient();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
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
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setIsLoading(false);
      if (error.message.includes("Invalid login")) {
        setErrors({ email: "이메일 또는 비밀번호가 올바르지 않습니다" });
      } else {
        toast.error("로그인 실패", { description: error.message });
      }
      return;
    }

    toast.success("로그인 성공!", { description: "환영합니다!" });
    router.push(redirectTo);
    router.refresh();
  };

  const handleSocialLogin = async (provider: "google" | "kakao" | "naver") => {
    await supabase.auth.signInWithOAuth({
      provider: provider as Parameters<typeof supabase.auth.signInWithOAuth>[0]["provider"],
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-slate-800 to-slate-900" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">뚝딱</span>
          </Link>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">
                아이디어를 영상으로,
                <br />
                <span className="text-primary">전문가와 함께</span>
              </h1>
              <p className="text-lg text-slate-300">
                수백 명의 검증된 AI 영상 전문가가
                <br />
                당신의 프로젝트를 기다리고 있습니다.
              </p>
            </div>

            {/* Feature Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Play className="h-5 w-5 text-primary fill-primary" />
                </div>
                <div>
                  <p className="font-semibold text-white">실시간 프로젝트</p>
                  <p className="text-sm text-slate-400">지금 바로 시작하세요</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-300">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>평균 4.9점</span>
                </div>
                <div>수천 건의 완료 프로젝트</div>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 border-2 border-slate-900"
                />
              ))}
            </div>
            <p className="text-sm text-slate-400">
              <span className="text-white font-semibold">수천 명</span>의 만족한 고객
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-2xl">뚝딱</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">로그인</h2>
            <p className="text-slate-600">뚝딱에 오신 것을 환영합니다</p>
          </div>

          {/* Social Login */}
          <div className="space-y-3 mb-6">
            <Button variant="outline" className="w-full h-12 gap-3 font-medium" type="button" onClick={() => handleSocialLogin("google")}>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 계속하기
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-12 gap-2 bg-[#FEE500] hover:bg-[#FEE500]/90 border-[#FEE500] text-[#3C1E1E] font-medium" type="button" onClick={() => handleSocialLogin("kakao")}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.647 4.093 5.903-.14.53-.527 1.924-.604 2.22-.093.36.132.354.278.258.115-.075 1.83-1.213 2.573-1.71.548.076 1.107.116 1.66.116 5.523 0 10-3.477 10-7.787C20 6.477 15.523 3 12 3z"/>
                </svg>
                카카오
              </Button>
              <Button variant="outline" className="h-12 gap-2 bg-[#03C75A] hover:bg-[#03C75A]/90 border-[#03C75A] text-white font-medium" type="button" onClick={() => handleSocialLogin("naver")}>
                <span className="font-bold text-lg">N</span>
                네이버
              </Button>
            </div>
          </div>

          <div className="relative my-8">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm text-slate-400">
              또는
            </span>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">이메일</label>
              <Input
                type="email"
                name="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                className={cn("h-12", errors.email && "border-destructive")}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1.5">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">비밀번호</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleChange}
                  className={cn("h-12 pr-12", errors.password && "border-destructive")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1.5">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                비밀번호 찾기
              </Link>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 text-base bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90">
              {isLoading ? "로그인 중..." : "로그인"}
              {!isLoading && <ArrowRight className="h-5 w-5 ml-2" />}
            </Button>
          </form>

          <p className="text-center text-slate-600 mt-8">
            아직 계정이 없으신가요?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              회원가입
            </Link>
          </p>

          {/* Expert CTA */}
          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">영상 전문가이신가요?</p>
                <p className="text-sm text-slate-500">수익을 창출하세요</p>
              </div>
              <Link 
                href="/expert/register"
                className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
              >
                등록하기 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
