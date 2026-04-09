"use client";

import { useState, useEffect } from "react";
import { Search, MoreVertical, UserCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getProfilesClient } from "@/lib/db-client";
import type { Profile } from "@/types";

const statusColors: Record<string, string> = {
  "활성": "bg-green-100 text-green-700",
  "정지": "bg-red-100 text-red-700",
  "승인대기": "bg-amber-100 text-amber-700",
};

const typeColors: Record<string, string> = {
  "일반": "bg-slate-100 text-slate-700",
  "전문가": "bg-primary/10 text-primary",
  "관리자": "bg-purple-100 text-purple-700",
};

const roleToType = (role: string) => {
  if (role === "expert") return "전문가";
  if (role === "admin") return "관리자";
  return "일반";
};

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    getProfilesClient().then((data) => {
      setProfiles(data);
      setLoading(false);
    });
  }, []);

  const handleChangeRole = async (userId: string, newRole: Profile["role"]) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, role: newRole }),
    });
    if (res.ok) {
      setProfiles((prev) => prev.map((p) => p.id === userId ? { ...p, role: newRole } : p));
      toast.success(`회원 유형이 변경되었습니다`);
    } else {
      toast.error("변경에 실패했습니다");
    }
  };

  const filtered = profiles.filter((u) => {
    const matchSearch = !search || u.name.includes(search) || u.email.includes(search);
    const type = roleToType(u.role);
    const matchType = typeFilter === "all" || type === typeFilter;
    return matchSearch && matchType;
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">회원 관리</h1>
          <p className="text-muted-foreground text-sm">총 {profiles.length}명</p>
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
              <SelectItem value="관리자">관리자</SelectItem>
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
                  <th className="text-center p-4 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const type = roleToType(user.role);
                  return (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} />
                            <AvatarFallback>{(user.name || "?")[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name || "(이름 없음)"}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><Badge variant="secondary" className={typeColors[type] || ""}>{type}</Badge></td>
                      <td className="p-4"><Badge variant="secondary" className={statusColors["활성"]}>활성</Badge></td>
                      <td className="p-4 text-muted-foreground">{user.createdAt?.split("T")[0] || "-"}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleChangeRole(user.id, "user")}>일반 회원으로 변경</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeRole(user.id, "expert")}>전문가로 변경</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeRole(user.id, "admin")}>관리자로 변경</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
