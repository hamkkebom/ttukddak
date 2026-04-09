"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Sparkles, Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordRules = [
    { label: "8자 이상", test: (pw: string) => pw.length >= 8 },
    { label: "영문 포함", test: (pw: string) => /[a-zA-Z]/.test(pw) },
    { label: "숫자 포함", test: (pw: string) => /[0-9]/.test(pw) },
    { label: "특수문자 포함", test: (pw: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!password) {
      newErrors.password = "새 비밀번호를 입력해주세요";
    } else if (!passwordRules.every((rule) => rule.test(password))) {
      newErrors.password = "비밀번호 조건을 확인해주세요";
    }
    if (password !== passwordConfirm) {
      newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setIsLoading(false);
    if (error) {
      toast.error("비밀번호 변경에 실패했습니다", { description: error.message });
      return;
    }

    toast.success("비밀번호가 변경되었습니다", { description: "새 비밀번호로 로그인해주세요." });
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-muted/30 to-background">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-2xl">뚝딱</span>
            </Link>
            <h2 className="text-2xl font-bold mb-2">새 비밀번호 설정</h2>
            <p className="text-muted-foreground text-sm">
              새로운 비밀번호를 입력해주세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                새 비밀번호
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="새 비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn("h-12 pr-12", errors.password && "border-destructive")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {password && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {passwordRules.map((rule) => (
                    <span
                      key={rule.label}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                        rule.test(password)
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {rule.test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {rule.label}
                    </span>
                  ))}
                </div>
              )}
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                비밀번호 확인
              </label>
              <Input
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className={cn("h-12", errors.passwordConfirm && "border-destructive")}
              />
              {errors.passwordConfirm && <p className="text-xs text-destructive mt-1">{errors.passwordConfirm}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              비밀번호 변경하기
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
