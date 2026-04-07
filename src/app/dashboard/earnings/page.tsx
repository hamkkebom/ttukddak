"use client";

import { Download, DollarSign, TrendingUp, CheckCircle, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const earnings = [
  { id: "STL-301", service: "AI 프리미엄 뮤직비디오", client: "김의뢰", pkg: "스탠다드", gross: 300000, fee: 30000, net: 270000, status: "정산완료", orderDate: "2024-03-05", paidDate: "2024-03-10" },
  { id: "STL-298", service: "Runway 시네마틱 영상", client: "오만족", pkg: "프리미엄", gross: 700000, fee: 70000, net: 630000, status: "정산예정", orderDate: "2024-03-10", paidDate: "" },
  { id: "STL-295", service: "AI 프리미엄 뮤직비디오", client: "한재주", pkg: "프리미엄", gross: 500000, fee: 50000, net: 450000, status: "정산완료", orderDate: "2024-02-20", paidDate: "2024-02-25" },
  { id: "STL-290", service: "AI 프리미엄 뮤직비디오", client: "정감사", pkg: "베이직", gross: 150000, fee: 15000, net: 135000, status: "정산완료", orderDate: "2024-02-10", paidDate: "2024-02-15" },
  { id: "STL-285", service: "Runway 시네마틱 영상", client: "강교수", pkg: "스탠다드", gross: 400000, fee: 40000, net: 360000, status: "정산완료", orderDate: "2024-01-25", paidDate: "2024-01-30" },
];

const statusColors: Record<string, string> = {
  "정산완료": "bg-green-100 text-green-700",
  "정산예정": "bg-blue-100 text-blue-700",
};

const monthlyEarnings = [
  { month: "1월", gross: 550000, net: 495000 },
  { month: "2월", gross: 650000, net: 585000 },
  { month: "3월", gross: 1000000, net: 900000 },
];

export default function DashboardEarningsPage() {
  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);
  const totalNet = earnings.filter((e) => e.status === "정산완료").reduce((s, e) => s + e.net, 0);
  const pendingNet = earnings.filter((e) => e.status === "정산예정").reduce((s, e) => s + e.net, 0);
  const totalFee = earnings.reduce((s, e) => s + e.fee, 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">수익 & 정산</h1>
          <p className="text-muted-foreground text-sm">정산 내역 및 수익 현황</p>
        </div>
        <Button variant="outline"><Download className="h-4 w-4 mr-2" /> 내보내기</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">정산 완료</span>
            </div>
            <p className="text-2xl font-bold">{fmt(totalNet)}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">정산 예정</span>
            </div>
            <p className="text-2xl font-bold">{fmt(pendingNet)}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">누적 수수료</span>
            </div>
            <p className="text-2xl font-bold text-muted-foreground">{fmt(totalFee)}원</p>
            <p className="text-xs text-muted-foreground mt-1">수수료율 10%</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card className="mb-8">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> 월별 수익</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyEarnings.map((m) => (
              <div key={m.month} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-10">{m.month}</span>
                <div className="flex-1">
                  <div className="w-full bg-muted rounded-full h-4">
                    <div className="bg-primary rounded-full h-4" style={{ width: `${(m.net / 1000000) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right w-24">
                  <p className="text-sm font-medium">{fmt(m.net)}</p>
                  <p className="text-[10px] text-muted-foreground">총 {fmt(m.gross)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settlement List */}
      <Card>
        <CardHeader><CardTitle className="text-base">정산 내역</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium">정산번호</th>
              <th className="text-left p-4 font-medium">서비스</th>
              <th className="text-left p-4 font-medium">의뢰인</th>
              <th className="text-right p-4 font-medium">거래액</th>
              <th className="text-right p-4 font-medium">수수료</th>
              <th className="text-right p-4 font-medium">정산액</th>
              <th className="text-center p-4 font-medium">상태</th>
              <th className="text-left p-4 font-medium">정산일</th>
            </tr></thead>
            <tbody>
              {earnings.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4 font-mono text-xs">{e.id}</td>
                  <td className="p-4 max-w-[180px] truncate">{e.service}</td>
                  <td className="p-4 text-muted-foreground">{e.client}</td>
                  <td className="p-4 text-right">{fmt(e.gross)}</td>
                  <td className="p-4 text-right text-muted-foreground">-{fmt(e.fee)}</td>
                  <td className="p-4 text-right font-medium">{fmt(e.net)}</td>
                  <td className="p-4 text-center"><Badge variant="secondary" className={statusColors[e.status]}>{e.status}</Badge></td>
                  <td className="p-4 text-muted-foreground text-xs">{e.paidDate || "예정"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
