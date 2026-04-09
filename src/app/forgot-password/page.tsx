"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Mail, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    if (!validate()) return;
    setIsLoading(true);

    const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setIsLoading(false);
    if (supabaseError) {
      toast.error("이메일 발송에 실패했습니다", { description: supabaseError.message });
      return;
    }
    setIsSent(true);
    toast.success("비밀번호 재설정 링크가 발송되었습니다");
  };

  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-muted/30 to-background">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">이메일 발송 완료</h2>
            <p className="text-muted-foreground mb-2">
              <strong>{email}</strong>
            </p>
            <p className="text-muted-foreground mb-8 text-sm">
              위 이메일로 비밀번호 재설정 링크를 보냈습니다.
              <br />
              이메일을 확인하고 링크를 클릭해주세요.
            </p>
            <div className="space-y-3">
              <Button className="w-full" asChild>
                <Link href="/login">로그인 페이지로 돌아가기</Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={async () => {
                  const { error: resendError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth/reset-password`,
                  });
                  if (resendError) {
                    toast.error("재발송에 실패했습니다");
                  } else {
                    toast.success("재발송되었습니다");
                  }
                }}
              >
                이메일을 받지 못하셨나요? 다시 보내기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-muted/30 to-background">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-2xl">뚝딱</span>
            </Link>
            <h2 className="text-2xl font-bold mb-2">비밀번호 찾기</h2>
            <p className="text-muted-foreground text-sm">
              가입 시 등록한 이메일을 입력하시면
              <br />
              비밀번호 재설정 링크를 보내드립니다
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  className={cn("h-12 pl-11", error && "border-destructive")}
                />
              </div>
              {error && (
                <p className="text-xs text-destructive mt-1.5">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              재설정 링크 보내기
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              로그인으로 돌아가기
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
