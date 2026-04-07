"use client";

import { Plus, GripVertical, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categories } from "@/data/categories";
import { getServicesByCategory } from "@/data/services";
import { getExpertsByCategory } from "@/data/experts";

export default function AdminCategoriesPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">카테고리 관리</h1>
          <p className="text-muted-foreground text-sm">{categories.length}개 카테고리</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> 카테고리 추가</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 p-4"></th>
                <th className="text-left p-4 font-medium">카테고리</th>
                <th className="text-left p-4 font-medium">슬러그</th>
                <th className="text-right p-4 font-medium">서비스 수</th>
                <th className="text-right p-4 font-medium">전문가 수</th>
                <th className="text-center p-4 font-medium">상태</th>
                <th className="text-center p-4 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const serviceCount = getServicesByCategory(cat.id).length;
                const expertCount = getExpertsByCategory(cat.id).length;
                return (
                  <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4 text-center cursor-grab"><GripVertical className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                    <td className="p-4">
                      <p className="font-medium">{cat.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-[300px] truncate">{cat.description}</p>
                    </td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{cat.slug}</td>
                    <td className="p-4 text-right font-medium">{serviceCount}</td>
                    <td className="p-4 text-right font-medium">{expertCount}</td>
                    <td className="p-4 text-center"><Badge variant="secondary" className="bg-green-100 text-green-700">활성</Badge></td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
