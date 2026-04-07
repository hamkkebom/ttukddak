"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  User, Lock, CreditCard, Bell, Building2, ArrowLeft, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Tab = "profile" | "bank" | "notifications";

export default function DashboardSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState({
    name: "김영상",
    email: "kim@email.com",
    phone: "010-9876-5432",
    title: "AI 영상 크리에이터",
    introduction: "5년차 영상 크리에이터입니다.",
  });
  const [bank, setBank] = useState({
    bankName: "신한은행",
    accountNumber: "110-***-***234",
    accountHolder: "김영상",
    taxType: "개인사업자",
    businessNumber: "123-45-67890",
  });

  const tabs = [
    { id: "profile" as Tab, icon: User, label: "프로필 관리" },
    { id: "bank" as Tab, icon: CreditCard, label: "정산 계좌" },
    { id: "notifications" as Tab, icon: Bell, label: "알림 설정" },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">전문가 설정</h1>
      </div>

      <div className="grid lg:grid-cols-4 gap-8 max-w-5xl">
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  activeTab === tab.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                )}
              >
                <tab.icon className="h-4 w-4" /> {tab.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>전문가 프로필</CardTitle>
                <CardDescription>고객에게 보여지는 프로필 정보입니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-2xl font-bold text-white">
                    김
                  </div>
                  <div>
                    <Button variant="outline" size="sm">사진 변경</Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG (최대 2MB)</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">활동명</label>
                    <Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">직함</label>
                    <Input value={profile.title} onChange={(e) => setProfile((p) => ({ ...p, title: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">이메일</label>
                  <Input value={profile.email} disabled className="bg-muted" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">연락처</label>
                  <Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">소개</label>
                  <textarea
                    value={profile.introduction}
                    onChange={(e) => setProfile((p) => ({ ...p, introduction: e.target.value }))}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => toast.success("저장되었습니다")}>저장</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "bank" && (
            <Card>
              <CardHeader>
                <CardTitle>정산 계좌 관리</CardTitle>
                <CardDescription>수익이 입금될 계좌 정보입니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">은행</span><span className="font-medium">{bank.bankName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">계좌번호</span><span className="font-medium">{bank.accountNumber}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">예금주</span><span className="font-medium">{bank.accountHolder}</span></div>
                </div>
                <Button variant="outline">계좌 변경</Button>
                <Separator />
                <h3 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4" /> 사업자 정보</h3>
                <div className="p-4 rounded-lg bg-muted/50 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">사업자 유형</span><Badge variant="secondary">{bank.taxType}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">사업자번호</span><span className="font-medium">{bank.businessNumber}</span></div>
                </div>
                <Button variant="outline">사업자 정보 변경</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>알림 설정</CardTitle>
                <CardDescription>전문가 활동 관련 알림을 설정합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { group: "새 주문 알림", items: ["이메일", "푸시 알림", "카카오톡"] },
                  { group: "메시지 알림", items: ["이메일", "푸시 알림"] },
                  { group: "견적 요청 알림", items: ["이메일", "푸시 알림"] },
                  { group: "정산 알림", items: ["이메일"] },
                ].map((section) => (
                  <div key={section.group}>
                    <h3 className="text-sm font-semibold mb-3">{section.group}</h3>
                    <div className="space-y-3">
                      {section.items.map((item) => (
                        <label key={item} className="flex items-center justify-between cursor-pointer">
                          <span className="text-sm">{item}</span>
                          <Checkbox checked={true} onCheckedChange={() => {}} />
                        </label>
                      ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
                <div className="flex justify-end"><Button onClick={() => toast.success("저장되었습니다")}>저장</Button></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
