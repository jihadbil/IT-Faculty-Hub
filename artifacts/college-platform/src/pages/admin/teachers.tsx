import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, GraduationCap, AlertCircle, CheckCircle2, XCircle,
  Power, PowerOff, Plus, Pencil, Trash2, X,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui/shared";
import { useUsers } from "@/lib/queries";
import {
  usersApi, adminApi,
  type UserResponseDto, type CreateTeacherDto, type UpdateTeacherDto, type Uuid,
} from "@/lib/external-api";

interface TeacherDialogProps {
  teacher?: UserResponseDto;
  onClose: () => void;
  onSuccess: () => void;
}

function TeacherDialog({ teacher, onClose, onSuccess }: TeacherDialogProps) {
  const [firstName, setFirstName] = useState(teacher?.firstName ?? "");
  const [lastName, setLastName] = useState(teacher?.lastName ?? "");
  const [email, setEmail] = useState(teacher?.email ?? "");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(teacher?.phoneNumber ?? "");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!firstName.trim() || !lastName.trim()) throw new Error("الاسم الأول والأخير مطلوبان");
      if (!teacher && (!email.trim() || !password)) throw new Error("البريد الإلكتروني وكلمة المرور مطلوبان");
      if (teacher) {
        const body: UpdateTeacherDto = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phoneNumber.trim() || null,
          title: title.trim() || null,
          bio: bio.trim() || null,
        };
        return adminApi.updateTeacher(teacher.id as Uuid, body);
      } else {
        const body: CreateTeacherDto = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
          phoneNumber: phoneNumber.trim() || null,
          title: title.trim() || null,
          bio: bio.trim() || null,
        };
        return adminApi.createTeacher(body);
      }
    },
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold">{teacher ? "تعديل الأستاذ" : "إضافة أستاذ جديد"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold mb-1">الاسم الأول <span className="text-destructive">*</span></label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">الاسم الأخير <span className="text-destructive">*</span></label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        </div>
        {!teacher && (
          <>
            <div>
              <label className="block text-sm font-bold mb-1">البريد الإلكتروني <span className="text-destructive">*</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr"
                className="w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">كلمة المرور <span className="text-destructive">*</span></label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr"
                className="w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-bold mb-1">رقم الهاتف</label>
          <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} dir="ltr"
            className="w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">اللقب العلمي</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: دكتور، أستاذ مساعد"
            className="w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">نبذة</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2}
            className="w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button isLoading={save.isPending} onClick={() => save.mutate()}>
            {teacher ? "حفظ التعديلات" : "إضافة الأستاذ"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function AdminTeachers() {
  const qc = useQueryClient();
  const { data: users = [], isLoading, error } = useUsers();
  const [dialog, setDialog] = useState<{ open: boolean; teacher?: UserResponseDto }>({ open: false });

  const teachers = useMemo(
    () => users.filter((u) => u.roles.some((r) => /teacher|instructor|professor/i.test(r))),
    [users],
  );

  const refresh = () => qc.invalidateQueries({ queryKey: ["external", "users"] });

  const activate = useMutation({ mutationFn: (id: Uuid) => usersApi.activate(id), onSuccess: refresh });
  const deactivate = useMutation({ mutationFn: (id: Uuid) => usersApi.deactivate(id), onSuccess: refresh });
  const deleteTeacher = useMutation({
    mutationFn: (id: Uuid) => adminApi.deleteTeacher(id),
    onSuccess: refresh,
  });

  const togglePending = (id: Uuid) =>
    (activate.isPending && activate.variables === id) ||
    (deactivate.isPending && deactivate.variables === id);

  const anyError = error || activate.error || deactivate.error || deleteTeacher.error;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-purple-700" />
            الأساتذة
          </h1>
          <p className="text-muted-foreground mt-1">إدارة حسابات الأساتذة</p>
        </div>
        <Button onClick={() => setDialog({ open: true })} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة أستاذ
        </Button>
      </div>

      {anyError && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive break-words">{(anyError as Error).message}</p>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-700" /></div>
      ) : teachers.length === 0 ? (
        <Card className="p-12 text-center">
          <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">لا يوجد أساتذة مسجّلون بعد.</p>
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
                <th className="p-4">إجراءات</th>
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
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      <button
                        onClick={() => setDialog({ open: true, teacher: t })}
                        className="p-1.5 text-muted-foreground hover:text-purple-700 rounded-lg hover:bg-purple-50"
                        title="تعديل"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {t.isActive ? (
                        <Button size="sm" variant="outline" className="gap-1" isLoading={togglePending(t.id as Uuid)}
                          onClick={() => { if (confirm(`تعطيل حساب ${t.fullName}؟`)) deactivate.mutate(t.id as Uuid); }}>
                          <PowerOff className="w-4 h-4" /> تعطيل
                        </Button>
                      ) : (
                        <Button size="sm" className="gap-1" isLoading={togglePending(t.id as Uuid)}
                          onClick={() => activate.mutate(t.id as Uuid)}>
                          <Power className="w-4 h-4" /> تفعيل
                        </Button>
                      )}
                      <button
                        onClick={() => { if (confirm(`حذف حساب ${t.fullName} نهائياً؟`)) deleteTeacher.mutate(t.id as Uuid); }}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {dialog.open && (
        <TeacherDialog
          teacher={dialog.teacher}
          onClose={() => setDialog({ open: false })}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
