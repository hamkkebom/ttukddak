"use client";

import { useState } from "react";
import { Search, Filter, MoreVertical, UserCheck, UserX, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const users = [
  { id: "U001", name: "홍길동", email: "hong@email.com", type: "일반", status: "활성", joinDate: "2024-01-15", orders: 5, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=u1" },
  { id: "U002", name: "김영상", email: "kim@email.com", type: "전문가", status: "활성", joinDate: "2023-03-15", orders: 234, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=expert1" },
  { id: "U003", name: "이모션", email: "lee@email.com", type: "전문가", status: "활성", joinDate: "2023-05-20", orders: 189, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=expert2" },
  { id: "U004", name: "박고객", email: "park@email.com", type: "일반", status: "활성", joinDate: "2024-02-10", orders: 3, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=u4" },
  { id: "U005", name: "최스팸", email: "choi@email.com", type: "일반", status: "정지", joinDate: "2024-03-01", orders: 0, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=u5" },
  { id: "U006", name: "정신규", email: "jung@email.com", type: "전문가", status: "승인대기", joinDate: "2024-03-18", orders: 0, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=u6" },
  { id: "U007", name: "한재주", email: "han@email.com", type: "일반", status: "활성", joinDate: "2024-01-20", orders: 8, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=u7" },
];

const statusColors: Record<string, string> = {
  "활성": "bg-green-100 text-green-700",
  "정지": "bg-red-100 text-red-700",
  "승인대기": "bg-amber-100 text-amber-700",
};

const typeColors: Record<string, string> = {
  "일반": "bg-slate-100 text-slate-700",
  "전문가": "bg-primary/10 text-primary",
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.name.includes(search) || u.email.includes(search);
    const matchType = typeFilter === "all" || u.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">회원 관리</h1>
          <p className="text-muted-foreground text-sm">총 {users.length}명</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="이름, 이메일 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="일반">일반</SelectItem>
              <SelectItem value="전문가">전문가</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">회원</th>
                  <th className="text-left p-4 font-medium">유형</th>
                  <th className="text-left p-4 font-medium">상태</th>
                  <th className="text-left p-4 font-medium">가입일</th>
                  <th className="text-right p-4 font-medium">거래수</th>
                  <th className="text-center p-4 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.image} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><Badge variant="secondary" className={typeColors[user.type]}>{user.type}</Badge></td>
                    <td className="p-4"><Badge variant="secondary" className={statusColors[user.status]}>{user.status}</Badge></td>
                    <td className="p-4 text-muted-foreground">{user.joinDate}</td>
                    <td className="p-4 text-right font-medium">{user.orders}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {user.status === "승인대기" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600"><UserCheck className="h-4 w-4" /></Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreVertical className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
