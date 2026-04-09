"use client";

import { useState, useEffect } from "react";
import { Plus, GripVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoriesClient } from "@/lib/db-client";
import { toast } from "sonner";
import type { Category } from "@/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    getCategoriesClient().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  const handleAddCategory = async () => {
    if (!newName || !newSlug) { toast.error("이름과 슬러그를 입력하세요"); return; }
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, slug: newSlug, description: newDesc }),
    });
    if (res.ok) {
      const { data } = await res.json();
      setCategories((prev) => [...prev, { id: data.id, name: newName, slug: newSlug, description: newDesc, icon: "Sparkles", serviceCount: 0 }]);
      setAdding(false); setNewName(""); setNewSlug(""); setNewDesc("");
      toast.success("카테고리가 추가되었습니다");
    } else { toast.error("추가에 실패했습니다"); }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id); setEditName(cat.name); setEditSlug(cat.slug); setEditDesc(cat.description);
  };

  const handleEditCategory = async () => {
    if (!editingId || !editName) return;
    const res = await fetch("/api/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, name: editName, slug: editSlug, description: editDesc }),
    });
    if (res.ok) {
      setCategories((prev) => prev.map((c) => c.id === editingId ? { ...c, name: editName, slug: editSlug, description: editDesc } : c));
      setEditingId(null);
      toast.success("카테고리가 수정되었습니다");
    } else { toast.error("수정에 실패했습니다"); }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm("이 카테고리를 삭제하시겠습니까?")) return;
    const res = await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: catId }),
    });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== catId));
      toast.success("카테고리가 삭제되었습니다");
    } else {
      toast.error("삭제에 실패했습니다");
    }
  };

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
          <h1 className="text-2xl font-bold">카테고리 관리</h1>
          <p className="text-muted-foreground text-sm">{categories.length}개 카테고리</p>
        </div>
        <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4 mr-2" /> 카테고리 추가</Button>
      </div>

      {adding && (
        <Card className="mb-4">
          <CardContent className="p-4 flex items-center gap-3">
            <Input placeholder="이름" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-40" />
            <Input placeholder="슬러그" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} className="w-32" />
            <Input placeholder="설명" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="flex-1" />
            <Button size="sm" onClick={handleAddCategory}>추가</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>취소</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 p-4"></th>
                <th className="text-left p-4 font-medium">카테고리</th>
                <th className="text-left p-4 font-medium">슬러그</th>
                <th className="text-right p-4 font-medium">서비스 수</th>
                <th className="text-center p-4 font-medium">상태</th>
                <th className="text-center p-4 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4 text-center cursor-grab"><GripVertical className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                  <td className="p-4">
                    {editingId === cat.id ? (
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm" />
                    ) : (
                      <>
                        <p className="font-medium">{cat.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-[300px] truncate">{cat.description}</p>
                      </>
                    )}
                  </td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">
                    {editingId === cat.id ? (
                      <Input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className="h-8 text-xs" />
                    ) : cat.slug}
                  </td>
                  <td className="p-4 text-right font-medium">{cat.serviceCount}</td>
                  <td className="p-4 text-center"><Badge variant="secondary" className="bg-green-100 text-green-700">활성</Badge></td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {editingId === cat.id ? (
                        <>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleEditCategory}>저장</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingId(null)}>취소</Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(cat)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                        </>
                      )}
                    </div>
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
