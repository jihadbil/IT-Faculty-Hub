import { Link } from "wouter";
import { Building2, BookOpen, GraduationCap, Crown, CalendarDays, UserRound, Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/shared";
import { ApiNotice } from "@/components/api-notice";
import { useAllCourses, useUsers } from "@/lib/queries";

export default function AdminDashboard() {
  const { data: courses = [], isLoading: loadingCourses, error: courseError } = useAllCourses();
  const { data: users = [], isLoading: loadingUsers, error: userError } = useUsers();

  const teachers = users.filter((u) =>
    u.roles.some((r) => /teacher|instructor|professor/i.test(r)),
  );
  const students = users.filter((u) =>
    u.roles.some((r) => /student/i.test(r)),
  );
  const departments = new Set(courses.map((c) => c.department).filter(Boolean));

  const cards = [
    { label: "الأقسام", value: departments.size, icon: Building2, color: "from-purple-600 to-purple-800", href: "/admin/departments" },
    { label: "الأساتذة", value: teachers.length, icon: GraduationCap, color: "from-indigo-600 to-indigo-800", href: "/admin/teachers" },
    { label: "الطلاب", value: students.length, icon: UserRound, color: "from-emerald-600 to-emerald-800", href: "/admin/students" },
    { label: "المواد", value: courses.length, icon: BookOpen, color: "from-blue-600 to-blue-800", href: "/admin/courses" },
    { label: "الجدول الأسبوعي", value: "—", icon: CalendarDays, color: "from-amber-600 to-amber-800", href: "/admin/schedule" },
  ];

  const isLoading = loadingCourses || loadingUsers;
  const error = courseError || userError;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-l from-purple-700 to-purple-900 text-white p-8 rounded-3xl shadow-xl flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
          <Crown className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">لوحة المدير العام</h1>
          <p className="text-white/80 mt-1">نظرة عامة محسوبة من بيانات الـ API</p>
        </div>
      </div>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive break-words">{(error as Error).message}</p>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-700" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((c) => (
            <Link key={c.label} href={c.href}>
              <Card className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center mb-4`}>
                  <c.icon className="w-6 h-6" />
                </div>
                <p className="text-sm text-muted-foreground font-bold">{c.label}</p>
                <p className="text-3xl font-display font-bold text-foreground mt-1">{c.value}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <ApiNotice
        title="إحصائيات تفصيلية تحتاج نقاط نهاية مخصّصة"
        description="الأرقام أعلاه محسوبة من /api/courses و /api/users. لإحصائيات أكثر دقّة (مثل عدد الإجمالي للمحاضرات المرئية وعدد المشاهدات للكلية كاملةً) يلزم إضافة نقطة نهاية ملخّصة."
        endpoints={["GET /api/admin/stats"]}
      />
    </div>
  );
}
