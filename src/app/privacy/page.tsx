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
          <p className="text-muted-foreground mb-8">최종 수정일: 2026년 4월 9일 | 시행일: 2026년 4월 9일</p>

          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground mb-6">
              뚝딱(이하 &quot;회사&quot;)은 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.
              본 개인정보처리방침은 회사가 수집하는 개인정보의 항목, 수집 및 이용 목적, 보유 기간,
              제3자 제공 등에 관한 사항을 안내합니다.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">1. 수집하는 개인정보의 항목</h2>
            <p className="text-muted-foreground mb-2">
              회사는 서비스 제공을 위해 다음의 개인정보를 수집합니다:
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">가. 회원가입 시 필수 수집 항목</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
              <li>이메일 주소, 비밀번호 (암호화 저장), 이름, 휴대전화번호</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">나. 소셜 로그인 시 수집 항목</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
              <li>Google: 이메일, 이름, 프로필 사진</li>
              <li>카카오: 이메일, 닉네임, 프로필 사진</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">다. 전문가 등록 시 추가 수집 항목</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
              <li>활동명 및 소개, 보유 기술 및 경력사항, 포트폴리오 자료</li>
              <li>정산 계좌 정보 (은행명, 계좌번호, 예금주)</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">라. 결제 시 수집 항목</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
              <li>결제 수단 정보 (PG사를 통해 처리, 회사는 카드번호를 직접 저장하지 않음)</li>
              <li>거래 내역</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">마. 서비스 이용 중 자동 수집 항목</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
              <li>서비스 이용 기록, 접속 로그, IP 주소, 접속 일시</li>
              <li>기기 정보 (브라우저 종류, OS), 쿠키 정보</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. 개인정보의 수집 및 이용 목적</h2>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full text-sm text-muted-foreground">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-foreground">수집 목적</th>
                    <th className="text-left py-2 font-medium text-foreground">이용 항목</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr><td className="py-2 pr-4">회원 식별 및 가입 관리</td><td className="py-2">이메일, 이름, 비밀번호</td></tr>
                  <tr><td className="py-2 pr-4">서비스 제공 및 거래 이행</td><td className="py-2">이메일, 연락처, 결제 정보</td></tr>
                  <tr><td className="py-2 pr-4">전문가 등록 및 정산</td><td className="py-2">이름, 계좌 정보, 포트폴리오</td></tr>
                  <tr><td className="py-2 pr-4">고객 상담 및 분쟁 해결</td><td className="py-2">이메일, 연락처, 거래 내역</td></tr>
                  <tr><td className="py-2 pr-4">마케팅 및 서비스 개선</td><td className="py-2">이용 기록, 접속 로그 (동의 시)</td></tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. 개인정보의 보유 및 이용 기간</h2>
            <p className="text-muted-foreground mb-2">
              회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 다음의 경우에는 관련 법령에 따라 보관합니다:
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full text-sm text-muted-foreground">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-foreground">보관 항목</th>
                    <th className="text-left py-2 pr-4 font-medium text-foreground">보관 기간</th>
                    <th className="text-left py-2 font-medium text-foreground">근거 법령</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr><td className="py-2 pr-4">계약 또는 청약철회 기록</td><td className="py-2 pr-4">5년</td><td className="py-2">전자상거래법</td></tr>
                  <tr><td className="py-2 pr-4">대금결제 및 재화 공급 기록</td><td className="py-2 pr-4">5년</td><td className="py-2">전자상거래법</td></tr>
                  <tr><td className="py-2 pr-4">소비자 불만 또는 분쟁 처리 기록</td><td className="py-2 pr-4">3년</td><td className="py-2">전자상거래법</td></tr>
                  <tr><td className="py-2 pr-4">웹사이트 방문 기록</td><td className="py-2 pr-4">3개월</td><td className="py-2">통신비밀보호법</td></tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. 개인정보의 제3자 제공</h2>
            <p className="text-muted-foreground mb-2">
              회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우는 예외로 합니다:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>거래 이행을 위해 필요한 경우 (의뢰인-전문가 간 연락처 공유 등)</li>
              <li>법령에 의해 요구되는 경우</li>
              <li>서비스 제공을 위해 필요한 업무 위탁</li>
            </ol>

            <h3 className="text-lg font-medium mt-4 mb-2">업무 위탁 현황</h3>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full text-sm text-muted-foreground">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-foreground">수탁업체</th>
                    <th className="text-left py-2 font-medium text-foreground">위탁 업무</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr><td className="py-2 pr-4">포트원(PortOne)</td><td className="py-2">결제 처리 및 정산</td></tr>
                  <tr><td className="py-2 pr-4">Supabase Inc.</td><td className="py-2">데이터베이스 및 인증 서비스 호스팅</td></tr>
                  <tr><td className="py-2 pr-4">Vercel Inc.</td><td className="py-2">웹 애플리케이션 호스팅</td></tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. 개인정보의 파기</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등으로 개인정보가 불필요하게 된 때에는 지체 없이 해당 개인정보를 파기합니다.</li>
              <li>전자적 파일 형태의 정보는 복구할 수 없는 방법으로 영구 삭제합니다.</li>
              <li>종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">6. 이용자의 권리와 행사 방법</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있습니다.</li>
              <li>이용자는 회원 탈퇴를 통해 개인정보 처리 정지를 요청할 수 있습니다.</li>
              <li>이용자는 개인정보 수집 및 이용에 대한 동의를 철회할 수 있습니다.</li>
              <li>위 요청은 서비스 내 설정 메뉴 또는 고객센터를 통해 가능합니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">7. 쿠키의 사용</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>회사는 이용자에게 맞춤형 서비스를 제공하기 위해 쿠키를 사용합니다.</li>
              <li>이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-8 mb-4">8. 개인정보의 안전성 확보 조치</h2>
            <p className="text-muted-foreground mb-2">회사는 개인정보의 안전성 확보를 위해 다음 조치를 취합니다:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>비밀번호 암호화 저장</li>
              <li>SSL/TLS를 통한 데이터 전송 암호화</li>
              <li>개인정보 접근 권한 제한 (최소 인원)</li>
              <li>정기적인 보안 점검</li>
              <li>Row Level Security(RLS) 정책을 통한 데이터 접근 통제</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">9. 개인정보 보호책임자</h2>
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <p className="text-muted-foreground">
                <strong>개인정보 보호책임자</strong><br />
                이메일: privacy@ttukddak.com
              </p>
            </div>
            <p className="text-muted-foreground mb-4 text-sm">
              개인정보 관련 문의, 불만 처리, 피해 구제 등에 관한 사항은 위 연락처로 문의해주시기 바랍니다.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">10. 권익침해 구제방법</h2>
            <p className="text-muted-foreground mb-2">
              개인정보침해에 대한 신고 또는 상담이 필요한 경우 아래 기관에 문의하실 수 있습니다:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>개인정보침해 신고센터: (국번없이) 118</li>
              <li>개인정보 분쟁조정위원회: 1833-6972</li>
              <li>대검찰청 사이버수사과: (국번없이) 1301</li>
              <li>경찰청 사이버수사국: (국번없이) 182</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">부칙</h2>
            <p className="text-muted-foreground mb-4">
              이 개인정보처리방침은 2026년 4월 9일부터 시행됩니다.
            </p>
            <p className="text-muted-foreground mb-4">
              개인정보 관련 문의: privacy@ttukddak.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
