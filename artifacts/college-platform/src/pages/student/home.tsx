import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQueries } from "@tanstack/react-query";
import { BookOpen, Video, CalendarDays, Clock, MapPin, ArrowLeft, GraduationCap, AlertCircle } from "lucide-react";
import { Card, Badge } from "@/components/ui/shared";
import { useCoursesForRole, colorForCourse } from "@/lib/queries";
import { coursesApi, asNumber, type CourseResponseDto } from "@/lib/external-api";

export default function StudentHome() {
  const { data: courses = [], error } = useCoursesForRole();

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
  const upcoming = useMemo(() => {
    const out: { id: number; courseId: string; courseName: string; startTime: string; endTime: string; dayOfWeek: string; building?: string | null; room?: string | null }[] = [];
    for (const c of fullCourses) {
      for (const s of c.schedules ?? []) {
        out.push({
          id: s.id,
          courseId: c.id,
          courseName: c.courseName,
          startTime: s.startTime,
          endTime: s.endTime,
          dayOfWeek: s.dayOfWeek,
          building: s.building,
          room: s.room,
        });
      }
    }
    return out.sort((a, b) => a.startTime.localeCompare(b.startTime)).slice(0, 5);
  }, [fullCourses]);

  const stats = [
    { label: "موادي المسجّلة", value: courses.length, icon: BookOpen, color: "bg-blue-500" },
    { label: "محاضرات الفيديو", value: totalVideos, icon: Video, color: "bg-emerald-500" },
    { label: "إجمالي المواعيد", value: upcoming.length, icon: CalendarDays, color: "bg-rose-500" },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-primary via-primary to-primary/80 text-primary-foreground p-8 md:p-12"
      >
        <div className="absolute inset-0 opacity-30">
          <img src={`${import.meta.env.BASE_URL}images/hero-bg.png`} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-2 mb-4">
            <GraduationCap className="w-4 h-4" />
            <span className="text-sm font-bold">بوابة الطالب</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-3">أهلاً بك في منصتك التعليمية</h1>
          <p className="text-primary-foreground/80 text-lg max-w-2xl">
            استعرض موادك المسجّلة، شاهد المحاضرات المرئية، وتابع جدولك الأسبوعي.
          </p>
        </div>
      </motion.div>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive break-words">{(error as Error).message}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground font-medium">{s.label}</p>
                <div className={`${s.color} w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md`}>
                  <s.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-display font-bold text-foreground">{s.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">المواعيد القادمة</h2>
            <p className="text-sm text-muted-foreground">من جميع موادك المسجّلة</p>
          </div>
          <Link href="/student/schedule">
            <span className="text-primary font-bold text-sm hover:underline cursor-pointer flex items-center gap-1">
              الجدول الكامل <ArrowLeft className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>لا توجد مواعيد مضافة بعد.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((s) => (
              <div key={s.id} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border hover:border-primary/30 transition-colors">
                <div className="w-2 h-12 rounded-full" style={{ background: colorForCourse(s.courseId) }} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{s.courseName}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> <span dir="ltr">{s.startTime} - {s.endTime}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{[s.building, s.room].filter(Boolean).join(" - ") || "—"}
                    </span>
                  </div>
                </div>
                <Badge variant="outline">{s.dayOfWeek}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 bg-gradient-to-l from-accent/10 to-primary/5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-bold text-foreground mb-1">استكشف موادك الدراسية</h2>
            <p className="text-muted-foreground text-sm">
              تصفّح جميع المواد التي تدرسها وشاهد محاضراتها المرئية في مكان واحد.
            </p>
          </div>
          <Link href="/student/courses">
            <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold cursor-pointer hover:bg-primary/90 transition-colors">
              <BookOpen className="w-5 h-5" />
              تصفّح المواد
            </span>
          </Link>
        </div>
      </Card>
    </div>
  );
}
