"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, ChevronRight, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getOrderByIdClient, getServiceByIdClient, getExpertByIdClient } from "@/lib/db-client";
import { createClient } from "@/lib/supabase/client";
import type { Order, Service, Expert } from "@/types";

const ratingLabels: Record<number, string> = {
  1: "별로예요",
  2: "아쉬워요",
  3: "보통이에요",
  4: "만족해요",
  5: "최고예요!",
};

interface RatingCategory {
  id: string;
  label: string;
  description: string;
}

const ratingCategories: RatingCategory[] = [
  { id: "quality", label: "작업 품질", description: "결과물의 완성도" },
  { id: "communication", label: "소통", description: "응답 속도와 친절도" },
  { id: "delivery", label: "납기 준수", description: "약속된 일정 이행" },
];

export default function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({
    quality: 0,
    communication: 0,
    delivery: 0,
  });
  const [reviewText, setReviewText] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    getOrderByIdClient(id).then(async (o) => {
      if (o) {
        setOrder(o);
        const [svc, exp] = await Promise.all([
          getServiceByIdClient(o.serviceId),
          getExpertByIdClient(o.expertId),
        ]);
        setService(svc);
        setExpert(exp);
      }
      setLoading(false);
    });
  }, [id]);

  const handleCategoryRating = (catId: string, rating: number) => {
    setCategoryRatings((prev) => ({ ...prev, [catId]: rating }));
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast.error("별점을 선택해주세요");
      return;
    }
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user || !order) return;

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        serviceId: order.serviceId,
        reviewerId: user.id,
        reviewerName: user.user_metadata?.name || user.email?.split("@")[0] || "사용자",
        rating: overallRating,
        content: reviewText,
      }),
    });

    if (res.ok) {
      toast.success("리뷰가 등록되었습니다!", { description: "소중한 리뷰 감사합니다." });
      router.push("/mypage");
    } else {
      toast.error("리뷰 등록에 실패했습니다");
    }
  };

  const StarRating = ({
    value,
    onChange,
    size = "md",
    hoverable = true,
  }: {
    value: number;
    onChange: (v: number) => void;
    size?: "sm" | "md" | "lg";
    hoverable?: boolean;
  }) => {
    const [localHover, setLocalHover] = useState(0);
    const sizeClass = size === "lg" ? "h-10 w-10" : size === "md" ? "h-7 w-7" : "h-5 w-5";

    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const starValue = i + 1;
          const filled = starValue <= (hoverable ? (localHover || value) : value);
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => hoverable && setLocalHover(starValue)}
              onMouseLeave={() => hoverable && setLocalHover(0)}
              onClick={() => onChange(starValue)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  sizeClass,
                  filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                )}
              />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Breadcrumb */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/mypage" className="text-muted-foreground hover:text-foreground">마이페이지</Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">리뷰 작성</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold text-center mb-2">리뷰 작성</h1>
          <p className="text-muted-foreground text-center mb-8">
            서비스 이용 경험을 공유해주세요
          </p>

          {/* Service Info */}
          <Card className="mb-6">
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={expert?.profileImage} />
                <AvatarFallback>{expert?.name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{expert?.name || "전문가"}</p>
                <p className="text-xs text-muted-foreground">{service?.title || "서비스"} · {order?.packageName || ""} 패키지</p>
              </div>
            </CardContent>
          </Card>

          {/* Overall Rating */}
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <h2 className="font-semibold mb-4">전체 만족도</h2>
              <StarRating value={overallRating} onChange={setOverallRating} size="lg" />
              {overallRating > 0 && (
                <p className="mt-3 text-lg font-semibold text-primary">
                  {ratingLabels[overallRating]}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Category Ratings */}
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-base">세부 평가</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {ratingCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                  <StarRating
                    value={categoryRatings[cat.id]}
                    onChange={(v) => handleCategoryRating(cat.id, v)}
                    size="sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Review Text */}
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-base">상세 리뷰</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="서비스 이용 경험을 자세히 작성해주세요. 다른 고객에게 큰 도움이 됩니다. (최소 20자)"
                rows={5}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground text-right">
                {reviewText.length}/20자 이상
              </p>

              {/* Photo Upload */}
              <div>
                <p className="text-sm font-medium mb-2">사진 첨부 (선택)</p>
                <div className="flex gap-2">
                  <div className="h-20 w-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1">추가</span>
                  </div>
                </div>
              </div>

              {/* Public Toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium">리뷰 공개</p>
                  <p className="text-xs text-muted-foreground">다른 고객에게 리뷰가 표시됩니다</p>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-5 w-5 accent-primary"
                />
              </label>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/mypage">나중에 작성</Link>
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              리뷰 등록
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
