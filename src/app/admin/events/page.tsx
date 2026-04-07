"use client";

import { Plus, Edit, Trash2, Eye, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const events = [
  { id: "E001", title: "봄맞이 첫 구매 30% 할인", type: "할인", status: "진행중", start: "2024-03-01", end: "2024-04-30", participants: 234 },
  { id: "E002", title: "전문가 등록 수수료 50% 할인", type: "수수료", status: "진행중", start: "2024-03-15", end: "2024-05-15", participants: 45 },
  { id: "E003", title: "친구 초대 이벤트", type: "초대", status: "진행중", start: "상시", end: "상시", participants: 892 },
  { id: "E004", title: "AI 영상 콘테스트", type: "콘테스트", status: "예정", start: "2024-05-01", end: "2024-05-31", participants: 0 },
  { id: "E005", title: "여름 특별 할인전", type: "할인", status: "예정", start: "2024-06-01", end: "2024-06-30", participants: 0 },
  { id: "E006", title: "겨울 얼리버드", type: "할인", status: "종료", start: "2024-01-01", end: "2024-01-31", participants: 567 },
];

const coupons = [
  { code: "WELCOME30", discount: "30%", issued: 1200, used: 234, active: true },
  { code: "SPRING2024", discount: "20%", issued: 500, used: 189, active: true },
  { code: "FRIEND10K", discount: "1만원", issued: 892, used: 445, active: true },
  { code: "WINTER2024", discount: "25%", issued: 800, used: 567, active: false },
];

const statusColors: Record<string, string> = {
  "진행중": "bg-green-100 text-green-700",
  "예정": "bg-blue-100 text-blue-700",
  "종료": "bg-slate-100 text-slate-700",
};

export default function AdminEventsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">이벤트 & 쿠폰 관리</h1>
        <Button><Plus className="h-4 w-4 mr-2" /> 이벤트 추가</Button>
      </div>

      {/* Events */}
      <Card className="mb-8">
        <CardContent className="p-0 overflow-x-auto">
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
              {events.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4 font-medium">{e.title}</td>
                  <td className="p-4"><Badge variant="outline">{e.type}</Badge></td>
                  <td className="p-4 text-center"><Badge variant="secondary" className={statusColors[e.status]}>{e.status}</Badge></td>
                  <td className="p-4 text-muted-foreground text-xs">{e.start} ~ {e.end}</td>
                  <td className="p-4 text-right font-medium">{e.participants}명</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Coupons */}
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Tag className="h-5 w-5" /> 쿠폰 관리</h2>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
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
                <tr key={c.code} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4 font-mono font-medium">{c.code}</td>
                  <td className="p-4">{c.discount}</td>
                  <td className="p-4 text-right">{c.issued}</td>
                  <td className="p-4 text-right">{c.used}</td>
                  <td className="p-4 text-right text-muted-foreground">{Math.round((c.used / c.issued) * 100)}%</td>
                  <td className="p-4 text-center">
                    <Badge variant="secondary" className={c.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}>
                      {c.active ? "활성" : "종료"}
                    </Badge>
                  </td>
                  <td className="p-4 text-center"><Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
