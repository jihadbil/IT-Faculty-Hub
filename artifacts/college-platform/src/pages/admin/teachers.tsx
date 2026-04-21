import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Pencil, Trash2, Loader2, KeyRound, GraduationCap } from "lucide-react";
import { Button, Card, Modal, Input, Select, Badge } from "@/components/ui/shared";
import { api } from "@/lib/api";

interface Teacher {
  id: number;
  username: string;
  fullName: string;
  departmentId: number | null;
  departmentName: string | null;
}
interface Department {
  id: number;
  name: string;
}

export default function AdminTeachers() {
  const qc = useQueryClient();
  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({
    queryKey: ["/api/admin/teachers"],
    queryFn: () => api("/api/admin/teachers"),
  });
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    queryFn: () => api("/api/departments"),
  });

  const [modal, setModal] = useState<{ open: boolean; editing: Teacher | null }>({ open: false, editing: null });
  const [form, setForm] = useState({ username: "", fullName: "", password: "", departmentId: "" });
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setForm({ username: "", fullName: "", password: "", departmentId: "" });
    setError(null);
    setModal({ open: true, editing: null });
  };
  const openEdit = (t: Teacher) => {
    setForm({ username: t.username, fullName: t.fullName, password: "", departmentId: t.departmentId?.toString() ?? "" });
    setError(null);
    setModal({ open: true, editing: t });
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        fullName: form.fullName,
        departmentId: form.departmentId ? parseInt(form.departmentId) : null,
      };
      if (modal.editing) {
        if (form.password) payload.password = form.password;
        return api(`/api/admin/teachers/${modal.editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        payload.username = form.username;
        payload.password = form.password;
        return api("/api/admin/teachers", { method: "POST", body: JSON.stringify(payload) });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/teachers"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/departments"] });
      setModal({ open: false, editing: null });
    },
    onError: (e: Error) => setError(e.message),
  });

  const del = useMutation({
    mutationFn: (id: number) => api(`/api/admin/teachers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/teachers"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-border/50">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-purple-700" />
            الأساتذة
          </h1>
          <p className="text-muted-foreground mt-1">إنشاء وإدارة حسابات الأساتذة وتعيينهم للأقسام</p>
        </div>
        <Button onClick={openCreate} className="bg-purple-700 hover:bg-purple-800">
          <Plus className="w-5 h-5 ms-2" /> إضافة أستاذ
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-700" /></div>
      ) : teachers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">لا يوجد أساتذة بعد.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-muted/50">
              <tr className="text-sm font-bold text-foreground">
                <th className="p-4">الاسم</th>
                <th className="p-4">اسم المستخدم</th>
                <th className="p-4">القسم</th>
                <th className="p-4 w-32">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="p-4 font-bold">{t.fullName}</td>
                  <td className="p-4 font-mono text-sm" dir="ltr">{t.username}</td>
                  <td className="p-4">
                    {t.departmentName ? <Badge variant="default">{t.departmentName}</Badge> : <span className="text-muted-foreground text-sm">—</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(t)} className="p-2 hover:bg-muted rounded-lg" title="تعديل / كلمة مرور">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirm(`حذف الأستاذ "${t.fullName}"؟`) && del.mutate(t.id)}
                        className="p-2 hover:bg-destructive/10 rounded-lg"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, editing: null })} title={modal.editing ? "تعديل الأستاذ" : "إضافة أستاذ"}>
        <form
          onSubmit={e => {
            e.preventDefault();
            setError(null);
            save.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-bold mb-2">الاسم الكامل</label>
            <Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          {!modal.editing && (
            <div>
              <label className="block text-sm font-bold mb-2">اسم المستخدم</label>
              <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required dir="ltr" placeholder="username" />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              {modal.editing ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور"}
            </label>
            <Input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required={!modal.editing}
              placeholder={modal.editing ? "اتركها فارغة لعدم التغيير" : "6 أحرف على الأقل"}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">القسم</label>
            <Select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">— بدون قسم —</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setModal({ open: false, editing: null })}>إلغاء</Button>
            <Button type="submit" isLoading={save.isPending} className="bg-purple-700 hover:bg-purple-800">
              {modal.editing ? "حفظ" : "إنشاء"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
