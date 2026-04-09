import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "이용약관 | 뚝딱",
  description: "뚝딱 서비스 이용약관입니다.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/">
              <ChevronLeft className="h-4 w-4 mr-1" />
              돌아가기
            </Link>
          </Button>

          <h1 className="text-3xl font-bold mb-2">이용약관</h1>
          <p className="text-muted-foreground mb-8">최종 수정일: 2026년 4월 9일 | 시행일: 2026년 4월 9일</p>

          <div className="prose prose-sm max-w-none">
            <h2 className="text-xl font-semibold mt-8 mb-4">제1조 (목적)</h2>
            <p className="text-muted-foreground mb-4">
              이 약관은 뚝딱(이하 &quot;회사&quot;)이 운영하는 AI 영상 마켓플레이스(이하 &quot;서비스&quot;)의 이용에 관한
              회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">제2조 (정의)</h2>
            <p className="text-muted-foreground mb-2">이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>&quot;서비스&quot;란 회사가 제공하는 AI 영상 제작 전문가 매칭 및 거래 중개 플랫폼을 의미합니다.</li>
              <li>&quot;이용자&quot;란 이 약관에 따라 서비스를 이용하는 모든 회원을 말합니다.</li>
              <li>&quot;의뢰인&quot;이란 서비스를 통해 영상 제작을 의뢰하는 이용자를 말합니다.</li>
              <li>&quot;전문가&quot;란 서비스를 통해 영상 제작 서비스를 제공하는 이용자를 말합니다.</li>
              <li>&quot;콘텐츠&quot;란 서비스 내에서 이용자가 게시하는 텍스트, 이미지, 영상 등 모든 형태의 정보를 말합니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>이 약관은 서비스 내에 공지하거나 기타의 방법으로 이용자에게 알림으로써 효력이 발생합니다.</li>
              <li>회사는 관련 법령에 위반하지 않는 범위 내에서 약관을 변경할 수 있으며, 변경 시 최소 7일 전에 공지합니다.</li>
              <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제4조 (회원가입)</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>이용자는 회사가 정한 가입 양식에 따라 회원 정보를 기입한 후 약관에 동의함으로써 회원가입을 신청합니다.</li>
              <li>회사는 다음에 해당하는 경우 가입을 거절하거나 사후에 이용계약을 해지할 수 있습니다:
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>실명이 아니거나 타인의 정보를 이용한 경우</li>
                  <li>허위 정보를 기재한 경우</li>
                  <li>기타 회사가 정한 이용 조건에 위반한 경우</li>
                </ul>
              </li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제5조 (서비스의 제공)</h2>
            <p className="text-muted-foreground mb-2">회사는 회원에게 다음과 같은 서비스를 제공합니다:</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>AI 영상 제작 전문가와 의뢰인 간 매칭 서비스</li>
              <li>견적 요청 및 비교 서비스</li>
              <li>안전 결제(에스크로) 서비스</li>
              <li>메시지 및 커뮤니케이션 서비스</li>
              <li>리뷰 및 평가 서비스</li>
              <li>기타 회사가 정하는 서비스</li>
            </ol>
            <p className="text-muted-foreground mb-4">
              회사는 서비스의 내용을 변경하거나 중단할 수 있으며, 이 경우 사전에 공지합니다.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">제6조 (거래 및 결제)</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>의뢰인과 전문가 간의 거래는 회사의 결제 시스템(에스크로)을 통해 이루어집니다.</li>
              <li>결제 금액은 전문가의 작업 완료 및 의뢰인의 구매 확정 후 정산됩니다.</li>
              <li>회사는 거래 금액의 일정 비율을 서비스 이용 수수료로 수취합니다.</li>
              <li>수수료율은 서비스 내에 별도로 공지하며, 변경 시 최소 30일 전에 안내합니다.</li>
              <li>결제 관련 분쟁은 회사의 분쟁 해결 절차에 따릅니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제7조 (환불 및 청약철회)</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>의뢰인은 전문가의 작업 시작 전에 주문을 취소하고 전액 환불을 받을 수 있습니다.</li>
              <li>작업 시작 후에는 다음의 기준에 따라 환불이 처리됩니다:
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>작업 진행률 0~25%: 결제 금액의 75% 환불</li>
                  <li>작업 진행률 25~50%: 결제 금액의 50% 환불</li>
                  <li>작업 진행률 50~75%: 결제 금액의 25% 환불</li>
                  <li>작업 진행률 75% 이상: 환불 불가</li>
                </ul>
              </li>
              <li>전문가의 귀책 사유(납기 지연, 품질 미달 등)로 인한 취소 시 전액 환불됩니다.</li>
              <li>납품 완료 후 구매확정 전까지 수정 요청이 가능하며, 패키지에 포함된 수정 횟수 내에서 무료로 제공됩니다.</li>
              <li>구매확정 이후에는 환불이 불가합니다. 단, 전문가와 별도 합의 시 예외로 합니다.</li>
              <li>납품 후 7일 이내 구매확정 또는 수정 요청이 없을 경우 자동으로 구매확정 처리됩니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제8조 (이용자의 의무)</h2>
            <p className="text-muted-foreground mb-2">이용자는 다음 행위를 하여서는 안 됩니다:</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>타인의 정보를 도용하거나 허위 정보를 등록하는 행위</li>
              <li>서비스를 이용하여 법령에 위반되는 행위</li>
              <li>회사 또는 타인의 지적재산권을 침해하는 행위</li>
              <li>서비스의 정상적 운영을 방해하는 행위</li>
              <li>플랫폼 외부에서의 직거래를 유도하는 행위</li>
              <li>욕설, 비방, 성적 불쾌감을 주는 콘텐츠를 게시하는 행위</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제9조 (전문가의 의무)</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>전문가는 서비스에 등록된 내용에 따라 성실하게 작업을 수행해야 합니다.</li>
              <li>전문가는 약속된 납기일을 준수해야 하며, 지연 시 사전에 의뢰인과 협의해야 합니다.</li>
              <li>전문가는 의뢰인의 요구사항을 정확히 반영하여 결과물을 납품해야 합니다.</li>
              <li>전문가의 포트폴리오 및 서비스 설명은 실제 역량에 부합해야 합니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제10조 (지적재산권)</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>전문가가 제작한 결과물의 저작권은 구매확정 완료 시 의뢰인에게 양도됩니다.</li>
              <li>단, 전문가는 포트폴리오 목적으로 결과물을 사용할 수 있는 권리를 보유합니다 (의뢰인이 비공개를 요청한 경우 제외).</li>
              <li>의뢰인이 제공한 소재(로고, 이미지 등)의 저작권은 의뢰인에게 있습니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제11조 (서비스 이용 제한)</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>회사는 이용약관을 위반하거나, 서비스의 정상적인 운영을 방해하는 경우 서비스 이용을 제한할 수 있습니다.</li>
              <li>이용 제한은 경고, 일시 정지, 영구 정지의 단계로 진행될 수 있습니다.</li>
              <li>이용 제한 시 회사는 해당 사유를 이용자에게 통지합니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제12조 (면책)</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>회사는 이용자 간의 거래에서 발생하는 분쟁에 대해 중개자로서의 역할만을 수행합니다.</li>
              <li>회사는 천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
              <li>회사는 이용자가 게시한 콘텐츠의 정확성, 적법성에 대해 보증하지 않습니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제13조 (분쟁 해결)</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>이 약관과 관련된 분쟁은 대한민국 법률에 따라 해결됩니다.</li>
              <li>서비스 이용과 관련하여 회사와 이용자 간 발생한 분쟁에 대해서는 회사의 소재지를 관할하는 법원을 제1심 법원으로 합니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제14조 (회원 탈퇴 및 자격 상실)</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>이용자는 언제든지 서비스 내 설정 메뉴를 통해 탈퇴를 요청할 수 있습니다.</li>
              <li>탈퇴 시 이용자의 개인정보는 개인정보처리방침에 따라 처리됩니다.</li>
              <li>진행 중인 거래가 있는 경우, 거래 완료 후 탈퇴가 처리됩니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">부칙</h2>
            <p className="text-muted-foreground mb-4">
              이 약관은 2026년 4월 9일부터 시행합니다.
            </p>
            <p className="text-muted-foreground mb-4">
              약관에 대한 문의사항은 support@ttukddak.com으로 연락해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
