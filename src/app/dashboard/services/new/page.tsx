"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Check, Plus, X, Upload,
  Image as ImageIcon, DollarSign, Clock, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getCategoriesClient } from "@/lib/db-client";
import type { Category } from "@/types";

interface PackageData {
  name: string;
  price: string;
  deliveryDays: string;
  revisions: string;
  features: string[];
}

const defaultPackages: PackageData[] = [
  { name: "베이직", price: "", deliveryDays: "", revisions: "1", features: [""] },
  { name: "스탠다드", price: "", deliveryDays: "", revisions: "2", features: [""] },
  { name: "프리미엄", price: "", deliveryDays: "", revisions: "3", features: [""] },
];

const suggestedTags = [
  "AI영상", "모션그래픽", "유튜브", "숏폼", "광고", "3D", "애니메이션",
  "Sora", "Runway", "Pika", "Midjourney", "로고", "인트로", "제품영상",
];

export default function NewServicePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    tags: [] as string[],
    customTag: "",
  });
  const [packages, setPackages] = useState<PackageData[]>(defaultPackages);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCategoriesClient().then(setCategories).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : prev.tags.length < 10 ? [...prev.tags, tag] : prev.tags,
    }));
  };

  const addCustomTag = () => {
    if (formData.customTag.trim() && !formData.tags.includes(formData.customTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, prev.customTag.trim()],
        customTag: "",
      }));
    }
  };

  const updatePackage = (index: number, field: keyof PackageData, value: string) => {
    setPackages((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const addFeature = (pkgIndex: number) => {
    setPackages((prev) => prev.map((p, i) =>
      i === pkgIndex ? { ...p, features: [...p.features, ""] } : p
    ));
  };

  const updateFeature = (pkgIndex: number, featIndex: number, value: string) => {
    setPackages((prev) => prev.map((p, i) =>
      i === pkgIndex ? { ...p, features: p.features.map((f, j) => j === featIndex ? value : f) } : p
    ));
  };

  const removeFeature = (pkgIndex: number, featIndex: number) => {
    setPackages((prev) => prev.map((p, i) =>
      i === pkgIndex ? { ...p, features: p.features.filter((_, j) => j !== featIndex) } : p
    ));
  };

  const handleSubmit = async (submitForReview = false) => {
    if (!formData.title.trim()) { toast.error("서비스 제목을 입력해주세요"); return; }
    if (submitForReview && !formData.category) { toast.error("카테고리를 선택해주세요"); return; }

    setSubmitting(true);
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { toast.error("로그인이 필요합니다"); return; }

      const basePrice = parseInt(packages[0].price || "0", 10);
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expertId: user.id,
          categoryId: formData.category,
          title: formData.title,
          description: formData.description,
          price: basePrice,
          tags: formData.tags,
          status: submitForReview ? "pending_review" : "draft",
        }),
      });

      if (!res.ok) throw new Error("Failed to create service");

      if (submitForReview) {
        toast.success("심사 신청이 완료되었습니다!", { description: "관리자 검토 후 활성화됩니다." });
      } else {
        toast.success("임시 저장되었습니다", { description: "나중에 심사를 신청할 수 있습니다." });
      }
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("서비스 등록에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">새 서비스 등록</h1>
              <p className="text-muted-foreground text-sm">서비스 정보를 입력하고 등록하세요</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader><CardTitle className="text-base">기본 정보</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">서비스 제목</label>
                  <Input
                    name="title"
                    placeholder="고객의 눈길을 끄는 매력적인 제목을 작성하세요"
                    value={formData.title}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{formData.title.length}/50자</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">카테고리</label>
                  <Select value={formData.category} onValueChange={(v) => setFormData((p) => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">서비스 설명</label>
                  <textarea
                    name="description"
                    placeholder="서비스의 특장점, 작업 과정, 포함 사항 등을 상세히 설명해주세요"
                    value={formData.description}
                    onChange={handleChange}
                    rows={8}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader><CardTitle className="text-base">태그 (최대 10개)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={formData.tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {formData.tags.includes(tag) && <Check className="h-3 w-3 mr-1" />}
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="직접 입력"
                    value={formData.customTag}
                    onChange={(e) => setFormData((p) => ({ ...p, customTag: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                  />
                  <Button variant="outline" onClick={addCustomTag}>추가</Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.tags.filter((t) => !suggestedTags.includes(t)).map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => toggleTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader><CardTitle className="text-base">이미지 & 포트폴리오</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">대표 이미지</span>
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG, GIF (최대 5MB). 첫 번째 이미지가 대표 이미지로 사용됩니다.</p>
              </CardContent>
            </Card>

            {/* Packages */}
            <Card>
              <CardHeader><CardTitle className="text-base">패키지 가격 설정</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {packages.map((pkg, pi) => (
                  <div key={pi}>
                    {pi > 0 && <Separator className="mb-6" />}
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Badge variant={pi === 0 ? "secondary" : pi === 1 ? "default" : "outline"}>
                        {pkg.name}
                      </Badge>
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-medium mb-1 block">
                          <DollarSign className="h-3 w-3 inline" /> 가격 (원)
                        </label>
                        <Input
                          type="number"
                          placeholder="100000"
                          value={pkg.price}
                          onChange={(e) => updatePackage(pi, "price", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">
                          <Clock className="h-3 w-3 inline" /> 작업일 (일)
                        </label>
                        <Input
                          type="number"
                          placeholder="7"
                          value={pkg.deliveryDays}
                          onChange={(e) => updatePackage(pi, "deliveryDays", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">
                          <RefreshCw className="h-3 w-3 inline" /> 수정 횟수
                        </label>
                        <Input
                          type="number"
                          placeholder="2"
                          value={pkg.revisions}
                          onChange={(e) => updatePackage(pi, "revisions", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">포함 사항</label>
                      <div className="space-y-2">
                        {pkg.features.map((feat, fi) => (
                          <div key={fi} className="flex gap-2">
                            <Input
                              placeholder="예: 4K 화질, 자막 포함"
                              value={feat}
                              onChange={(e) => updateFeature(pi, fi, e.target.value)}
                            />
                            {pkg.features.length > 1 && (
                              <Button variant="ghost" size="icon" onClick={() => removeFeature(pi, fi)}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => addFeature(pi)} className="gap-1">
                          <Plus className="h-3 w-3" /> 항목 추가
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" /> 취소</Link>
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" disabled={submitting} onClick={() => handleSubmit(false)}>
                  임시 저장
                </Button>
                <Button onClick={() => handleSubmit(true)} disabled={submitting}>
                  {submitting ? "등록 중..." : "심사 신청"} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
