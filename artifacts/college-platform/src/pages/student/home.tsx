import React from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useGetCourses, useGetLectures, useGetFiles, useGetSchedule } from "@workspace/api-client-react";
import { BookOpen, FileText, Video, CalendarDays, Clock, MapPin, ArrowLeft, GraduationCap } from "lucide-react";
import { Card, Badge } from "@/components/ui/shared";
import { ARABIC_DAYS } from "@/lib/utils";

export default function StudentHome() {
  const { data: courses = [] } = useGetCourses();
  const { data: lectures = [] } = useGetLectures();
  const { data: files = [] } = useGetFiles();
  const { data: schedule = [] } = useGetSchedule();

  const today = new Date().getDay();
  const todaySchedule = schedule
    .filter(s => s.dayOfWeek === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const recentFiles = [...files].slice(-5).reverse();

  const stats = [
    { label: "المواد المتاحة", value: courses.length, icon: BookOpen, color: "bg-blue-500" },
    { label: "المحاضرات", value: lectures.length, icon: Video, color: "bg-emerald-500" },
    { label: "الملفات والمصادر", value: files.length, icon: FileText, color: "bg-amber-500" },
    { label: "محاضرات اليوم", value: todaySchedule.length, icon: CalendarDays, color: "bg-rose-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-primary via-primary to-primary/80 text-primary-foreground p-8 md:p-12"
      >
        <div className="absolute inset-0 opacity-30">
          <img
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-2 mb-4">
            <GraduationCap className="w-4 h-4" />
            <span className="text-sm font-bold">بوابة الطالب</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-3">أهلاً بك في منصتك التعليمية</h1>
          <p className="text-primary-foreground/80 text-lg max-w-2xl">
            استعرض موادك الدراسية، حمّل المحاضرات والملفات، وتابع جدولك الأسبوعي بكل سهولة.
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's lectures */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">محاضرات اليوم</h2>
              <p className="text-sm text-muted-foreground">{ARABIC_DAYS[today]}</p>
            </div>
            <Link href="/student/schedule">
              <span className="text-primary font-bold text-sm hover:underline cursor-pointer flex items-center gap-1">
                الجدول الكامل <ArrowLeft className="w-4 h-4" />
              </span>
            </Link>
          </div>

          {todaySchedule.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>لا توجد محاضرات اليوم — استمتع بيومك!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedule.map(s => {
                const course = courses.find(c => c.id === s.courseId);
                const typeLabel = s.type === "lab" ? "مختبر" : s.type === "tutorial" ? "تمارين" : "محاضرة";
                return (
                  <div key={s.id} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border hover:border-primary/30 transition-colors">
                    <div className="w-2 h-12 rounded-full" style={{ background: course?.color || "#3B82F6" }} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground truncate">{course?.name || "—"}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /><span dir="ltr">{s.startTime} - {s.endTime}</span></span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.location || "—"}</span>
                      </div>
                    </div>
                    <Badge variant="outline">{typeLabel}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent files */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-display font-bold text-foreground">أحدث الملفات</h2>
            <Link href="/student/files">
              <span className="text-primary font-bold text-sm hover:underline cursor-pointer flex items-center gap-1">
                كل الملفات <ArrowLeft className="w-4 h-4" />
              </span>
            </Link>
          </div>

          {recentFiles.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>لا توجد ملفات بعد.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentFiles.map(f => {
                const Icon = f.type === "video" ? Video : FileText;
                return (
                  <a
                    key={f.id}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border hover:border-primary/30 hover:bg-muted/50 transition-all"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white ${f.type === "video" ? "bg-rose-500" : "bg-blue-500"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground truncate">{f.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">{f.course?.name || "ملف عام"}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Browse courses CTA */}
      <Card className="p-6 bg-gradient-to-l from-accent/10 to-primary/5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-bold text-foreground mb-1">استكشف موادك الدراسية</h2>
            <p className="text-muted-foreground text-sm">تصفّح جميع المواد والمحاضرات والمصادر التعليمية في مكان واحد.</p>
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
