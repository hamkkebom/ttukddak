"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Eye, EyeOff, Check, X, ArrowRight, Users, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const supabase = createClient();
  const router = useRouter();
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

  const handleAllAgreements = (checked: boolean) => {
    setAgreements({
      all: checked,
      terms: checked,
      privacy: checked,
      marketing: checked,
    });
  };

  const handleAgreement = (key: keyof typeof agreements, checked: boolean) => {
    const newAgreements = { ...agreements, [key]: checked };
    newAgreements.all = newAgreements.terms && newAgreements.privacy && newAgreements.marketing;
    setAgreements(newAgreements);
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
    return Object.keys(newErrors).length === 0;
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: { name: formData.name, phone: formData.phone },
      },
    });

    setIsLoading(false);
    if (error) {
      toast.error("회원가입 실패", { description: error.message });
      return;
    }

    toast.success("회원가입이 완료되었습니다!", { description: "로그인 페이지로 이동합니다." });
    router.push("/login");
  };

  const features = [
    { icon: Users, title: "300+ 전문가", desc: "검증된 영상 전문가" },
    { icon: Shield, title: "안전 거래", desc: "에스크로 결제 시스템" },
    { icon: Zap, title: "빠른 매칭", desc: "평균 1시간 내 응답" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://picsum.photos/seed/signup-bg/1200/1600"
            alt="Background"
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/40 via-slate-900/80 to-slate-900" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">뚝딱</span>
          </Link>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">
                지금 시작하세요
                <br />
                <span className="text-violet-400">무료 회원가입</span>
              </h1>
              <p className="text-lg text-slate-300">
                뚝딱과 함께 당신의 아이디어를
                <br />
                현실로 만들어보세요.
              </p>
            </div>

            <div className="space-y-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-violet-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{feature.title}</p>
                    <p className="text-sm text-slate-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-400">
            "뚝딱 덕분에 고품질 영상을 빠르게 만들 수 있었습니다."
            <br />
            <span className="text-white">— 김OO, 스타트업 대표</span>
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile Logo */}
          <div className="text-center mb-6 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-2xl">뚝딱</span>
            </Link>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">회원가입</h2>
            <p className="text-slate-600">계정을 만들고 시작하세요</p>
          </div>

          {/* Social Signup */}
          <div className="space-y-3 mb-6">
            <Button variant="outline" className="w-full h-11 gap-3 font-medium" type="button">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 시작하기
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-11 gap-2 bg-[#FEE500] hover:bg-[#FEE500]/90 border-[#FEE500] text-[#3C1E1E] font-medium" type="button">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.647 4.093 5.903-.14.53-.527 1.924-.604 2.22-.093.36.132.354.278.258.115-.075 1.83-1.213 2.573-1.71.548.076 1.107.116 1.66.116 5.523 0 10-3.477 10-7.787C20 6.477 15.523 3 12 3z"/>
                </svg>
                카카오
              </Button>
              <Button variant="outline" className="h-11 gap-2 bg-[#03C75A] hover:bg-[#03C75A]/90 border-[#03C75A] text-white font-medium" type="button">
                <span className="font-bold text-lg">N</span>
                네이버
              </Button>
            </div>
          </div>

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm text-slate-400">
              또는 이메일로 가입
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">이메일</label>
              <Input
                type="email"
                name="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                className={cn("h-11", errors.email && "border-destructive")}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">비밀번호</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleChange}
                  className={cn("h-11 pr-12", errors.password && "border-destructive")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.password && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {passwordRules.map((rule) => (
                    <span
                      key={rule.label}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                        rule.test(formData.password)
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {rule.test(formData.password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {rule.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">비밀번호 확인</label>
              <div className="relative">
                <Input
                  type={showPasswordConfirm ? "text" : "password"}
                  name="passwordConfirm"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  className={cn("h-11 pr-12", errors.passwordConfirm && "border-destructive")}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.passwordConfirm && <p className="text-xs text-destructive mt-1">{errors.passwordConfirm}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">이름</label>
                <Input
                  name="name"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={handleChange}
                  className={cn("h-11", errors.name && "border-destructive")}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">휴대폰</label>
                <Input
                  name="phone"
                  placeholder="010-1234-5678"
                  value={formData.phone}
                  onChange={handleChange}
                  className={cn("h-11", errors.phone && "border-destructive")}
                />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Agreements */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-lg">
                <Checkbox
                  checked={agreements.all}
                  onCheckedChange={(checked) => handleAllAgreements(checked as boolean)}
                />
                <span className="font-medium text-slate-900">전체 동의</span>
              </label>
              
              <div className="space-y-2 pl-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={agreements.terms}
                    onCheckedChange={(checked) => handleAgreement("terms", checked as boolean)}
                  />
                  <span className="text-sm text-slate-600">
                    <Link href="/terms" className="text-primary hover:underline">[필수] 이용약관</Link> 동의
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={agreements.privacy}
                    onCheckedChange={(checked) => handleAgreement("privacy", checked as boolean)}
                  />
                  <span className="text-sm text-slate-600">
                    <Link href="/privacy" className="text-primary hover:underline">[필수] 개인정보처리방침</Link> 동의
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={agreements.marketing}
                    onCheckedChange={(checked) => handleAgreement("marketing", checked as boolean)}
                  />
                  <span className="text-sm text-slate-600">[선택] 마케팅 정보 수신 동의</span>
                </label>
              </div>
              {errors.agreements && <p className="text-xs text-destructive">{errors.agreements}</p>}
            </div>

            <Button type="submit" className="w-full h-12 text-base bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 mt-4">
              회원가입
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </form>

          <p className="text-center text-slate-600 mt-6">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
