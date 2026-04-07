"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Save, Plus, X, Image as ImageIcon,
  DollarSign, Clock, RefreshCw, Eye, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { categories } from "@/data/categories";
import { getServiceById } from "@/data/services";

export default function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const service = getServiceById(id);

  const [formData, setFormData] = useState({
    title: service?.title || "",
    category: service?.categoryId || "",
    description: service?.description || "",
    tags: service?.tags || [],
    active: true,
  });

  const [packages, setPackages] = useState(
    service?.packages.map((p) => ({
      name: p.name,
      price: String(p.price),
      deliveryDays: String(p.deliveryDays),
      revisions: String(p.revisions),
      features: p.features,
    })) || []
  );

  if (!service) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">서비스를 찾을 수 없습니다</h1>
        <Button asChild><Link href="/dashboard">대시보드로 돌아가기</Link></Button>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const updatePackage = (i: number, field: string, value: string) => {
    setPackages((p) => p.map((pkg, j) => j === i ? { ...pkg, [field]: value } : pkg));
  };

  const addFeature = (i: number) => {
    setPackages((p) => p.map((pkg, j) => j === i ? { ...pkg, features: [...pkg.features, ""] } : pkg));
  };

  const updateFeature = (pi: number, fi: number, value: string) => {
    setPackages((p) => p.map((pkg, j) =>
      j === pi ? { ...pkg, features: pkg.features.map((f, k) => k === fi ? value : f) } : pkg
    ));
  };

  const removeFeature = (pi: number, fi: number) => {
    setPackages((p) => p.map((pkg, j) =>
      j === pi ? { ...pkg, features: pkg.features.filter((_, k) => k !== fi) } : pkg
    ));
  };

  const handleSave = () => {
    toast.success("서비스가 수정되었습니다");
    router.push("/dashboard");
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">서비스 수정</h1>
              <p className="text-muted-foreground text-sm">{service.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/service/${service.id}`}><Eye className="h-4 w-4 mr-2" /> 미리보기</Link>
            </Button>
            <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">서비스 상태</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">활성</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>조회 {service.salesCount * 5}</span>
                <span>판매 {service.salesCount}건</span>
                <span>평점 {service.rating}</span>
              </div>
            </CardContent>
          </Card>

          {/* Basic */}
          <Card>
            <CardHeader><CardTitle className="text-base">기본 정보</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">서비스 제목</label>
                <Input name="title" value={formData.title} onChange={handleChange} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">카테고리</label>
                <Select value={formData.category} onValueChange={(v) => setFormData((p) => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">설명</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={8}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader><CardTitle className="text-base">이미지</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">대표 이미지</div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Packages */}
          <Card>
            <CardHeader><CardTitle className="text-base">패키지</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {packages.map((pkg, pi) => (
                <div key={pi}>
                  {pi > 0 && <Separator className="mb-6" />}
                  <h3 className="font-semibold mb-4"><Badge>{pkg.name}</Badge></h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-xs font-medium mb-1 block"><DollarSign className="h-3 w-3 inline" /> 가격</label>
                      <Input type="number" value={pkg.price} onChange={(e) => updatePackage(pi, "price", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block"><Clock className="h-3 w-3 inline" /> 작업일</label>
                      <Input type="number" value={pkg.deliveryDays} onChange={(e) => updatePackage(pi, "deliveryDays", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block"><RefreshCw className="h-3 w-3 inline" /> 수정횟수</label>
                      <Input type="number" value={pkg.revisions} onChange={(e) => updatePackage(pi, "revisions", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {pkg.features.map((feat, fi) => (
                      <div key={fi} className="flex gap-2">
                        <Input value={feat} onChange={(e) => updateFeature(pi, fi, e.target.value)} />
                        <Button variant="ghost" size="icon" onClick={() => removeFeature(pi, fi)}><X className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addFeature(pi)}><Plus className="h-3 w-3 mr-1" /> 항목 추가</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader><CardTitle className="text-base">태그</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFormData((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }))} />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" /> 취소</Link>
            </Button>
            <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" /> 저장</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
