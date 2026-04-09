"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  User, Lock, CreditCard, Bell, Building2, ArrowLeft, Eye, EyeOff, Camera, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { updateProfileClient } from "@/lib/db-client";
import { uploadFile } from "@/lib/storage";

type Tab = "profile" | "bank" | "notifications";

const BANK_STORAGE_KEY = "dashboard_bank_settings";
const NOTIF_STORAGE_KEY = "dashboard_notif_settings";

const defaultNotif: Record<string, Record<string, boolean>> = {
  "새 주문 알림": { "이메일": true, "푸시 알림": true, "카카오톡": true },
  "메시지 알림": { "이메일": true, "푸시 알림": true },
  "견적 요청 알림": { "이메일": true, "푸시 알림": true },
  "정산 알림": { "이메일": true },
};

export default function DashboardSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
    introduction: "",
  });
  const [bank, setBank] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    taxType: "개인사업자",
    businessNumber: "",
  });
  const [notifSettings, setNotifSettings] = useState(defaultNotif);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;
        setUserId(user.id);
        setAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture || "");
        setProfile({
          name: user.user_metadata?.name || user.user_metadata?.full_name || "",
          email: user.email || "",
          phone: user.user_metadata?.phone || "",
          title: user.user_metadata?.title || "",
          introduction: user.user_metadata?.introduction || "",
        });

        // Load bank from localStorage
        const savedBank = localStorage.getItem(BANK_STORAGE_KEY);
        if (savedBank) setBank(JSON.parse(savedBank));

        // Load notifications from localStorage
        const savedNotif = localStorage.getItem(NOTIF_STORAGE_KEY);
        if (savedNotif) setNotifSettings(JSON.parse(savedNotif));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setAvatarUploading(true);
    try {
      const result = await uploadFile("avatars", file, userId);
      setAvatarUrl(result.url);
      const sb = createClient();
      await sb.auth.updateUser({ data: { avatar_url: result.url } });
      await sb.from("profiles").update({ avatar_url: result.url }).eq("id", userId);
      toast.success("프로필 사진이 변경되었습니다");
    } catch {
      toast.error("사진 업로드에 실패했습니다");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleProfileSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const sb = createClient();
      await Promise.all([
        updateProfileClient(userId, { name: profile.name }),
        sb.auth.updateUser({
          data: {
            name: profile.name,
            phone: profile.phone,
            title: profile.title,
            introduction: profile.introduction,
          },
        }),
      ]);
      toast.success("저장되었습니다");
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleBankSave = () => {
    localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(bank));
    toast.success("저장되었습니다");
  };

  const handleNotifSave = () => {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifSettings));
    toast.success("저장되었습니다");
  };

  const toggleNotif = (group: string, item: string) => {
    setNotifSettings((prev) => ({
      ...prev,
      [group]: { ...prev[group], [item]: !prev[group][item] },
    }));
  };

  const tabs = [
    { id: "profile" as Tab, icon: User, label: "프로필 관리" },
    { id: "bank" as Tab, icon: CreditCard, label: "정산 계좌" },
    { id: "notifications" as Tab, icon: Bell, label: "알림 설정" },
  ];

  const avatarLetter = profile.name ? profile.name[0] : "?";

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
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      loading ? "..." : avatarLetter
                    )}
                  </div>
                  <div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={avatarUploading || loading}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {avatarUploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Camera className="h-3 w-3 mr-1" />}
                      사진 변경
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG (최대 2MB)</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">활동명</label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">직함</label>
                    <Input
                      value={profile.title}
                      onChange={(e) => setProfile((p) => ({ ...p, title: e.target.value }))}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">이메일</label>
                  <Input value={profile.email} disabled className="bg-muted" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">연락처</label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">소개</label>
                  <textarea
                    value={profile.introduction}
                    onChange={(e) => setProfile((p) => ({ ...p, introduction: e.target.value }))}
                    rows={4}
                    disabled={loading}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleProfileSave} disabled={saving || loading}>
                    {saving ? "저장 중..." : "저장"}
                  </Button>
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">은행</span>
                    <Input
                      value={bank.bankName}
                      onChange={(e) => setBank((b) => ({ ...b, bankName: e.target.value }))}
                      placeholder="신한은행"
                      className="w-40 h-6 text-right text-sm border-none bg-transparent p-0 focus-visible:ring-0"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">계좌번호</span>
                    <Input
                      value={bank.accountNumber}
                      onChange={(e) => setBank((b) => ({ ...b, accountNumber: e.target.value }))}
                      placeholder="000-000-000000"
                      className="w-40 h-6 text-right text-sm border-none bg-transparent p-0 focus-visible:ring-0"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">예금주</span>
                    <Input
                      value={bank.accountHolder}
                      onChange={(e) => setBank((b) => ({ ...b, accountHolder: e.target.value }))}
                      placeholder="홍길동"
                      className="w-40 h-6 text-right text-sm border-none bg-transparent p-0 focus-visible:ring-0"
                    />
                  </div>
                </div>
                <Button variant="outline" onClick={handleBankSave}>계좌 저장</Button>
                <Separator />
                <h3 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4" /> 사업자 정보</h3>
                <div className="p-4 rounded-lg bg-muted/50 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">사업자 유형</span>
                    <Badge variant="secondary">{bank.taxType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">사업자번호</span>
                    <Input
                      value={bank.businessNumber}
                      onChange={(e) => setBank((b) => ({ ...b, businessNumber: e.target.value }))}
                      placeholder="000-00-00000"
                      className="w-40 h-6 text-right text-sm border-none bg-transparent p-0 focus-visible:ring-0"
                    />
                  </div>
                </div>
                <Button variant="outline" onClick={handleBankSave}>사업자 정보 저장</Button>
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
                {Object.entries(notifSettings).map(([group, items]) => (
                  <div key={group}>
                    <h3 className="text-sm font-semibold mb-3">{group}</h3>
                    <div className="space-y-3">
                      {Object.entries(items).map(([item, checked]) => (
                        <label key={item} className="flex items-center justify-between cursor-pointer">
                          <span className="text-sm">{item}</span>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleNotif(group, item)}
                          />
                        </label>
                      ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button onClick={handleNotifSave}>저장</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
