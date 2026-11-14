"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";

interface InquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expertId: string;
  expertName: string;
  /** 어느 서비스에 대한 문의인지. 전문가 화면처럼 서비스를 정하지 않고 묻는 경우에는 비운다. */
  serviceId?: string;
  serviceName?: string;
  /** 로그인이 필요할 때, 로그인 뒤 돌아올 주소 */
  returnPath: string;
}

// 전문가에게 보내는 첫 문의. 보내면 대화방이 만들어지고 메시지 화면으로 넘어간다.
//
// 창의 기본 동작(창 안에 초점 가두기, 닫으면 원래 자리로 초점 돌려놓기, Esc 로 닫기,
// 열려 있는 동안 뒤 화면 스크롤 잠금)은 Radix Dialog 가 맡는다.
export function InquiryModal({
  open,
  onOpenChange,
  expertId,
  expertName,
  serviceId,
  serviceName,
  returnPath,
}: InquiryModalProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // 창을 연 버튼 (닫을 때 초점을 돌려놓을 자리)
  const openerRef = useRef<HTMLElement | null>(null);
  // 창을 닫았다 다시 열어도 쓰던 글이 남도록 창 바깥(이 컴포넌트)에 둔다.
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
          ...(serviceId ? { serviceId } : {}),
          initialMessage: message.trim(),
        }),
      });

      if (res.status === 401) {
        toast.error("로그인이 필요합니다");
        router.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
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

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-night/60" />
        <Dialog.Content
          // 열리면 닫기 버튼이 아니라 글을 쓸 입력란으로 초점을 보낸다.
          onOpenAutoFocus={(e) => {
            // 이 시점에는 아직 창을 연 버튼에 초점이 있다. 닫을 때 돌아갈 자리로 기억해 둔다.
            openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            e.preventDefault();
            textareaRef.current?.focus();
          }}
          // 닫으면 창을 연 버튼으로 초점을 돌려놓는다.
          // (Radix 는 Dialog.Trigger 로 연 경우에만 알아서 돌려놓는데, 이 창은 바깥의 버튼이 연다.)
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            openerRef.current?.focus();
          }}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-[28px] bg-white p-7 text-ink [word-break:keep-all] focus:outline-none"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Dialog.Title className="text-2xl font-black tracking-[-0.03em]">{expertName}님에게 문의</Dialog.Title>
              {serviceName && <p className="mt-1 truncate text-[15px] text-[#56606B]">{serviceName}</p>}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="닫기"
                className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-[#56606B] hover:text-ink focus-visible:outline-2 focus-visible:outline-ink"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="rounded-[10px] bg-paper px-4 py-3 text-sm text-[#3A3A37]">
            공개 테스트 기간에는 플랫폼 메시지와 첨부파일로 요구사항, 일정, 금액을 협의합니다.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-[15px] font-black">문의 내용</span>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="필요한 영상, 일정, 예산을 적어 주세요. 구체적으로 적을수록 정확한 답을 받을 수 있습니다."
                rows={5}
                className="w-full rounded-[10px] border border-[#7B838D] bg-white px-4 py-3 text-base placeholder:text-[#6B7480] focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              />
            </label>

            <div className="flex gap-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={submitting}
                  className="h-12 rounded-[10px] border border-ink px-5 text-[15px] font-bold hover:bg-paper disabled:opacity-50"
                >
                  취소
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="h-12 flex-1 rounded-[10px] bg-ink px-5 text-[15px] font-bold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-[#B9BEC5]"
              >
                {submitting ? "보내는 중" : "문의 보내기"}
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              router.push("/messages");
            }}
            className="flex items-center justify-center gap-1 self-center py-2 text-sm font-medium text-[#56606B] hover:text-ink"
          >
            이전 대화 보기
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
