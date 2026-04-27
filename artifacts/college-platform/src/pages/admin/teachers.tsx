import { useMemo } from "react";
import { Loader2, GraduationCap, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Card, Badge } from "@/components/ui/shared";
import { ApiNotice } from "@/components/api-notice";
import { useUsers } from "@/lib/queries";

export default function AdminTeachers() {
  const { data: users = [], isLoading, error } = useUsers();

  const teachers = useMemo(
    () => users.filter((u) => u.roles.some((r) => /teacher|instructor|professor/i.test(r))),
    [users],
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50">
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-purple-700" />
          الأساتذة
        </h1>
        <p className="text-muted-foreground mt-1">قائمة المستخدمين الذين لديهم دور أستاذ في الـ API</p>
      </div>

      <ApiNotice
        title="إدارة حسابات الأساتذة تحتاج نقاط نهاية إضافية"
        description="يمكنك تفعيل/تعطيل المستخدمين عبر /api/users/{id}/activate و /deactivate الموجودة. أمّا إنشاء حساب جديد بدور أستاذ مباشرةً وتعيين قسم له فيلزم نقاط نهاية CRUD مخصّصة."
        endpoints={[
          "POST /api/admin/teachers",
          "PUT /api/admin/teachers/{id}",
          "DELETE /api/admin/teachers/{id}",
          "POST /api/users/{id}/roles",
        ]}
      />

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive break-words">{(error as Error).message}</p>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-700" /></div>
      ) : teachers.length === 0 ? (
        <Card className="p-12 text-center">
          <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">لا يوجد أساتذة مسجّلون في الـ API.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-muted/50">
              <tr className="text-sm font-bold text-foreground">
                <th className="p-4">الاسم</th>
                <th className="p-4">البريد</th>
                <th className="p-4">الأدوار</th>
                <th className="p-4">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="p-4 font-bold">{t.fullName}</td>
                  <td className="p-4 font-mono text-sm" dir="ltr">{t.email}</td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {t.roles.map((r) => <Badge key={r} variant="outline">{r}</Badge>)}
                    </div>
                  </td>
                  <td className="p-4">
                    {t.isActive ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-bold">
                        <CheckCircle2 className="w-4 h-4" /> نشط
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground text-sm">
                        <XCircle className="w-4 h-4" /> معطّل
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
