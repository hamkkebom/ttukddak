import { Download, TrendingUp, Users, ShoppingBag, DollarSign, Star, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const monthlyData = [
  { month: "2023.10", users: 3200, orders: 312, revenue: 32000000, avgRating: 4.82 },
  { month: "2023.11", users: 3580, orders: 345, revenue: 35000000, avgRating: 4.84 },
  { month: "2023.12", users: 3950, orders: 398, revenue: 41000000, avgRating: 4.85 },
  { month: "2024.01", users: 4280, orders: 367, revenue: 38000000, avgRating: 4.86 },
  { month: "2024.02", users: 4700, orders: 425, revenue: 42000000, avgRating: 4.88 },
  { month: "2024.03", users: 5234, orders: 487, revenue: 45200000, avgRating: 4.89 },
];

const topExperts = [
  { name: "김영상", category: "AI 영상", revenue: 12500000, orders: 87, rating: 4.9 },
  { name: "정유튜", category: "유튜브/숏폼", revenue: 8900000, orders: 156, rating: 4.7 },
  { name: "이모션", category: "모션그래픽", revenue: 7800000, orders: 68, rating: 4.8 },
  { name: "최삼디", category: "3D 애니메이션", revenue: 6500000, orders: 42, rating: 4.95 },
  { name: "강교육", category: "교육", revenue: 5200000, orders: 78, rating: 4.85 },
];

const topCategories = [
  { name: "유튜브/숏폼", orders: 156, revenue: 15600000, share: 28 },
  { name: "AI 영상 생성", orders: 98, revenue: 14200000, share: 25 },
  { name: "모션그래픽", orders: 87, revenue: 8700000, share: 15 },
  { name: "제품/광고 영상", orders: 65, revenue: 7800000, share: 14 },
  { name: "교육/강의", orders: 45, revenue: 5400000, share: 10 },
  { name: "기타", orders: 36, revenue: 4500000, share: 8 },
];

export default function AdminReportsPage() {
  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);
  const latestMonth = monthlyData[monthlyData.length - 1];
  const prevMonth = monthlyData[monthlyData.length - 2];
  const revenueGrowth = ((latestMonth.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1);
  const maxRevenue = Math.max(...monthlyData.map((m) => m.revenue));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">리포트</h1>
          <p className="text-muted-foreground text-sm">매출 및 운영 분석</p>
        </div>
        <Button variant="outline"><Download className="h-4 w-4 mr-2" /> PDF 내보내기</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: DollarSign, label: "이번 달 매출", value: `${(latestMonth.revenue / 1000000).toFixed(1)}M`, sub: `전월대비 +${revenueGrowth}%` },
          { icon: ShoppingBag, label: "이번 달 거래", value: `${latestMonth.orders}건`, sub: `전월대비 +${latestMonth.orders - prevMonth.orders}건` },
          { icon: Users, label: "누적 회원", value: fmt(latestMonth.users), sub: `신규 +${latestMonth.users - prevMonth.users}명` },
          { icon: Star, label: "평균 평점", value: latestMonth.avgRating.toFixed(2), sub: "전체 서비스 기준" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-green-600 mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Trend */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> 월별 매출 추이</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyData.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16">{m.month}</span>
                  <div className="flex-1 bg-muted rounded-full h-4">
                    <div className="bg-primary rounded-full h-4" style={{ width: `${(m.revenue / maxRevenue) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium w-14 text-right">{(m.revenue / 1000000).toFixed(1)}M</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Share */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> 카테고리별 매출</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{cat.name}</span>
                    <span className="text-muted-foreground">{cat.share}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary rounded-full h-2.5" style={{ width: `${cat.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Experts */}
      <Card>
        <CardHeader><CardTitle className="text-base">Top 전문가 (매출 기준)</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium">순위</th>
              <th className="text-left p-4 font-medium">전문가</th>
              <th className="text-left p-4 font-medium">카테고리</th>
              <th className="text-right p-4 font-medium">매출</th>
              <th className="text-right p-4 font-medium">거래수</th>
              <th className="text-right p-4 font-medium">평점</th>
            </tr></thead>
            <tbody>
              {topExperts.map((e, i) => (
                <tr key={e.name} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4"><Badge variant={i < 3 ? "default" : "secondary"}>{i + 1}</Badge></td>
                  <td className="p-4 font-medium">{e.name}</td>
                  <td className="p-4 text-muted-foreground">{e.category}</td>
                  <td className="p-4 text-right font-medium">{fmt(e.revenue)}원</td>
                  <td className="p-4 text-right">{e.orders}건</td>
                  <td className="p-4 text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{e.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
