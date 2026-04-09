"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Upload, Plus, X,
  User, Briefcase, FileText, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getCategoriesClient, createExpertApplicationClient } from "@/lib/db-client";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types";

const steps = [
  { id: 1, title: "기본 정보", icon: User },
  { id: 2, title: "전문 분야", icon: Briefcase },
  { id: 3, title: "포트폴리오", icon: FileText },
  { id: 4, title: "완료", icon: CheckCircle },
];

const allSkills = [
  "After Effects", "Premiere Pro", "DaVinci Resolve", "Final Cut Pro",
  "Cinema 4D", "Blender", "Maya", "3ds Max",
  "Photoshop", "Illustrator", "Figma",
  "Sora", "Runway", "Pika", "Midjourney", "DALL-E",
  "Lottie", "Rive", "Motion",
];

export default function ExpertRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: "",
    email: "",
    phone: "",
    introduction: "",
    // Step 2: Expertise
    category: "",
    skills: [] as string[],
    experience: "",
    // Step 3: Portfolio
    portfolioLinks: [""],
  });

  useEffect(() => {
    getCategoriesClient().then(setCategories);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const addPortfolioLink = () => {
    setFormData((prev) => ({
      ...prev,
      portfolioLinks: [...prev.portfolioLinks, ""],
    }));
  };

  const removePortfolioLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.filter((_, i) => i !== index),
    }));
  };

  const updatePortfolioLink = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.map((link, i) => (i === index ? value : link)),
    }));
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) { toast.error("이름을 입력해주세요"); return false; }
      if (!formData.email.trim()) { toast.error("이메일을 입력해주세요"); return false; }
      if (formData.introduction.length < 30) { toast.error("자기소개를 30자 이상 입력해주세요"); return false; }
    }
    if (currentStep === 2) {
      if (!formData.category) { toast.error("카테고리를 선택해주세요"); return false; }
      if (formData.skills.length === 0) { toast.error("스킬을 1개 이상 선택해주세요"); return false; }
      if (!formData.experience) { toast.error("경력을 선택해주세요"); return false; }
    }
    if (currentStep === 3) {
      if (formData.portfolioLinks.every((l) => !l.trim())) { toast.error("포트폴리오 링크를 1개 이상 입력해주세요"); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();

    if (!user) {
      toast.error("로그인이 필요합니다");
      router.push("/login");
      setSubmitting(false);
      return;
    }

    const categoryName = categories.find((c) => c.id === formData.category)?.name || formData.category;

    const ok = await createExpertApplicationClient({
      userId: user.id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      category: categoryName,
      skills: formData.skills,
      portfolioUrls: formData.portfolioLinks.filter((l) => l.trim()),
      introduction: formData.introduction || undefined,
    });

    setSubmitting(false);

    if (ok) {
      toast.success("전문가 등록 신청이 완료되었습니다!", { description: "심사 결과는 마이페이지에서 확인할 수 있습니다." });
      router.push("/mypage");
    } else {
      toast.error("등록에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-2xl">뚝딱</span>
            </Link>
            <h1 className="text-2xl font-bold mt-6">전문가 등록</h1>
            <p className="text-muted-foreground mt-2">
              뚝딱의 전문가가 되어 수익을 창출하세요
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                      currentStep >= step.id
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs mt-2 font-medium",
                      currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-16 mx-2",
                      currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          <Card>
            <CardContent className="p-6">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">이름 (활동명)</label>
                        <Input
                          name="name"
                          placeholder="전문가로 활동할 이름을 입력하세요"
                          value={formData.name}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">이메일</label>
                        <Input
                          type="email"
                          name="email"
                          placeholder="example@email.com"
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">연락처</label>
                        <Input
                          type="tel"
                          name="phone"
                          placeholder="010-1234-5678"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">자기소개</label>
                        <textarea
                          name="introduction"
                          placeholder="전문가로서의 경험과 강점을 소개해주세요 (최소 100자)"
                          value={formData.introduction}
                          onChange={handleChange}
                          rows={5}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.introduction.length}/100자
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Expertise */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-4">전문 분야</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">주요 카테고리</label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, category: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="주요 활동 카테고리를 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">
                          보유 스킬 (복수 선택)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {allSkills.map((skill) => (
                            <Badge
                              key={skill}
                              variant={formData.skills.includes(skill) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => toggleSkill(skill)}
                            >
                              {formData.skills.includes(skill) && (
                                <Check className="h-3 w-3 mr-1" />
                              )}
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">경력</label>
                        <Select
                          value={formData.experience}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, experience: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="경력을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1년 미만</SelectItem>
                            <SelectItem value="1-3">1~3년</SelectItem>
                            <SelectItem value="3-5">3~5년</SelectItem>
                            <SelectItem value="5-10">5~10년</SelectItem>
                            <SelectItem value="10+">10년 이상</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Portfolio */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-4">포트폴리오</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      작업물을 확인할 수 있는 링크를 등록해주세요 (YouTube, Vimeo, Behance 등)
                    </p>
                    <div className="space-y-3">
                      {formData.portfolioLinks.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="https://..."
                            value={link}
                            onChange={(e) => updatePortfolioLink(index, e.target.value)}
                          />
                          {formData.portfolioLinks.length > 1 && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removePortfolioLink(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={addPortfolioLink}
                        className="w-full gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        링크 추가
                      </Button>
                    </div>
                  </div>

                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <p className="font-medium mb-1">파일 업로드</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      포트폴리오 이미지나 영상을 업로드하세요
                    </p>
                    <Button variant="outline">파일 선택</Button>
                  </div>
                </div>
              )}

              {/* Step 4: Complete */}
              {currentStep === 4 && (
                <div className="text-center py-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">등록 준비 완료!</h2>
                  <p className="text-muted-foreground mb-6">
                    아래 정보를 확인하고 등록을 완료해주세요
                  </p>

                  <div className="text-left bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">이름</span>
                      <span className="font-medium">{formData.name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">이메일</span>
                      <span className="font-medium">{formData.email || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">카테고리</span>
                      <span className="font-medium">
                        {categories.find((c) => c.id === formData.category)?.name || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">스킬</span>
                      <span className="font-medium">
                        {formData.skills.length > 0 ? `${formData.skills.length}개` : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">포트폴리오</span>
                      <span className="font-medium">
                        {formData.portfolioLinks.filter((l) => l).length}개 링크
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-6">
                    등록 신청 후 심사를 거쳐 승인이 완료되면 전문가로 활동할 수 있습니다.
                    <br />
                    심사는 영업일 기준 1~3일 소요됩니다.
                  </p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                {currentStep > 1 ? (
                  <Button variant="outline" onClick={handlePrev}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    이전
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <Button onClick={handleNext}>
                    다음
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "신청 중..." : "등록 신청"}
                    <Check className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
