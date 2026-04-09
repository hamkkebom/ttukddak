"use client";

import { useState, useEffect } from "react";
import { Search, Star, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getReviewsClient } from "@/lib/db-client";
import { toast } from "sonner";
import type { Review } from "@/types";

const statusColors: Record<string, string> = {
  "정상": "bg-green-100 text-green-700",
  "신고접수": "bg-red-100 text-red-700",
  "허위의심": "bg-amber-100 text-amber-700",
  "삭제됨": "bg-slate-100 text-slate-700",
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    getReviewsClient().then((data) => {
      setReviews(data);
      setLoading(false);
    });
  }, []);

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("이 리뷰를 삭제하시겠습니까?")) return;
    const res = await fetch("/api/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reviewId }),
    });
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success("리뷰가 삭제되었습니다");
    } else {
      toast.error("삭제에 실패했습니다");
    }
  };

  const filtered = reviews.filter((r) => {
    const matchSearch = !search || r.userName.includes(search) || r.content.includes(search);
    const matchStatus = statusFilter === "all" || statusFilter === "정상";
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">리뷰 관리</h1>
        <p className="text-muted-foreground text-sm">총 {reviews.length}개 리뷰</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="작성자, 내용 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="정상">정상</SelectItem>
              <SelectItem value="신고접수">신고접수</SelectItem>
              <SelectItem value="허위의심">허위의심</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">리뷰가 없습니다</p>
        )}
        {filtered.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userId}`} />
                    <AvatarFallback>{(review.userName || "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{review.userName}</span>
                      <Badge variant="secondary" className={statusColors["정상"]}>정상</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{review.serviceId} · {review.createdAt?.split("T")[0]}</p>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                      ))}
                    </div>
                    <p className="text-sm">{review.content}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteReview(review.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
