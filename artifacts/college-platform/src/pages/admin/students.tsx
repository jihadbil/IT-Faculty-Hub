import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Loader2, AlertCircle, CheckCircle2, XCircle, Power, PowerOff } from "lucide-react";
import { Card, Badge, Button } from "@/components/ui/shared";
import { ApiNotice } from "@/components/api-notice";
import { useUsers } from "@/lib/queries";
import { usersApi, type Uuid } from "@/lib/external-api";

export default function AdminStudents() {
  const { data: users = [], isLoading, error } = useUsers();
  const qc = useQueryClient();

  const students = useMemo(
    () =>
      users.filter((u) => {
        const isStudent = u.roles.some((r) => /student/i.test(r));
        const isOnlyStudentOrNoRole = u.roles.length === 0 || isStudent;
        const isStaff = u.roles.some((r) => /teacher|instructor|professor|admin|manager/i.test(r));
        return isOnlyStudentOrNoRole && !isStaff;
      }),
    [users],
  );

  const activate = useMutation({
    mutationFn: (id: Uuid) => usersApi.activate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["external", "users"] }),
  });
  const deactivate = useMutation({
    mutationFn: (id: Uuid) => usersApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["external", "users"] }),
  });

  const togglePending = (id: Uuid) =>
    (activate.isPending && activate.variables === id) ||
    (deactivate.isPending && deactivate.variables === id);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50">
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Users className="w-8 h-8 text-purple-700" />
          الطلاب
        </h1>
        <p className="text-muted-foreground mt-1">المستخدمون المسجّلون كطلاب في الـ API</p>
      </div>

      <ApiNotice
        title="فلترة الطلاب وإحصائياتهم محدودة حالياً"
        description="القائمة مأخوذة من /api/users بعد الفلترة على دور الطالب. يمكنك تفعيل/تعطيل أي مستخدم من هنا. لإحصائيات أعمق (مواد مسجّلة، نشاط، مشاهدات…) يلزم نقطة نهاية مخصّصة."
        endpoints={["GET /api/admin/students", "GET /api/admin/students/{id}/activity"]}
      />

      {(error || activate.error || deactivate.error) && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive break-words">
            {((error || activate.error || deactivate.error) as Error).message}
          </p>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-700" /></div>
      ) : students.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">لا يوجد طلاب مسجّلون بعد.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-muted/50">
              <tr className="text-sm font-bold text-foreground">
                <th className="p-4">الاسم الكامل</th>
                <th className="p-4">البريد الإلكتروني</th>
                <th className="p-4">تاريخ التسجيل</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="p-4 font-bold">{s.fullName}</td>
                  <td className="p-4 font-mono text-sm" dir="ltr">{s.email}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {s.createdAtUtc ? new Date(s.createdAtUtc).toLocaleDateString("ar") : "—"}
                  </td>
                  <td className="p-4">
                    {s.isActive ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-bold">
                        <CheckCircle2 className="w-4 h-4" /> نشط
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <XCircle className="w-3 h-3 ms-1" /> معطّل
                      </Badge>
                    )}
                  </td>
                  <td className="p-4">
                    {s.isActive ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        isLoading={togglePending(s.id)}
                        onClick={() => {
                          if (confirm(`تعطيل حساب ${s.fullName}؟`)) deactivate.mutate(s.id);
                        }}
                      >
                        <PowerOff className="w-4 h-4" /> تعطيل
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="gap-1"
                        isLoading={togglePending(s.id)}
                        onClick={() => activate.mutate(s.id)}
                      >
                        <Power className="w-4 h-4" /> تفعيل
                      </Button>
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
