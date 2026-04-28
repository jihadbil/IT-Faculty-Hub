import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQueries } from "@tanstack/react-query";
import { BookOpen, Video, CalendarDays, ArrowLeft, Users, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/shared";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAuth } from "@/lib/auth";
import { useCoursesForRole, colorForCourse } from "@/lib/queries";
import { coursesApi, asNumber, type CourseResponseDto } from "@/lib/external-api";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: courses = [], isLoading, error } = useCoursesForRole();

  const detailQueries = useQueries({
    queries: courses.map((c) => ({
      queryKey: ["external", "course", c.id],
      queryFn: () => coursesApi.get(c.id),
      staleTime: 60_000,
    })),
  });

  const fullCourses: CourseResponseDto[] = detailQueries
    .map((q) => q.data)
    .filter((c): c is CourseResponseDto => !!c);

  const totalVideos = fullCourses.reduce((s, c) => s + asNumber(c.videoLecturesCount), 0);
  const totalSchedules = fullCourses.reduce((s, c) => s + (c.schedules?.length ?? 0), 0);
  const totalStudents = fullCourses.reduce((s, c) => s + asNumber(c.enrolledStudentsCount), 0);

  const stats = [
    { label: "موادي الدراسية", value: courses.length, icon: BookOpen, color: "bg-blue-500", href: "/courses" },
    { label: "محاضرات الفيديو", value: totalVideos, icon: Video, color: "bg-teal-500", href: "/courses" },
    { label: "الطلاب المسجلون", value: totalStudents, icon: Users, color: "bg-rose-500", href: "/courses" },
    { label: "مواعيد الجدول", value: totalSchedules, icon: CalendarDays, color: "bg-amber-500", href: "/schedule" },
  ];

  const chartData = useMemo(() => {
    const bySemester = new Map<string, number>();
    for (const c of courses) {
      const key = c.semester || "غير محدد";
      bySemester.set(key, (bySemester.get(key) ?? 0) + 1);
    }
    return Array.from(bySemester.entries()).map(([name, value]) => ({ name, value }));
  }, [courses]);

  const todaySchedules = useMemo(() => {
    const out: { id: number; courseName: string; courseId: string; startTime: string; endTime: string; building?: string | null; room?: string | null }[] = [];
    for (const c of fullCourses) {
      for (const s of c.schedules ?? []) {
        out.push({ id: s.id, courseName: c.courseName, courseId: c.id, startTime: s.startTime, endTime: s.endTime, building: s.building, room: s.roomNumber });
      }
    }
    return out.sort((a, b) => a.startTime.localeCompare(b.startTime)).slice(0, 4);
  }, [fullCourses]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10"
      >
        <img
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Hero background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/40" />
        <div className="relative p-8 md:p-12 text-white">
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-4">مرحباً، {user?.fullName}</h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed">
            هذه لوحتك الخاصة. تعرض ملخصاً للمواد الموكلة إليك ومحاضراتك المرئية المرفوعة.
          </p>
        </div>
      </motion.div>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm text-destructive">
            <p className="font-bold">فشل الاتصال بـ API</p>
            <p className="break-words mt-1">{(error as Error).message}</p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link href={stat.href}>
              <Card className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground font-medium mb-2">{stat.label}</p>
                    <h3 className="text-4xl font-display font-bold text-foreground">
                      {isLoading ? "-" : stat.value}
                    </h3>
                  </div>
                  <div
                    className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center shadow-lg text-white transform group-hover:rotate-12 transition-transform`}
                  >
                    <stat.icon className="w-7 h-7" />
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-6 lg:p-8">
          <h3 className="text-xl font-display font-bold mb-8">توزيع المواد حسب الفصل الدراسي</h3>
          <div className="h-72 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">لا توجد بيانات بعد</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 14, fontFamily: "Cairo" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--secondary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-display font-bold">المواعيد القادمة</h3>
            <Link href="/schedule">
              <span className="text-sm font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer">
                الجدول <ArrowLeft className="w-4 h-4" />
              </span>
            </Link>
          </div>

          <div className="space-y-4">
            {todaySchedules.map((entry) => (
              <div key={entry.id} className="flex gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                <div
                  className="w-12 h-12 shrink-0 rounded-xl text-white flex items-center justify-center font-bold"
                  style={{ backgroundColor: colorForCourse(entry.courseId) }}
                >
                  {entry.startTime.split(":")[0]}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-foreground line-clamp-1">{entry.courseName}</h4>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-accent"></span>
                    {[entry.building, entry.room].filter(Boolean).join(" - ") || "غير محدد"} •{" "}
                    <span dir="ltr">{entry.startTime} - {entry.endTime}</span>
                  </p>
                </div>
              </div>
            ))}

            {todaySchedules.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>لا توجد مواعيد مجدولة</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
