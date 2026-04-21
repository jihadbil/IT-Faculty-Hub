import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button, Card, Modal, Input, Badge } from "@/components/ui/shared";
import { api } from "@/lib/api";

interface Department {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  coursesCount: number;
  teachersCount: number;
}

const COLORS = ["#6366F1", "#8B5CF6", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

export default function AdminDepartments() {
  const qc = useQueryClient();
  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    queryFn: () => api("/api/departments"),
  });

  const [modal, setModal] = useState<{ open: boolean; editing: Department | null }>({ open: false, editing: null });
  const [form, setForm] = useState({ name: "", description: "", color: COLORS[0] });
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setForm({ name: "", description: "", color: COLORS[0] });
    setError(null);
    setModal({ open: true, editing: null });
  };
  const openEdit = (d: Department) => {
    setForm({ name: d.name, description: d.description ?? "", color: d.color ?? COLORS[0] });
    setError(null);
    setModal({ open: true, editing: d });
  };

  const save = useMutation({
    mutationFn: async () => {
      const url = modal.editing ? `/api/departments/${modal.editing.id}` : "/api/departments";
      return api(url, { method: modal.editing ? "PUT" : "POST", body: JSON.stringify(form) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/departments"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setModal({ open: false, editing: null });
    },
    onError: (e: Error) => setError(e.message),
  });

  const del = useMutation({
    mutationFn: (id: number) => api(`/api/departments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/departments"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-border/50">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Building2 className="w-8 h-8 text-purple-700" />
            الأقسام
          </h1>
          <p className="text-muted-foreground mt-1">إدارة أقسام الكلية</p>
        </div>
        <Button onClick={openCreate} className="bg-purple-700 hover:bg-purple-800 shadow-purple-700/20">
          <Plus className="w-5 h-5 ms-2" /> إضافة قسم
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-700" /></div>
      ) : departments.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">لا توجد أقسام بعد. ابدأ بإضافة أول قسم.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(d => (
            <Card key={d.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: d.color ?? COLORS[0] }}
                >
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(d)} className="p-2 hover:bg-muted rounded-lg" title="تعديل">
                    <Pencil className="w-4 h-4 text-foreground" />
                  </button>
                  <button
                    onClick={() => confirm(`حذف قسم "${d.name}"؟`) && del.mutate(d.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
              <h3 className="font-display font-bold text-lg text-foreground">{d.name}</h3>
              {d.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{d.description}</p>}
              <div className="flex gap-2 mt-4">
                <Badge variant="default">{d.teachersCount} أستاذ</Badge>
                <Badge variant="outline">{d.coursesCount} مادة</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, editing: null })} title={modal.editing ? "تعديل القسم" : "إضافة قسم"}>
        <form
          onSubmit={e => {
            e.preventDefault();
            setError(null);
            save.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-bold mb-2">اسم القسم</label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">الوصف</label>
            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="اختياري" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">اللون</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-10 h-10 rounded-xl border-2 ${form.color === c ? "border-foreground scale-110" : "border-transparent"} transition-transform`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setModal({ open: false, editing: null })}>إلغاء</Button>
            <Button type="submit" isLoading={save.isPending} className="bg-purple-700 hover:bg-purple-800">
              {modal.editing ? "حفظ" : "إضافة"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
