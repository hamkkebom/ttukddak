"use client";

import { useState } from "react";
import { Search, Star, Eye, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const reviews = [
  { id: "R001", user: "이만족", userImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=r1", service: "AI 프리미엄 뮤직비디오", expert: "김영상", rating: 5, text: "퀄리티가 기대 이상이었습니다!", date: "2024-03-18", status: "정상", reported: false },
  { id: "R002", user: "정감사", userImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=r2", service: "로고 모션그래픽", expert: "이모션", rating: 5, text: "소통이 정말 빠르고 친절해요.", date: "2024-03-16", status: "정상", reported: false },
  { id: "R003", user: "한재주", userImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=r3", service: "Runway 시네마틱", expert: "김영상", rating: 4, text: "좋았지만 색감 조정이 아쉬웠습니다.", date: "2024-03-14", status: "정상", reported: false },
  { id: "R004", user: "악성유", userImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=r4", service: "유튜브 편집", expert: "정유튜", rating: 1, text: "최악의 서비스. 돈 아깝다. (욕설 포함)", date: "2024-03-13", status: "신고접수", reported: true },
  { id: "R005", user: "홍광고", userImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=r5", service: "제품 홍보 영상", expert: "한광고", rating: 5, text: "광고 같은 의심 리뷰입니다 구매 이력 없음", date: "2024-03-12", status: "허위의심", reported: true },
  { id: "R006", user: "강교수", userImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=r6", service: "교육 콘텐츠 영상", expert: "강교육", rating: 5, text: "설명이 명확하고 퀄리티가 높습니다!", date: "2024-03-10", status: "정상", reported: false },
];

const statusColors: Record<string, string> = {
  "정상": "bg-green-100 text-green-700",
  "신고접수": "bg-red-100 text-red-700",
  "허위의심": "bg-amber-100 text-amber-700",
  "삭제됨": "bg-slate-100 text-slate-700",
};

export default function AdminReviewsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = reviews.filter((r) => {
    const matchSearch = !search || r.user.includes(search) || r.expert.includes(search) || r.text.includes(search);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">리뷰 관리</h1>
        <p className="text-muted-foreground text-sm">신고 리뷰 {reviews.filter((r) => r.reported).length}건 처리 필요</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="작성자, 전문가, 내용 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
        {filtered.map((review) => (
          <Card key={review.id} className={review.reported ? "border-red-200" : ""}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.userImg} />
                    <AvatarFallback>{review.user[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{review.user}</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-sm text-muted-foreground">{review.expert} 전문가</span>
                      <Badge variant="secondary" className={statusColors[review.status]}>{review.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{review.service} · {review.date}</p>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                      ))}
                    </div>
                    <p className="text-sm">{review.text}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-4">
                  {review.reported && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600"><CheckCircle className="h-4 w-4" /></Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
