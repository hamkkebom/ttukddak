"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, CheckCircle, XCircle, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { getExpertApplicationByUserClient } from "@/lib/db-client";
import type { ExpertApplication } from "@/types";

const statusConfig = {
  pending: { label: "심사 대기", color: "bg-amber-100 text-amber-700", icon: Clock, description: "신청서가 접수되었습니다. 영업일 기준 1~3일 내에 심사가 시작됩니다." },
  reviewing: { label: "심사 중", color: "bg-blue-100 text-blue-700", icon: FileText, description: "심사가 진행 중입니다. 포트폴리오와 경력을 검토하고 있습니다." },
  approved: { label: "승인 완료", color: "bg-green-100 text-green-700", icon: CheckCircle, description: "축하합니다! 전문가로 승인되었습니다. 대시보드에서 서비스를 등록해보세요." },
  rejected: { label: "반려", color: "bg-red-100 text-red-700", icon: XCircle, description: "안타깝게도 이번 심사에서 반려되었습니다. 포트폴리오를 보강하여 재신청해주세요." },
};

export default function ApplicationStatusPage() {
  const [application, setApplication] = useState<ExpertApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const init = async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setLoading(false); return; }
      setLoggedIn(true);
      const app = await getExpertApplicationByUserClient(user.id);
      setApplication(app);
      setLoading(false);
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">로그인이 필요합니다</p>
          <Button asChild><Link href="/login">로그인</Link></Button>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-muted/20 py-16">
        <div className="container mx-auto px-4 max-w-lg text-center">
          <h1 className="text-2xl font-bold mb-2">전문가 신청 현황</h1>
          <p className="text-muted-foreground mb-8">신청 내역이 없습니다</p>
          <Button asChild>
            <Link href="/expert/register">
              전문가 등록 신청하기 <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const status = (application.status in statusConfig ? application.status : "pending") as keyof typeof statusConfig;
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-muted/20 py-16">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">전문가 신청 현황</h1>
          <p className="text-muted-foreground text-sm">신청번호: {application.id}</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <StatusIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <Badge variant="secondary" className={`${config.color} mb-4`}>
              {config.label}
            </Badge>
            <p className="text-muted-foreground text-sm mb-6">
              {config.description}
            </p>

            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">신청자</span>
                <span className="font-medium">{application.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">카테고리</span>
                <span className="font-medium">{application.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">신청일</span>
                <span className="font-medium">{application.createdAt?.split("T")[0] || "-"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {application.status === "approved" && (
          <Button className="w-full" asChild>
            <Link href="/dashboard">
              대시보드로 이동 <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        )}
        {application.status === "rejected" && (
          <Button className="w-full" variant="outline" asChild>
            <Link href="/expert/register">다시 신청하기</Link>
          </Button>
        )}
        <Button className="w-full mt-3" variant="ghost" asChild>
          <Link href="/mypage">마이페이지로 돌아가기</Link>
        </Button>
      </div>
    </div>
  );
}
