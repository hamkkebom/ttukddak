import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-slate-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-orange-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg">뚝딱</span>
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
              <li><Link href="/about" className="hover:text-foreground">회사 소개</Link></li>
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

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} 뚝딱. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
