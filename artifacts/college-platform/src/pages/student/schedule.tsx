import React, { useState } from "react";
import { motion } from "framer-motion";
import { useGetSchedule, useGetCourses } from "@workspace/api-client-react";
import { Clock, MapPin, CalendarDays, Printer } from "lucide-react";
import { Select, Badge } from "@/components/ui/shared";
import { ARABIC_DAYS } from "@/lib/utils";

export default function StudentSchedule() {
  const [year, setYear] = useState<number>(1);
  const [semester, setSemester] = useState<string>("الفصل الأول");

  const { data: schedule = [], isLoading } = useGetSchedule({ year, semester });
  const { data: courses = [] } = useGetCourses({ year, semester });

  const grouped = ARABIC_DAYS.map((dayName, dayIndex) => ({
    dayName,
    dayIndex,
    entries: schedule
      .filter(s => s.dayOfWeek === dayIndex)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  const today = new Date().getDay();

  const getTypeLabel = (type: string) => {
    if (type === "lab") return { label: "مختبر", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" };
    if (type === "tutorial") return { label: "تمارين", color: "bg-amber-500/10 text-amber-700 border-amber-200" };
    return { label: "محاضرة", color: "bg-blue-500/10 text-blue-700 border-blue-200" };
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-border print:hidden">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">جدولي الأسبوعي</h1>
          <p className="text-muted-foreground mt-1">تابع مواعيد محاضراتك ومختبراتك على مدار الأسبوع.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Select value={year} onChange={e => setYear(parseInt(e.target.value))} className="w-auto">
            <option value={1}>السنة الأولى</option>
            <option value={2}>السنة الثانية</option>
            <option value={3}>السنة الثالثة</option>
            <option value={4}>السنة الرابعة</option>
          </Select>
          <Select value={semester} onChange={e => setSemester(e.target.value)} className="w-auto">
            <option value="الفصل الأول">الفصل الأول</option>
            <option value="الفصل الثاني">الفصل الثاني</option>
          </Select>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 h-12 px-5 rounded-xl border-2 border-primary/20 text-primary hover:bg-primary/5 font-bold transition-colors"
          >
            <Printer className="w-4 h-4" />
            طباعة
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-border" />)}
        </div>
      ) : schedule.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-border">
          <CalendarDays className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">لا يوجد جدول لهذا الفصل بعد</h3>
          <p className="text-muted-foreground">تواصل مع الإدارة أو الأستاذ لمعرفة الجدول.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map((dayGroup, idx) => {
            if (dayGroup.entries.length === 0) return null;
            const isToday = dayGroup.dayIndex === today;

            return (
              <motion.div
                key={dayGroup.dayName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-white rounded-3xl border overflow-hidden shadow-sm flex flex-col md:flex-row ${isToday ? "border-primary border-2" : "border-border"}`}
              >
                <div className={`p-6 md:w-52 flex flex-col items-center justify-center md:border-l border-b md:border-b-0 border-border ${isToday ? "bg-primary text-primary-foreground" : "bg-primary/5 text-primary"}`}>
                  <h3 className="text-2xl font-display font-bold">{dayGroup.dayName}</h3>
                  {isToday && (
                    <span className={`mt-2 text-xs font-bold px-3 py-1 rounded-full ${isToday ? "bg-white text-primary" : "bg-primary text-white"}`}>
                      اليوم
                    </span>
                  )}
                </div>

                <div className="p-6 flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayGroup.entries.map(entry => {
                    const course = courses.find(c => c.id === entry.courseId);
                    const typeInfo = getTypeLabel(entry.type);
                    return (
                      <div key={entry.id} className={`p-4 rounded-2xl border ${typeInfo.color} bg-white hover:shadow-md transition-shadow`}>
                        <Badge variant="outline" className={`mb-3 bg-white/80 ${typeInfo.color}`}>
                          {typeInfo.label}
                        </Badge>
                        <h4 className="font-bold text-lg text-foreground mb-3">{course?.name || "—"}</h4>
                        <div className="space-y-2 text-sm text-foreground/80 font-medium">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 opacity-70" />
                            <span dir="ltr">{entry.startTime} - {entry.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 opacity-70" />
                            <span>{entry.location || "غير محدد"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
