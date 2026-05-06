import { Link } from "wouter";
import {
  Building2, BookOpen, GraduationCap, Crown, CalendarDays, UserRound,
  Loader2, AlertCircle, Video, FileText, ClipboardList, Radio,
} from "lucide-react";
import { Card } from "@/components/ui/shared";
import { useAdminStats } from "@/lib/queries";
import { asNumber } from "@/lib/external-api";

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useAdminStats();

  const cards = stats
    ? [
        { label: "الأقسام", value: asNumber(stats.totalDepartments), icon: Building2, color: "from-purple-600 to-purple-800", href: "/admin/departments" },
        { label: "الأساتذة", value: asNumber(stats.totalTeachers), icon: GraduationCap, color: "from-indigo-600 to-indigo-800", href: "/admin/teachers" },
        { label: "الطلاب", value: asNumber(stats.totalStudents), icon: UserRound, color: "from-emerald-600 to-emerald-800", href: "/admin/students" },
        { label: "المواد", value: asNumber(stats.totalCourses), icon: BookOpen, color: "from-blue-600 to-blue-800", href: "/admin/courses" },
        { label: "الجدول الأسبوعي", value: "—", icon: CalendarDays, color: "from-amber-600 to-amber-800", href: "/admin/schedule" },
        { label: "المحاضرات المرئية", value: asNumber(stats.totalVideoLectures), icon: Video, color: "from-rose-600 to-rose-800", href: "/admin/courses" },
        { label: "الملفات", value: asNumber(stats.totalFiles), icon: FileText, color: "from-teal-600 to-teal-800", href: "/admin/courses" },
        { label: "الاختبارات", value: asNumber(stats.totalExams), icon: ClipboardList, color: "from-orange-600 to-orange-800", href: "/admin/courses" },
        { label: "الجلسات المباشرة", value: asNumber(stats.totalLiveSessions), icon: Radio, color: "from-pink-600 to-pink-800", href: "/admin/courses" },
      ]
    : [
        { label: "الأقسام", value: "—", icon: Building2, color: "from-purple-600 to-purple-800", href: "/admin/departments" },
        { label: "الأساتذة", value: "—", icon: GraduationCap, color: "from-indigo-600 to-indigo-800", href: "/admin/teachers" },
        { label: "الطلاب", value: "—", icon: UserRound, color: "from-emerald-600 to-emerald-800", href: "/admin/students" },
        { label: "المواد", value: "—", icon: BookOpen, color: "from-blue-600 to-blue-800", href: "/admin/courses" },
        { label: "الجدول الأسبوعي", value: "—", icon: CalendarDays, color: "from-amber-600 to-amber-800", href: "/admin/schedule" },
      ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-l from-purple-700 to-purple-900 text-white p-8 rounded-3xl shadow-xl flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
          <Crown className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">لوحة المدير العام</h1>
          <p className="text-white/80 mt-1">نظرة عامة شاملة على الكلية</p>
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

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.topCoursesByEnrollment?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-700" />
                أكثر المواد تسجيلاً
              </h3>
              <div className="space-y-2">
                {stats.topCoursesByEnrollment.slice(0, 5).map((c) => (
                  <div key={c.courseId} className="flex items-center justify-between text-sm">
                    <span className="truncate">{c.courseName}</span>
                    <span className="font-bold text-purple-700 shrink-0 ms-2">{Number(c.value)} طالب</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {stats.topCoursesByViews?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-600" />
                أكثر المواد مشاهدةً
              </h3>
              <div className="space-y-2">
                {stats.topCoursesByViews.slice(0, 5).map((c) => (
                  <div key={c.courseId} className="flex items-center justify-between text-sm">
                    <span className="truncate">{c.courseName}</span>
                    <span className="font-bold text-blue-600 shrink-0 ms-2">{Number(c.value)} مشاهدة</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {stats && (
        <Card className="p-5">
          <h3 className="font-display font-bold text-lg mb-3">ملخّص إضافي</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-muted-foreground">المواد النشطة</p>
              <p className="font-bold text-xl">{asNumber(stats.activeCourses)}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-muted-foreground">الطلاب النشطون</p>
              <p className="font-bold text-xl">{asNumber(stats.activeStudents)}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-muted-foreground">إجمالي التسجيلات</p>
              <p className="font-bold text-xl">{asNumber(stats.totalEnrollments)}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-muted-foreground">إجمالي المشاهدات</p>
              <p className="font-bold text-xl">{asNumber(stats.totalVideoViews)}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
