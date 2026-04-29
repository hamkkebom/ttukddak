"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface InquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  expertId: string;
  serviceName: string;
  expertName: string;
}

export function InquiryModal({
  open,
  onOpenChange,
  serviceId,
  expertId,
  serviceName,
  expertName,
}: InquiryModalProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/conversations/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expertId,
          serviceId,
          initialMessage: message.trim(),
        }),
      });

      if (res.status === 401) {
        toast.error("로그인이 필요합니다");
        router.push(`/login?redirect=/service/${serviceId}`);
        return;
      }

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "문의 전송에 실패했습니다");
        return;
      }

      toast.success("문의가 전송되었습니다", {
        description: `${expertName} 전문가와의 대화방을 만들었습니다.`,
      });
      setMessage("");
      onOpenChange(false);
      router.push(`/messages?conversationId=${json.conversationId || json.id}`);
    } catch {
      toast.error("네트워크 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const goToMessages = () => {
    onOpenChange(false);
    router.push("/messages");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">문의하기</h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <p className="text-sm font-medium">{expertName} 전문가</p>
            <p className="text-xs text-muted-foreground truncate">{serviceName}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">온라인</Badge>
        </div>

        <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          공개 테스트 기간에는 플랫폼 메시지와 첨부파일로 요구사항, 일정, 금액을 협의합니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="프로젝트 요구사항, 일정, 예산 등을 알려주세요.&#10;&#10;구체적으로 작성할수록 정확한 견적을 받을 수 있습니다."
            rows={5}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting || !message.trim()}>
              {submitting ? "전송 중..." : "문의 보내기"}
            </Button>
          </div>
        </form>

        <button
          onClick={goToMessages}
          className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          이전 대화 내역 보기
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
