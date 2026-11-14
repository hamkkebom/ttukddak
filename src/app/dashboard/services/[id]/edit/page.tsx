"use client";

import { use, useEffect, useState } from "react";
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
import { getServiceByIdClient, getCategoriesClient } from "@/lib/db-client";
import { PACKAGE_TIERS, parsePackages } from "@/lib/service-packages";
import type { Category } from "@/types";

export default function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  const [serviceStatus, setServiceStatus] = useState<string>("draft");
  const [rejectionReason, setRejectionReason] = useState<string | undefined>(undefined);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    tags: [] as string[],
    salesCount: 0,
    rating: 0,
  });

  const [packages, setPackages] = useState<{ name: string; price: string; deliveryDays: string; revisions: string; features: string[] }[]>([]);
  // 저장된 패키지가 없어 자리표시 패키지만 받은 서비스인지 (안내 문구를 보여 준다)
  const [packagesUnsaved, setPackagesUnsaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [service, cats] = await Promise.all([
          getServiceByIdClient(id),
          getCategoriesClient(),
        ]);
        setCategories(cats);
        if (!service) { setNotFound(true); return; }
        setServiceStatus(service.status || "active");
        setRejectionReason(service.rejectionReason);
        setFormData({
          title: service.title,
          category: service.categoryId,
          description: service.description,
          tags: service.tags,
          salesCount: service.salesCount,
          rating: service.rating,
        });
        // 세 등급을 늘 보여 주고, 저장된 패키지를 이름으로 맞춰 채운다.
        // 패키지가 저장되지 않은 서비스는 읽을 때 자리표시 패키지(기간·수정 횟수·포함 사항을 코드가 채운 것)가 온다.
        // 그 값은 전문가가 정한 것이 아니므로 채우지 않고, 베이직에 서비스 가격만 넣어 둔다.
        const saved = service.packages.filter((p) => !p.isPlaceholder);
        const onlyPlaceholder = saved.length === 0 && service.packages.some((p) => p.isPlaceholder);
        setPackagesUnsaved(onlyPlaceholder);
        const toForm = (p: (typeof saved)[number]) => ({
          name: p.name,
          price: String(p.price),
          deliveryDays: String(p.deliveryDays),
          revisions: String(p.revisions),
          features: p.features.length > 0 ? p.features : [""],
        });
        const tierNames: readonly string[] = PACKAGE_TIERS;
        setPackages([
          ...PACKAGE_TIERS.map((name, i) => {
            const found = saved.find((p) => p.name === name);
            if (found) return toForm(found);
            return {
              name,
              price: i === 0 && onlyPlaceholder ? String(service.price) : "",
              deliveryDays: "",
              revisions: String(i + 1),
              features: [""],
            };
          }),
          // 세 등급이 아닌 이름으로 저장된 패키지도 버리지 않고 뒤에 붙여 둔다.
          ...saved.filter((p) => !tierNames.includes(p.name)).map(toForm),
        ]);
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">불러오는 중...</div>;
  }

  if (notFound) {
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

  // 서버가 돌려준 안내 문구. 입력 문제(400)나 충돌(409)일 때만 그대로 보여 준다.
  const serverMessage = async (res: Response, fallback: string) => {
    const json = await res.json().catch(() => null);
    return (res.status === 400 || res.status === 409) && typeof json?.error === "string" ? json.error : fallback;
  };

  // 화면에 있는 내용 전체. 저장과 심사 신청이 같은 내용을 보낸다.
  // 대표 가격은 서버(DB 함수)가 가장 싼 패키지 가격으로 맞춘다.
  const contentBody = () => ({
    title: formData.title,
    description: formData.description,
    categoryId: formData.category,
    tags: formData.tags,
    packages,
  });

  const handleSave = async () => {
    // 서버와 같은 규칙으로 먼저 확인한다. 임시 저장 상태인 서비스만 패키지가 비어 있어도 된다.
    const checked = parsePackages(packages, { requireOne: serviceStatus !== "draft" });
    if (!checked.ok) { toast.error(checked.error); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentBody()),
      });
      if (!res.ok) {
        toast.error(await serverMessage(res, "저장에 실패했습니다"));
        return;
      }
      toast.success("서비스가 수정되었습니다");
      router.push("/dashboard");
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  // 심사 신청은 화면에 있는 내용을 저장하면서 함께 신청한다 (저장하지 않은 수정이 무시되지 않도록).
  const handleSubmitForReview = async () => {
    const checked = parsePackages(packages, { requireOne: true });
    if (!checked.ok) { toast.error(checked.error); return; }

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contentBody(), status: "pending_review", rejectionReason: null }),
      });
      if (!res.ok) {
        toast.error(await serverMessage(res, "심사 신청에 실패했습니다"));
        return;
      }
      setServiceStatus("pending_review");
      setRejectionReason(undefined);
      setPackagesUnsaved(false);
      toast.success("심사 신청이 완료되었습니다", { description: "관리자 검토 후 활성화됩니다." });
    } catch {
      toast.error("심사 신청에 실패했습니다");
    } finally {
      setSubmittingReview(false);
    }
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
              <p className="text-muted-foreground text-sm">{id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/services/${id}/preview`}><Eye className="h-4 w-4 mr-2" /> 미리보기</Link>
            </Button>
            <Button variant="destructive" size="icon" onClick={async () => {
              if (!confirm("정말 이 서비스를 삭제하시겠습니까?")) return;
              try {
                const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
                if (res.ok) { toast.success("서비스가 삭제되었습니다"); router.push("/dashboard"); }
                else toast.error("삭제에 실패했습니다");
              } catch { toast.error("삭제에 실패했습니다"); }
            }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">서비스 상태</span>
                  <Badge
                    variant="secondary"
                    className={
                      serviceStatus === "active" ? "bg-green-100 text-green-700" :
                      serviceStatus === "pending_review" ? "bg-amber-100 text-amber-700" :
                      serviceStatus === "rejected" ? "bg-red-100 text-red-700" :
                      serviceStatus === "suspended" ? "bg-slate-100 text-slate-700" :
                      "bg-blue-100 text-blue-700"
                    }
                  >
                    {serviceStatus === "active" ? "활성" :
                     serviceStatus === "pending_review" ? "심사중" :
                     serviceStatus === "rejected" ? "반려" :
                     serviceStatus === "suspended" ? "정지" :
                     "임시저장"}
                  </Badge>
                  {(serviceStatus === "draft" || serviceStatus === "rejected") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSubmitForReview}
                      disabled={saving || submittingReview}
                    >
                      {submittingReview ? "신청 중..." : "심사 신청"}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>판매 {formData.salesCount}건</span>
                  <span>평점 {formData.rating}</span>
                </div>
              </div>
              {serviceStatus === "rejected" && rejectionReason && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm font-medium text-red-700 mb-0.5">반려 사유</p>
                  <p className="text-sm text-red-600">{rejectionReason}</p>
                </div>
              )}
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
              {packagesUnsaved && (
                <p className="text-sm text-muted-foreground">
                  패키지 조건이 아직 저장돼 있지 않습니다. 작업 기간과 수정 횟수를 입력해 저장해 주세요. 가격은 지금 가격을 가져왔습니다.
                </p>
              )}
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
            <Button onClick={handleSave} disabled={saving || submittingReview}>
              <Save className="h-4 w-4 mr-2" /> {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
