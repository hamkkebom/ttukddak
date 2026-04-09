"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Coupon } from "@/types";

type Event = {
  id: string;
  title: string;
  type: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  participants_count: number;
  description: string | null;
};

type CouponFormState = {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  totalIssued: string;
  expiresAt: string;
};

const emptyCouponForm: CouponFormState = {
  code: "",
  discountType: "percent",
  discountValue: "",
  minOrderAmount: "0",
  maxDiscountAmount: "",
  totalIssued: "0",
  expiresAt: "",
};

function formatDate(d: string | null) {
  if (!d) return "상시";
  return d.split("T")[0];
}

function statusLabel(event: Event) {
  if (!event.is_active) return "종료";
  const now = new Date();
  if (event.start_date && new Date(event.start_date) > now) return "예정";
  if (event.end_date && new Date(event.end_date) < now) return "종료";
  return "진행중";
}

const statusColors: Record<string, string> = {
  "진행중": "bg-green-100 text-green-700",
  "예정": "bg-blue-100 text-blue-700",
  "종료": "bg-slate-100 text-slate-700",
};

type FormState = { title: string; type: string; startDate: string; endDate: string; description: string };
const emptyForm: FormState = { title: "", type: "할인", startDate: "", endDate: "", description: "" };

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState<CouponFormState>(emptyCouponForm);
  const [creatingCoupon, setCreatingCoupon] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Event | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoadingCoupons(true);
    try {
      const res = await fetch("/api/coupons");
      if (res.ok) {
        const json = await res.json();
        setCoupons(json.data ?? []);
      } else {
        toast.error("쿠폰 목록을 불러오지 못했습니다");
      }
    } catch {
      toast.error("쿠폰 목록 조회 중 오류가 발생했습니다");
    } finally {
      setLoadingCoupons(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/events");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setEvents(json.data ?? []);
    } catch {
      toast.error("이벤트 목록을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); fetchCoupons(); }, [fetchEvents, fetchCoupons]);

  const handleCreateCoupon = async () => {
    if (!couponForm.code || !couponForm.discountValue) {
      toast.error("쿠폰 코드와 할인 값을 입력해주세요");
      return;
    }
    setCreatingCoupon(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponForm.code,
          discountType: couponForm.discountType,
          discountValue: parseInt(couponForm.discountValue, 10),
          minOrderAmount: parseInt(couponForm.minOrderAmount || "0", 10),
          maxDiscountAmount: couponForm.maxDiscountAmount ? parseInt(couponForm.maxDiscountAmount, 10) : undefined,
          totalIssued: parseInt(couponForm.totalIssued || "0", 10),
          expiresAt: couponForm.expiresAt || undefined,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success("쿠폰이 생성되었습니다");
        setShowCouponForm(false);
        setCouponForm(emptyCouponForm);
        fetchCoupons();
      } else {
        toast.error(result.error || "쿠폰 생성에 실패했습니다");
      }
    } catch {
      toast.error("쿠폰 생성 중 오류가 발생했습니다");
    } finally {
      setCreatingCoupon(false);
    }
  };

  const handleToggleCoupon = async (coupon: Coupon) => {
    try {
      const res = await fetch("/api/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id, isActive: !coupon.isActive }),
      });
      if (res.ok) {
        toast.success(`쿠폰이 ${!coupon.isActive ? "활성화" : "비활성화"}되었습니다`);
        fetchCoupons();
      } else {
        toast.error("상태 변경에 실패했습니다");
      }
    } catch {
      toast.error("상태 변경 중 오류가 발생했습니다");
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === "percent") return `${coupon.discountValue}%`;
    return `${new Intl.NumberFormat("ko-KR").format(coupon.discountValue)}원`;
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (event: Event) => {
    setEditTarget(event);
    setForm({
      title: event.title,
      type: event.type,
      startDate: event.start_date ? event.start_date.split("T")[0] : "",
      endDate: event.end_date ? event.end_date.split("T")[0] : "",
      description: event.description ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("이벤트명을 입력하세요"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        type: form.type,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        description: form.description || null,
        isActive: true,
        ...(editTarget ? { id: editTarget.id } : {}),
      };
      const res = await fetch("/api/admin/events", {
        method: editTarget ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "저장 실패");
      }
      toast.success(editTarget ? "이벤트가 수정되었습니다" : "이벤트가 추가되었습니다");
      setShowForm(false);
      fetchEvents();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 이벤트를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제 실패");
      toast.success("이벤트가 삭제되었습니다");
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {
      toast.error("이벤트 삭제에 실패했습니다");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">이벤트 &amp; 쿠폰 관리</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> 이벤트 추가</Button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{editTarget ? "이벤트 수정" : "새 이벤트"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1 block">이벤트명 *</label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="이벤트명" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">유형</label>
                <Input value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} placeholder="할인, 콘테스트, 초대 등" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">설명</label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="간단한 설명" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">시작일</label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">종료일</label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>취소</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "저장"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events Table */}
      <Card className="mb-8">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">불러오는 중...</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">등록된 이벤트가 없습니다</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">이벤트</th>
                <th className="text-left p-4 font-medium">유형</th>
                <th className="text-center p-4 font-medium">상태</th>
                <th className="text-left p-4 font-medium">기간</th>
                <th className="text-right p-4 font-medium">참여</th>
                <th className="text-center p-4 font-medium">관리</th>
              </tr></thead>
              <tbody>
                {events.map((e) => {
                  const status = statusLabel(e);
                  return (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4 font-medium">{e.title}</td>
                      <td className="p-4"><Badge variant="outline">{e.type}</Badge></td>
                      <td className="p-4 text-center"><Badge variant="secondary" className={statusColors[status]}>{status}</Badge></td>
                      <td className="p-4 text-muted-foreground text-xs">{formatDate(e.start_date)} ~ {formatDate(e.end_date)}</td>
                      <td className="p-4 text-right font-medium">{e.participants_count}명</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Coupons */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2"><Tag className="h-5 w-5" /> 쿠폰 관리</h2>
        <Button size="sm" onClick={() => setShowCouponForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-2" /> 쿠폰 생성
        </Button>
      </div>

      {showCouponForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">새 쿠폰 생성</h3>
              <Button variant="ghost" size="icon" onClick={() => { setShowCouponForm(false); setCouponForm(emptyCouponForm); }}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">쿠폰 코드 *</label>
                <Input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="WELCOME30" className="font-mono" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">할인 유형 *</label>
                <select
                  value={couponForm.discountType}
                  onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as "percent" | "fixed" })}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="percent">퍼센트 (%)</option>
                  <option value="fixed">정액 (원)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">할인 값 * {couponForm.discountType === "percent" ? "(%)" : "(원)"}</label>
                <Input type="number" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} placeholder={couponForm.discountType === "percent" ? "10" : "10000"} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">최소 주문 금액 (원)</label>
                <Input type="number" value={couponForm.minOrderAmount} onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })} placeholder="0" />
              </div>
              {couponForm.discountType === "percent" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">최대 할인 금액 (원)</label>
                  <Input type="number" value={couponForm.maxDiscountAmount} onChange={(e) => setCouponForm({ ...couponForm, maxDiscountAmount: e.target.value })} placeholder="선택사항" />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">발급 수량</label>
                <Input type="number" value={couponForm.totalIssued} onChange={(e) => setCouponForm({ ...couponForm, totalIssued: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">만료일</label>
                <Input type="datetime-local" value={couponForm.expiresAt} onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreateCoupon} disabled={creatingCoupon}>{creatingCoupon ? "생성 중..." : "쿠폰 생성"}</Button>
              <Button variant="outline" onClick={() => { setShowCouponForm(false); setCouponForm(emptyCouponForm); }}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loadingCoupons ? (
            <div className="p-8 text-center text-muted-foreground text-sm">불러오는 중...</div>
          ) : coupons.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">등록된 쿠폰이 없습니다</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">쿠폰코드</th>
                <th className="text-left p-4 font-medium">할인</th>
                <th className="text-right p-4 font-medium">발급</th>
                <th className="text-right p-4 font-medium">사용</th>
                <th className="text-right p-4 font-medium">사용률</th>
                <th className="text-center p-4 font-medium">상태</th>
                <th className="text-center p-4 font-medium">관리</th>
              </tr></thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4 font-mono font-medium">{c.code}</td>
                    <td className="p-4">{formatDiscount(c)}</td>
                    <td className="p-4 text-right">{c.totalIssued}</td>
                    <td className="p-4 text-right">{c.totalUsed}</td>
                    <td className="p-4 text-right text-muted-foreground">
                      {c.totalIssued > 0 ? Math.round((c.totalUsed / c.totalIssued) * 100) : 0}%
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="secondary" className={c.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}>
                        {c.isActive ? "활성" : "종료"}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleToggleCoupon(c)}>
                        {c.isActive ? "비활성화" : "활성화"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
