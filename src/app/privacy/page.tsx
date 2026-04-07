import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 뚝딱",
  description: "뚝딱의 개인정보 처리방침을 안내합니다.",
};

export default function PrivacyPage() {
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

          <h1 className="text-3xl font-bold mb-2">개인정보처리방침</h1>
          <p className="text-muted-foreground mb-8">최종 수정일: 2024년 1월 1일</p>

          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground mb-6">
              뚝딱(이하 "회사")은 이용자의 개인정보를 중요시하며, 개인정보 보호법을 준수하고 있습니다. 회사는 개인정보처리방침을 통하여 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보 보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">1. 수집하는 개인정보의 항목</h2>
            <p className="text-muted-foreground mb-4">
              회사는 회원가입, 서비스 이용 등을 위해 아래와 같은 개인정보를 수집하고 있습니다:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li><strong>필수항목:</strong> 이메일, 비밀번호, 이름, 휴대폰 번호</li>
              <li><strong>선택항목:</strong> 프로필 사진, 소개글</li>
              <li><strong>자동 수집:</strong> 접속 IP, 쿠키, 접속 일시, 서비스 이용 기록</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. 개인정보의 수집 및 이용목적</h2>
            <p className="text-muted-foreground mb-4">
              수집한 개인정보는 다음의 목적을 위해 활용합니다:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>회원 관리: 회원제 서비스 이용, 개인 식별, 불량회원의 부정 이용 방지</li>
              <li>서비스 제공: 콘텐츠 제공, 맞춤 서비스 제공</li>
              <li>마케팅: 이벤트 및 광고성 정보 제공 (동의 시)</li>
              <li>서비스 개선: 신규 서비스 개발, 통계학적 분석</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. 개인정보의 보유 및 이용기간</h2>
            <p className="text-muted-foreground mb-4">
              회사는 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 일정 기간 보관합니다:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
              <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
              <li>웹사이트 방문기록: 1년</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. 개인정보의 제3자 제공</h2>
            <p className="text-muted-foreground mb-4">
              회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. 개인정보의 파기절차 및 방법</h2>
            <p className="text-muted-foreground mb-4">
              회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 파기절차 및 방법은 다음과 같습니다:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li><strong>파기절차:</strong> 회원이 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 내부 방침 및 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.</li>
              <li><strong>파기방법:</strong> 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">6. 이용자 및 법정대리인의 권리와 그 행사방법</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있습니다.</li>
              <li>이용자는 언제든지 개인정보 수집 및 이용 동의를 철회할 수 있습니다.</li>
              <li>개인정보의 오류에 대한 정정을 요청하신 경우에는 정정이 완료되기 전까지 해당 개인정보를 이용하지 않습니다.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">7. 개인정보 보호책임자</h2>
            <p className="text-muted-foreground mb-4">
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:
            </p>
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <p className="text-muted-foreground">
                <strong>개인정보 보호책임자</strong><br />
                성명: 홍길동<br />
                직책: 개인정보보호팀장<br />
                연락처: privacy@aivideo.market
              </p>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">8. 개인정보처리방침 변경</h2>
            <p className="text-muted-foreground mb-4">
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">부칙</h2>
            <p className="text-muted-foreground mb-4">
              이 개인정보처리방침은 2024년 1월 1일부터 시행합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
