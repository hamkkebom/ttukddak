import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 inline-flex items-center" aria-label="뚝딱 홈으로 이동">
              <span className="font-display text-2xl leading-none">뚝딱</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              AI 영상 전문가를 만나는 가장 쉬운 방법
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">서비스</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/categories" className="hover:text-foreground">카테고리</Link></li>
              <li><Link href="/request" className="hover:text-foreground">견적 요청</Link></li>
              <li><Link href="/expert/register" className="hover:text-foreground">전문가 등록</Link></li>
              <li><Link href="/guide" className="hover:text-foreground">이용 가이드</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">고객지원</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/help" className="hover:text-foreground">고객센터</Link></li>
              <li><Link href="/faq" className="hover:text-foreground">자주 묻는 질문</Link></li>
              <li><Link href="/event" className="hover:text-foreground">이벤트</Link></li>
              <li><Link href="/about" className="hover:text-foreground">뚝딱 소개</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">법적 고지</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-foreground">이용약관</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">개인정보처리방침</Link></li>
            </ul>
          </div>
        </div>

        {/* Business Info */}
        <div className="border-t mt-8 pt-8">
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-slate-600">뚝딱 (TTUKDDAK)</p>
            <p>대표: [대표자명] | 사업자등록번호: [000-00-00000] | 통신판매업 신고번호: [제0000-서울XX-0000호]</p>
            <p>주소: [사업장 주소]</p>
            <p className="pt-2">&copy; {new Date().getFullYear()} 뚝딱. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
