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
          <p className="text-muted-foreground mb-8">최종 수정일: 2024년 1월 1일</p>

          <div className="prose prose-sm max-w-none">
            <h2 className="text-xl font-semibold mt-8 mb-4">제1조 (목적)</h2>
            <p className="text-muted-foreground mb-4">
              이 약관은 뚝딱(이하 "회사")이 제공하는 서비스의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">제2조 (정의)</h2>
            <p className="text-muted-foreground mb-4">
              이 약관에서 사용하는 용어의 정의는 다음과 같습니다:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>"서비스"란 회사가 제공하는 영상 제작 중개 플랫폼을 의미합니다.</li>
              <li>"회원"이란 회사와 서비스 이용 계약을 체결하고 회원 아이디를 부여받은 자를 말합니다.</li>
              <li>"전문가"란 회사의 심사를 통과하여 서비스를 제공하는 회원을 말합니다.</li>
              <li>"의뢰인"이란 전문가에게 서비스를 의뢰하는 회원을 말합니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>이 약관은 서비스를 이용하고자 하는 모든 회원에게 적용됩니다.</li>
              <li>회사는 필요한 경우 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있습니다.</li>
              <li>변경된 약관은 서비스 내 공지사항을 통해 공지하며, 공지 후 7일이 경과하면 효력이 발생합니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제4조 (회원가입)</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>서비스 이용을 원하는 자는 회사가 정한 절차에 따라 회원가입을 신청합니다.</li>
              <li>회사는 다음 각 호에 해당하는 신청에 대해서는 승낙을 거부할 수 있습니다:
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>타인의 정보를 도용한 경우</li>
                  <li>허위 정보를 기재한 경우</li>
                  <li>기타 회사가 정한 이용 기준에 부합하지 않는 경우</li>
                </ul>
              </li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제5조 (서비스의 제공)</h2>
            <p className="text-muted-foreground mb-4">
              회사는 회원에게 다음과 같은 서비스를 제공합니다:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>전문가와 의뢰인 간의 중개 서비스</li>
              <li>안전 결제 서비스</li>
              <li>메시지 및 알림 서비스</li>
              <li>기타 회사가 정하는 서비스</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제6조 (결제 및 환불)</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>의뢰인은 서비스 이용 시 회사가 정한 결제 방법으로 대금을 지불합니다.</li>
              <li>결제된 금액은 작업 완료 후 전문가에게 정산됩니다.</li>
              <li>환불은 회사의 환불 정책에 따라 처리됩니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제7조 (회원의 의무)</h2>
            <p className="text-muted-foreground mb-4">
              회원은 다음 행위를 하여서는 안 됩니다:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>타인의 정보 도용</li>
              <li>회사의 저작권 등 지식재산권 침해</li>
              <li>회사 및 제3자의 명예 훼손</li>
              <li>외설적인 정보의 게시</li>
              <li>기타 불법적이거나 부당한 행위</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제8조 (면책조항)</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>회사는 전문가와 의뢰인 간의 거래에 대해 중개자의 역할만을 수행합니다.</li>
              <li>회사는 회원 간 분쟁에 대해 개입할 의무가 없습니다.</li>
              <li>천재지변 등 불가항력으로 인한 서비스 중단에 대해 책임지지 않습니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">제9조 (분쟁해결)</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>서비스 이용과 관련하여 분쟁이 발생한 경우 쌍방 간의 합의에 의해 해결합니다.</li>
              <li>합의가 이루어지지 않을 경우 관할 법원에 소를 제기할 수 있습니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">부칙</h2>
            <p className="text-muted-foreground mb-4">
              이 약관은 2024년 1월 1일부터 시행합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
