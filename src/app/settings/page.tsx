"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  User, Lock, Bell, Shield, Trash2, ChevronRight,
  Mail, Smartphone, Eye, EyeOff, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "password" | "notifications" | "privacy";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [profileData, setProfileData] = useState({
    name: "홍길동",
    email: "hong@email.com",
    phone: "010-1234-5678",
    bio: "",
  });
  const [passwordData, setPasswordData] = useState({
    current: "",
    newPw: "",
    confirm: "",
  });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [notifSettings, setNotifSettings] = useState({
    orderEmail: true,
    orderPush: true,
    messageEmail: true,
    messagePush: true,
    reviewEmail: false,
    reviewPush: true,
    promoEmail: false,
    promoPush: false,
    marketingEmail: false,
  });

  const tabs = [
    { id: "profile" as SettingsTab, icon: User, label: "프로필 수정" },
    { id: "password" as SettingsTab, icon: Lock, label: "비밀번호 변경" },
    { id: "notifications" as SettingsTab, icon: Bell, label: "알림 설정" },
    { id: "privacy" as SettingsTab, icon: Shield, label: "개인정보 및 탈퇴" },
  ];

  const handleProfileSave = () => toast.success("프로필이 저장되었습니다");
  const handlePasswordSave = () => {
    toast.success("비밀번호가 변경되었습니다");
    setPasswordData({ current: "", newPw: "", confirm: "" });
  };
  const handleNotifSave = () => toast.success("알림 설정이 저장되었습니다");

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/mypage"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">계정 설정</h1>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 max-w-5xl">
          {/* Sidebar */}
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
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Profile */}
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>프로필 수정</CardTitle>
                  <CardDescription>기본 프로필 정보를 수정합니다</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                      홍
                    </div>
                    <div>
                      <Button variant="outline" size="sm">사진 변경</Button>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG (최대 2MB)</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">이름</label>
                    <Input value={profileData.name} onChange={(e) => setProfileData((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">이메일</label>
                    <Input value={profileData.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground mt-1">이메일은 변경할 수 없습니다</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">휴대폰</label>
                    <Input value={profileData.phone} onChange={(e) => setProfileData((p) => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">소개</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData((p) => ({ ...p, bio: e.target.value }))}
                      placeholder="간단한 자기 소개를 입력하세요"
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="flex justify-end"><Button onClick={handleProfileSave}>저장</Button></div>
                </CardContent>
              </Card>
            )}

            {/* Password */}
            {activeTab === "password" && (
              <Card>
                <CardHeader>
                  <CardTitle>비밀번호 변경</CardTitle>
                  <CardDescription>보안을 위해 정기적으로 비밀번호를 변경해주세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(["current", "newPw", "confirm"] as const).map((field) => (
                    <div key={field}>
                      <label className="text-sm font-medium mb-1.5 block">
                        {field === "current" ? "현재 비밀번호" : field === "newPw" ? "새 비밀번호" : "새 비밀번호 확인"}
                      </label>
                      <div className="relative">
                        <Input
                          type={showPw[field] ? "text" : "password"}
                          value={passwordData[field]}
                          onChange={(e) => setPasswordData((p) => ({ ...p, [field]: e.target.value }))}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((p) => ({ ...p, [field]: !p[field] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPw[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end"><Button onClick={handlePasswordSave}>변경</Button></div>
                </CardContent>
              </Card>
            )}

            {/* Notifications */}
            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>알림 설정</CardTitle>
                  <CardDescription>알림 수신 방법을 설정합니다</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { group: "주문 알림", items: [
                      { key: "orderEmail", icon: Mail, label: "이메일" },
                      { key: "orderPush", icon: Smartphone, label: "푸시 알림" },
                    ]},
                    { group: "메시지 알림", items: [
                      { key: "messageEmail", icon: Mail, label: "이메일" },
                      { key: "messagePush", icon: Smartphone, label: "푸시 알림" },
                    ]},
                    { group: "리뷰 알림", items: [
                      { key: "reviewEmail", icon: Mail, label: "이메일" },
                      { key: "reviewPush", icon: Smartphone, label: "푸시 알림" },
                    ]},
                    { group: "프로모션", items: [
                      { key: "promoEmail", icon: Mail, label: "이메일" },
                      { key: "promoPush", icon: Smartphone, label: "푸시 알림" },
                    ]},
                  ].map((section) => (
                    <div key={section.group}>
                      <h3 className="text-sm font-semibold mb-3">{section.group}</h3>
                      <div className="space-y-3">
                        {section.items.map((item) => (
                          <label key={item.key} className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-2">
                              <item.icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{item.label}</span>
                            </div>
                            <Checkbox
                              checked={notifSettings[item.key as keyof typeof notifSettings]}
                              onCheckedChange={(v) => setNotifSettings((p) => ({ ...p, [item.key]: v }))}
                            />
                          </label>
                        ))}
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                  <div className="flex justify-end"><Button onClick={handleNotifSave}>저장</Button></div>
                </CardContent>
              </Card>
            )}

            {/* Privacy & Delete */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>개인정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/privacy" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                      <span className="text-sm">개인정보처리방침 확인</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                    <Link href="/terms" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                      <span className="text-sm">이용약관 확인</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </CardContent>
                </Card>

                <Card className="border-destructive/30">
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                      <Trash2 className="h-5 w-5" /> 회원 탈퇴
                    </CardTitle>
                    <CardDescription>
                      탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
                      진행 중인 거래가 있는 경우 모든 거래 완료 후 탈퇴가 가능합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" size="sm">회원 탈퇴</Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
