import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, Loader2, AlertCircle, Plus, Pencil, Trash2, X, BookOpen, GraduationCap, Users,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui/shared";
import { useDepartments } from "@/lib/queries";
import {
  departmentsApi,
  type DepartmentResponseDto,
  type CreateDepartmentDto,
  type Uuid,
} from "@/lib/external-api";

function DeptDialog({
  dept,
  onClose,
  onSuccess,
}: {
  dept?: DepartmentResponseDto;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(dept?.name ?? "");
  const [code, setCode] = useState(dept?.code ?? "");
  const [description, setDescription] = useState(dept?.description ?? "");
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !code.trim()) throw new Error("الاسم والرمز مطلوبان");
      const body: CreateDepartmentDto = { name: name.trim(), code: code.trim(), description: description.trim() || undefined };
      if (dept) return departmentsApi.update(dept.id as Uuid, body);
      return departmentsApi.create(body);
    },
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold">{dept ? "تعديل القسم" : "إنشاء قسم جديد"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-bold mb-1">اسم القسم <span className="text-destructive">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="قسم تقنية المعلومات"
              className="w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">الرمز <span className="text-destructive">*</span></label>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="IT"
              className="w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">الوصف</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="وصف اختياري"
              className="w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button isLoading={save.isPending} onClick={() => save.mutate()}>
            {dept ? "حفظ التعديلات" : "إنشاء القسم"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function AdminDepartments() {
  const qc = useQueryClient();
  const { data: departments = [], isLoading, error } = useDepartments();
  const [dialog, setDialog] = useState<{ open: boolean; dept?: DepartmentResponseDto }>({ open: false });

  const refresh = () => qc.invalidateQueries({ queryKey: ["external", "departments"] });

  const deleteDept = useMutation({
    mutationFn: (id: Uuid) => departmentsApi.delete(id),
    onSuccess: refresh,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Building2 className="w-8 h-8 text-purple-700" />
            الأقسام
          </h1>
          <p className="text-muted-foreground mt-1">إدارة الأقسام الأكاديمية للكلية</p>
        </div>
        <Button onClick={() => setDialog({ open: true })} className="gap-2">
          <Plus className="w-4 h-4" />
          إنشاء قسم
        </Button>
      </div>

      {(error || deleteDept.error) && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive break-words">
            {((error || deleteDept.error) as Error).message}
          </p>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-700" /></div>
      ) : departments.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">لا توجد أقسام بعد. أنشئ أول قسم الآن.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <Card key={d.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-purple-700">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setDialog({ open: true, dept: d })}
                    className="p-1.5 text-muted-foreground hover:text-purple-700 rounded-lg hover:bg-purple-50"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`حذف قسم "${d.name}"؟`)) deleteDept.mutate(d.id as Uuid); }}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-display font-bold text-lg text-foreground">{d.name}</h3>
              <p className="text-xs text-muted-foreground font-mono mb-2" dir="ltr">{d.code}</p>
              {d.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{d.description}</p>
              )}
              <div className="flex gap-2 flex-wrap mt-3">
                <Badge variant="outline" className="text-xs gap-1">
                  <GraduationCap className="w-3 h-3" />
                  {Number(d.teachersCount)} أستاذ
                </Badge>
                <Badge variant="outline" className="text-xs gap-1">
                  <Users className="w-3 h-3" />
                  {Number(d.studentsCount)} طالب
                </Badge>
                <Badge variant="default" className="text-xs gap-1">
                  <BookOpen className="w-3 h-3" />
                  {Number(d.coursesCount)} مادة
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {dialog.open && (
        <DeptDialog
          dept={dialog.dept}
          onClose={() => setDialog({ open: false })}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
