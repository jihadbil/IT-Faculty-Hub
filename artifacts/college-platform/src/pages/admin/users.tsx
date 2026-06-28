import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, GraduationCap, UserRound, Loader2, AlertCircle,
  CheckCircle2, XCircle, Power, PowerOff, Plus, Pencil,
  Trash2, X, Activity, BookOpen, Video, FileText, ClipboardList,
  Search, ShieldCheck,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui/shared";
import { useUsers, useStudentActivity } from "@/lib/queries";
import {
  usersApi, adminApi,
  type UserResponseDto, type CreateTeacherDto, type UpdateTeacherDto,
  type CreateStudentDto, type UpdateStudentDto, type Uuid,
} from "@/lib/external-api";

/* ─────────────────────────────── helpers ─────────────────────────────── */

type UserKind = "teacher" | "student";

function getKind(user: UserResponseDto): UserKind | "admin" | "unknown" {
  const roles = user.roles.map((r) => r.toLowerCase());
  if (roles.some((r) => /admin|manager/.test(r))) return "admin";
  if (roles.some((r) => /teacher|instructor|professor/.test(r))) return "teacher";
  if (roles.some((r) => /student/.test(r)) || roles.length === 0) return "student";
  return "unknown";
}

/* ─────────────────────────────── dialogs ─────────────────────────────── */

interface AddDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddUserDialog({ onClose, onSuccess }: AddDialogProps) {
  const [kind, setKind] = useState<UserKind>("teacher");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [enrollmentYear, setEnrollmentYear] = useState("");
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!firstName.trim() || !lastName.trim()) throw new Error("الاسم الأول والأخير مطلوبان");
      if (!email.trim() || !password) throw new Error("البريد الإلكتروني وكلمة المرور مطلوبان");
      if (password.length < 6) throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");

      if (kind === "teacher") {
        const body: CreateTeacherDto = {
          firstName: firstName.trim(), lastName: lastName.trim(),
          email: email.trim(), password,
          phoneNumber: phoneNumber.trim() || null,
          title: title.trim() || null,
          bio: bio.trim() || null,
        };
        return adminApi.createTeacher(body);
      } else {
        const body: CreateStudentDto = {
          firstName: firstName.trim(), lastName: lastName.trim(),
          email: email.trim(), password,
          phoneNumber: phoneNumber.trim() || null,
          studentNumber: studentNumber.trim() || null,
          enrollmentYear: enrollmentYear ? Number(enrollmentYear) : null,
        };
        return adminApi.createStudent(body);
      }
    },
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const input = "w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold">إضافة مستخدم جديد</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {/* Role selector */}
        <div className="flex rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setKind("teacher")}
            className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${kind === "teacher" ? "bg-purple-700 text-white" : "bg-background text-muted-foreground hover:bg-muted"}`}
          >
            <GraduationCap className="w-4 h-4" /> أستاذ
          </button>
          <button
            onClick={() => setKind("student")}
            className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${kind === "student" ? "bg-purple-700 text-white" : "bg-background text-muted-foreground hover:bg-muted"}`}
          >
            <UserRound className="w-4 h-4" /> طالب
          </button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold mb-1">الاسم الأول <span className="text-destructive">*</span></label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={input} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">الاسم الأخير <span className="text-destructive">*</span></label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={input} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">البريد الإلكتروني <span className="text-destructive">*</span></label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className={input} />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">كلمة المرور <span className="text-destructive">*</span></label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr"
            placeholder="6 أحرف على الأقل" className={input} />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">رقم الهاتف</label>
          <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} dir="ltr" className={input} />
        </div>

        {kind === "teacher" && (
          <>
            <div>
              <label className="block text-sm font-bold mb-1">اللقب العلمي</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: دكتور، أستاذ مساعد" className={input} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">نبذة</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2}
                className={`${input} resize-none`} />
            </div>
          </>
        )}

        {kind === "student" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1">الرقم الجامعي</label>
              <input value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} dir="ltr" className={input} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">سنة الالتحاق</label>
              <input type="number" value={enrollmentYear} onChange={(e) => setEnrollmentYear(e.target.value)}
                placeholder={String(new Date().getFullYear())} dir="ltr" className={input} />
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button isLoading={save.isPending} onClick={() => save.mutate()} className="gap-2">
            <Plus className="w-4 h-4" />
            {kind === "teacher" ? "إضافة الأستاذ" : "إضافة الطالب"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ──────────────────────── edit dialogs ──────────────────────── */

interface EditTeacherDialogProps {
  user: UserResponseDto;
  onClose: () => void;
  onSuccess: () => void;
}

function EditTeacherDialog({ user, onClose, onSuccess }: EditTeacherDialogProps) {
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? "");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!firstName.trim() || !lastName.trim()) throw new Error("الاسم الأول والأخير مطلوبان");
      const body: UpdateTeacherDto = {
        firstName: firstName.trim(), lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || null,
        title: title.trim() || null,
        bio: bio.trim() || null,
      };
      return adminApi.updateTeacher(user.id as Uuid, body);
    },
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const input = "w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold">تعديل بيانات الأستاذ</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold mb-1">الاسم الأول</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={input} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">الاسم الأخير</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={input} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">رقم الهاتف</label>
          <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} dir="ltr" className={input} />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">اللقب العلمي</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: دكتور" className={input} />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">نبذة</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className={`${input} resize-none`} />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button isLoading={save.isPending} onClick={() => save.mutate()}>حفظ التعديلات</Button>
        </div>
      </Card>
    </div>
  );
}

interface EditStudentDialogProps {
  user: UserResponseDto;
  onClose: () => void;
  onSuccess: () => void;
}

function EditStudentDialog({ user, onClose, onSuccess }: EditStudentDialogProps) {
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? "");
  const [studentNumber, setStudentNumber] = useState("");
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!firstName.trim() || !lastName.trim()) throw new Error("الاسم الأول والأخير مطلوبان");
      const body: UpdateStudentDto = {
        firstName: firstName.trim(), lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || null,
        studentNumber: studentNumber.trim() || null,
      };
      return adminApi.updateStudent(user.id as Uuid, body);
    },
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const input = "w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold">تعديل بيانات الطالب</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold mb-1">الاسم الأول</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={input} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">الاسم الأخير</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={input} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">رقم الهاتف</label>
          <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} dir="ltr" className={input} />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">الرقم الجامعي</label>
          <input value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} dir="ltr" className={input} />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button isLoading={save.isPending} onClick={() => save.mutate()}>حفظ التعديلات</Button>
        </div>
      </Card>
    </div>
  );
}

/* ──────────────────── activity panel ──────────────────── */

function ActivityPanel({ studentId, onClose }: { studentId: Uuid; onClose: () => void }) {
  const { data, isLoading, error } = useStudentActivity(studentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-700" /> نشاط الطالب
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

/* ──────────────────────────── main page ──────────────────────────── */

type Tab = "all" | "teachers" | "students";

interface EditState {
  open: boolean;
  user?: UserResponseDto;
  kind?: UserKind;
}

export default function AdminUsers() {
  const qc = useQueryClient();
  const { data: users = [], isLoading, error } = useUsers();

  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editState, setEditState] = useState<EditState>({ open: false });
  const [activityId, setActivityId] = useState<Uuid | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["external", "users"] });

  const activate = useMutation({ mutationFn: (id: Uuid) => usersApi.activate(id), onSuccess: refresh });
  const deactivate = useMutation({ mutationFn: (id: Uuid) => usersApi.deactivate(id), onSuccess: refresh });
  const deleteUser = useMutation({
    mutationFn: (u: UserResponseDto) => {
      const kind = getKind(u);
      if (kind === "teacher") return adminApi.deleteTeacher(u.id as Uuid);
      return adminApi.deleteStudent(u.id as Uuid);
    },
    onSuccess: refresh,
  });

  const togglePending = (id: Uuid) =>
    (activate.isPending && activate.variables === id) ||
    (deactivate.isPending && deactivate.variables === id);

  const filtered = useMemo(() => {
    let list = users.filter((u) => {
      const kind = getKind(u);
      if (kind === "admin") return false;
      if (tab === "teachers") return kind === "teacher";
      if (tab === "students") return kind === "student";
      return true;
    });
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [users, tab, search]);

  const counts = useMemo(() => {
    const teacherCount = users.filter((u) => getKind(u) === "teacher").length;
    const studentCount = users.filter((u) => getKind(u) === "student").length;
    return { all: teacherCount + studentCount, teachers: teacherCount, students: studentCount };
  }, [users]);

  const anyError = error || activate.error || deactivate.error || deleteUser.error;

  const tabs: { key: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { key: "all", label: "الكل", icon: Users, count: counts.all },
    { key: "teachers", label: "الأساتذة", icon: GraduationCap, count: counts.teachers },
    { key: "students", label: "الطلاب", icon: UserRound, count: counts.students },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-purple-700" />
            إدارة المستخدمين
          </h1>
          <p className="text-muted-foreground mt-1">إضافة وتعديل وإدارة حسابات الأساتذة والطلاب</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة مستخدم
        </Button>
      </div>

      {anyError && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive break-words">{(anyError as Error).message}</p>
        </Card>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-muted rounded-2xl p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t.key
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-purple-100 text-purple-700" : "bg-muted-foreground/20"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد..."
            className="w-full border border-border rounded-xl pe-10 ps-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-700" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {search ? "لا توجد نتائج مطابقة للبحث." : "لا يوجد مستخدمون في هذه الفئة بعد."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-muted/50">
              <tr className="text-sm font-bold text-foreground">
                <th className="p-4">الاسم</th>
                <th className="p-4">البريد الإلكتروني</th>
                <th className="p-4">الدور</th>
                <th className="p-4">تاريخ الإنشاء</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const kind = getKind(u);
                return (
                  <tr key={u.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${kind === "teacher" ? "bg-purple-600" : "bg-blue-500"}`}>
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <span className="font-bold">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm text-muted-foreground" dir="ltr">{u.email}</td>
                    <td className="p-4">
                      {kind === "teacher" ? (
                        <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50 gap-1">
                          <GraduationCap className="w-3 h-3" /> أستاذ
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 gap-1">
                          <UserRound className="w-3 h-3" /> طالب
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {u.createdAtUtc ? new Date(u.createdAtUtc).toLocaleDateString("ar") : "—"}
                    </td>
                    <td className="p-4">
                      {u.isActive ? (
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
                      <div className="flex gap-1 items-center flex-wrap">
                        {kind === "student" && (
                          <button
                            onClick={() => setActivityId(u.id as Uuid)}
                            className="p-1.5 text-muted-foreground hover:text-purple-700 rounded-lg hover:bg-purple-50"
                            title="نشاط الطالب"
                          >
                            <Activity className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setEditState({ open: true, user: u, kind: kind as UserKind })}
                          className="p-1.5 text-muted-foreground hover:text-purple-700 rounded-lg hover:bg-purple-50"
                          title="تعديل"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {u.isActive ? (
                          <Button size="sm" variant="outline" className="gap-1 text-xs" isLoading={togglePending(u.id as Uuid)}
                            onClick={() => { if (confirm(`تعطيل حساب ${u.fullName}؟`)) deactivate.mutate(u.id as Uuid); }}>
                            <PowerOff className="w-3 h-3" /> تعطيل
                          </Button>
                        ) : (
                          <Button size="sm" className="gap-1 text-xs" isLoading={togglePending(u.id as Uuid)}
                            onClick={() => activate.mutate(u.id as Uuid)}>
                            <Power className="w-3 h-3" /> تفعيل
                          </Button>
                        )}
                        <button
                          onClick={() => { if (confirm(`حذف حساب ${u.fullName} نهائياً؟`)) deleteUser.mutate(u); }}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Modals */}
      {addOpen && (
        <AddUserDialog onClose={() => setAddOpen(false)} onSuccess={refresh} />
      )}

      {editState.open && editState.user && editState.kind === "teacher" && (
        <EditTeacherDialog
          user={editState.user}
          onClose={() => setEditState({ open: false })}
          onSuccess={refresh}
        />
      )}

      {editState.open && editState.user && editState.kind === "student" && (
        <EditStudentDialog
          user={editState.user}
          onClose={() => setEditState({ open: false })}
          onSuccess={refresh}
        />
      )}

      {activityId && (
        <ActivityPanel studentId={activityId} onClose={() => setActivityId(null)} />
      )}
    </div>
  );
}
