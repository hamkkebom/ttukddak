"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileText, ArrowRight, ArrowLeft, Check, Upload, Plus, X,
  Sparkles, Calendar, DollarSign, Clock, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { categories } from "@/data/categories";

const budgetRanges = [
  { value: "under-50", label: "50만원 미만" },
  { value: "50-100", label: "50~100만원" },
  { value: "100-300", label: "100~300만원" },
  { value: "300-500", label: "300~500만원" },
  { value: "500-plus", label: "500만원 이상" },
  { value: "negotiable", label: "협의 가능" },
];

const deadlineOptions = [
  { value: "1week", label: "1주일 이내" },
  { value: "2weeks", label: "2주 이내" },
  { value: "1month", label: "1개월 이내" },
  { value: "2months", label: "2개월 이내" },
  { value: "flexible", label: "유연함" },
];

export default function RequestPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    budget: "",
    deadline: "",
    referenceLinks: [""],
    contactMethod: "message",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addReferenceLink = () => {
    setFormData((prev) => ({
      ...prev,
      referenceLinks: [...prev.referenceLinks, ""],
    }));
  };

  const removeReferenceLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      referenceLinks: prev.referenceLinks.filter((_, i) => i !== index),
    }));
  };

  const updateReferenceLink = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      referenceLinks: prev.referenceLinks.map((link, i) => (i === index ? value : link)),
    }));
  };

  const handleSubmit = () => {
    toast.success("견적 요청이 등록되었습니다!", {
      description: "전문가들의 견적을 기다려주세요.",
    });
    router.push("/mypage");
  };

  const steps = [
    { id: 1, title: "프로젝트 정보", icon: FileText },
    { id: 2, title: "상세 요구사항", icon: Sparkles },
    { id: 3, title: "예산 및 일정", icon: Calendar },
    { id: 4, title: "확인 및 등록", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">견적 요청</h1>
            <p className="text-muted-foreground mt-2">
              프로젝트를 등록하면 전문가들이 견적을 보내드립니다
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                    currentStep >= step.id
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}>
                    {currentStep > step.id ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                  </div>
                  <span className={cn(
                    "text-xs mt-2 font-medium hidden sm:block",
                    currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                  )}>{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "h-0.5 w-12 sm:w-20 mx-2",
                    currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
                  )} />
                )}
              </div>
            ))}
          </div>

          <Card>
            <CardContent className="p-6">
              {/* Step 1 */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">프로젝트 기본 정보</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">프로젝트 제목</label>
                      <Input
                        name="title"
                        placeholder="예: 30초 제품 소개 AI 영상 제작"
                        value={formData.title}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">카테고리</label>
                      <Select
                        value={formData.category}
                        onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
                      >
                        <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">상세 요구사항</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">프로젝트 설명</label>
                      <textarea
                        name="description"
                        placeholder="원하는 영상의 스타일, 용도, 참고 사항 등을 자세히 적어주세요. 구체적일수록 정확한 견적을 받을 수 있습니다."
                        value={formData.description}
                        onChange={handleChange}
                        rows={6}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">참고 자료 링크 (선택)</label>
                      <div className="space-y-2">
                        {formData.referenceLinks.map((link, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder="https://youtube.com/watch?v=..."
                              value={link}
                              onChange={(e) => updateReferenceLink(index, e.target.value)}
                            />
                            {formData.referenceLinks.length > 1 && (
                              <Button variant="outline" size="icon" onClick={() => removeReferenceLink(index)}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button variant="outline" onClick={addReferenceLink} className="w-full gap-2" size="sm">
                          <Plus className="h-4 w-4" /> 링크 추가
                        </Button>
                      </div>
                    </div>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">참고 파일 업로드</p>
                      <p className="text-xs text-muted-foreground mb-3">이미지, 영상, 문서 등</p>
                      <Button variant="outline" size="sm">파일 선택</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">예산 및 일정</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        <DollarSign className="h-4 w-4 inline mr-1" />예산 범위
                      </label>
                      <Select
                        value={formData.budget}
                        onValueChange={(v) => setFormData((prev) => ({ ...prev, budget: v }))}
                      >
                        <SelectTrigger><SelectValue placeholder="예산 범위를 선택하세요" /></SelectTrigger>
                        <SelectContent>
                          {budgetRanges.map((b) => (
                            <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        <Clock className="h-4 w-4 inline mr-1" />희망 납기
                      </label>
                      <Select
                        value={formData.deadline}
                        onValueChange={(v) => setFormData((prev) => ({ ...prev, deadline: v }))}
                      >
                        <SelectTrigger><SelectValue placeholder="납기를 선택하세요" /></SelectTrigger>
                        <SelectContent>
                          {deadlineOptions.map((d) => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">연락 방법</label>
                      <div className="flex gap-3">
                        {[
                          { value: "message", label: "플랫폼 메시지" },
                          { value: "phone", label: "전화 상담" },
                          { value: "both", label: "모두 가능" },
                        ].map((m) => (
                          <Badge
                            key={m.value}
                            variant={formData.contactMethod === m.value ? "default" : "outline"}
                            className="cursor-pointer px-4 py-2"
                            onClick={() => setFormData((prev) => ({ ...prev, contactMethod: m.value }))}
                          >
                            {m.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">견적 요청 준비 완료</h2>
                    <p className="text-muted-foreground text-sm">등록하시면 전문가들에게 알림이 발송됩니다</p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">프로젝트 제목</span>
                      <span className="font-medium">{formData.title || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">카테고리</span>
                      <span className="font-medium">{categories.find((c) => c.id === formData.category)?.name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">예산</span>
                      <span className="font-medium">{budgetRanges.find((b) => b.value === formData.budget)?.label || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">희망 납기</span>
                      <span className="font-medium">{deadlineOptions.find((d) => d.value === formData.deadline)?.label || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">참고 링크</span>
                      <span className="font-medium">{formData.referenceLinks.filter((l) => l).length}개</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      등록 후 평균 1시간 이내에 전문가들의 견적을 받아볼 수 있습니다.
                      견적은 메시지로 확인할 수 있습니다.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                {currentStep > 1 ? (
                  <Button variant="outline" onClick={() => setCurrentStep((s) => s - 1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> 이전
                  </Button>
                ) : <div />}
                {currentStep < 4 ? (
                  <Button onClick={() => setCurrentStep((s) => s + 1)}>
                    다음 <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit}>
                    견적 요청 등록 <Check className="h-4 w-4 ml-2" />
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
