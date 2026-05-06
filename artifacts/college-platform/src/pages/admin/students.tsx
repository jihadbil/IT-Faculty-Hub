import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Loader2, AlertCircle, CheckCircle2, XCircle, Power, PowerOff,
  Plus, Pencil, Trash2, X, Activity, BookOpen, Video, FileText, ClipboardList,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui/shared";
import { useUsers, useStudentActivity } from "@/lib/queries";
import {
  usersApi, adminApi,
  type UserResponseDto, type CreateStudentDto, type UpdateStudentDto, type Uuid,
} from "@/lib/external-api";

interface StudentDialogProps {
  student?: UserResponseDto;
  onClose: () => void;
  onSuccess: () => void;
}

function StudentDialog({ student, onClose, onSuccess }: StudentDialogProps) {
  const [firstName, setFirstName] = useState(student?.firstName ?? "");
  const [lastName, setLastName] = useState(student?.lastName ?? "");
  const [email, setEmail] = useState(student?.email ?? "");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(student?.phoneNumber ?? "");
  const [studentNumber, setStudentNumber] = useState("");
  const [enrollmentYear, setEnrollmentYear] = useState("");
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!firstName.trim() || !lastName.trim()) throw new Error("الاسم الأول والأخير مطلوبان");
      if (!student && (!email.trim() || !password)) throw new Error("البريد وكلمة المرور مطلوبان");
      if (student) {
        const body: UpdateStudentDto = {
          firstName: firstName.trim(), lastName: lastName.trim(),
          phoneNumber: phoneNumber.trim() || null, studentNumber: studentNumber.trim() || null,
        };
        return adminApi.updateStudent(student.id as Uuid, body);
      }
      const body: CreateStudentDto = {
        firstName: firstName.trim(), lastName: lastName.trim(),
        email: email.trim(), password,
        phoneNumber: phoneNumber.trim() || null,
        studentNumber: studentNumber.trim() || null,
        enrollmentYear: enrollmentYear ? Number(enrollmentYear) : null,
      };
      return adminApi.createStudent(body);
    },
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold">{student ? "تعديل الطالب" : "إضافة طالب جديد"}</h2>
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
        {!student && (
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
          <label className="block text-sm font-bold mb-1">الرقم الجامعي</label>
          <input value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} dir="ltr"
            className="w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        {!student && (
          <div>
            <label className="block text-sm font-bold mb-1">سنة الالتحاق</label>
            <input type="number" value={enrollmentYear} onChange={(e) => setEnrollmentYear(e.target.value)}
              placeholder={String(new Date().getFullYear())} dir="ltr"
              className="w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        )}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button isLoading={save.isPending} onClick={() => save.mutate()}>
            {student ? "حفظ التعديلات" : "إضافة الطالب"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ActivityPanel({ studentId, onClose }: { studentId: Uuid; onClose: () => void }) {
  const { data, isLoading, error } = useStudentActivity(studentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-700" />
            نشاط الطالب
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{(error as Error).message}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-purple-700" /></div>
        ) : data ? (
          <>
            <p className="font-bold text-lg">{data.fullName}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: BookOpen, label: "المواد المسجّلة", value: data.enrolledCoursesCount },
                { icon: Video, label: "محاضرات مشاهدة", value: data.videosWatched },
                { icon: FileText, label: "ملفات محمّلة", value: data.filesDownloaded },
                { icon: ClipboardList, label: "اختبارات مقدّمة", value: data.examsTaken },
              ].map((item) => (
                <div key={item.label} className="bg-muted/50 rounded-xl p-3 flex items-center gap-2">
                  <item.icon className="w-5 h-5 text-purple-700 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-bold text-lg">{Number(item.value)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">متوسط الدرجات</p>
                <p className="font-bold">{Number(data.averageGrade).toFixed(1)}%</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">نسبة الحضور</p>
                <p className="font-bold">{Number(data.averageAttendanceRate).toFixed(1)}%</p>
              </div>
            </div>
            {data.lastLoginAt && (
              <p className="text-xs text-muted-foreground">
                آخر تسجيل دخول: {new Date(data.lastLoginAt).toLocaleString("ar")}
              </p>
            )}
            {data.recentActivity?.length > 0 && (
              <div>
                <p className="font-bold text-sm mb-2">النشاط الأخير</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.recentActivity.map((a, i) => (
                    <div key={i} className="text-sm bg-muted/30 rounded-xl p-2.5">
                      <p className="font-bold">{a.description}</p>
                      {a.courseName && <p className="text-xs text-muted-foreground">{a.courseName}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(a.at).toLocaleString("ar")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        </div>
      </Card>
    </div>
  );
}

export default function AdminStudents() {
  const qc = useQueryClient();
  const { data: users = [], isLoading, error } = useUsers();
  const [dialog, setDialog] = useState<{ open: boolean; student?: UserResponseDto }>({ open: false });
  const [activityId, setActivityId] = useState<Uuid | null>(null);

  const students = useMemo(
    () =>
      users.filter((u) => {
        const isStudent = u.roles.some((r) => /student/i.test(r));
        const isStaff = u.roles.some((r) => /teacher|instructor|professor|admin|manager/i.test(r));
        return (u.roles.length === 0 || isStudent) && !isStaff;
      }),
    [users],
  );

  const refresh = () => qc.invalidateQueries({ queryKey: ["external", "users"] });

  const activate = useMutation({ mutationFn: (id: Uuid) => usersApi.activate(id), onSuccess: refresh });
  const deactivate = useMutation({ mutationFn: (id: Uuid) => usersApi.deactivate(id), onSuccess: refresh });
  const deleteStudent = useMutation({ mutationFn: (id: Uuid) => adminApi.deleteStudent(id), onSuccess: refresh });

  const togglePending = (id: Uuid) =>
    (activate.isPending && activate.variables === id) ||
    (deactivate.isPending && deactivate.variables === id);

  const anyError = error || activate.error || deactivate.error || deleteStudent.error;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-700" />
            الطلاب
          </h1>
          <p className="text-muted-foreground mt-1">إدارة حسابات الطلاب ومتابعة نشاطهم</p>
        </div>
        <Button onClick={() => setDialog({ open: true })} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة طالب
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
                    <div className="flex gap-1 flex-wrap">
                      <button
                        onClick={() => setActivityId(s.id as Uuid)}
                        className="p-1.5 text-muted-foreground hover:text-purple-700 rounded-lg hover:bg-purple-50"
                        title="نشاط الطالب"
                      >
                        <Activity className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDialog({ open: true, student: s })}
                        className="p-1.5 text-muted-foreground hover:text-purple-700 rounded-lg hover:bg-purple-50"
                        title="تعديل"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {s.isActive ? (
                        <Button size="sm" variant="outline" className="gap-1" isLoading={togglePending(s.id as Uuid)}
                          onClick={() => { if (confirm(`تعطيل حساب ${s.fullName}؟`)) deactivate.mutate(s.id as Uuid); }}>
                          <PowerOff className="w-3 h-3" /> تعطيل
                        </Button>
                      ) : (
                        <Button size="sm" className="gap-1" isLoading={togglePending(s.id as Uuid)}
                          onClick={() => activate.mutate(s.id as Uuid)}>
                          <Power className="w-3 h-3" /> تفعيل
                        </Button>
                      )}
                      <button
                        onClick={() => { if (confirm(`حذف حساب ${s.fullName} نهائياً؟`)) deleteStudent.mutate(s.id as Uuid); }}
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
        <StudentDialog
          student={dialog.student}
          onClose={() => setDialog({ open: false })}
          onSuccess={refresh}
        />
      )}

      {activityId && (
        <ActivityPanel studentId={activityId} onClose={() => setActivityId(null)} />
      )}
    </div>
  );
}
