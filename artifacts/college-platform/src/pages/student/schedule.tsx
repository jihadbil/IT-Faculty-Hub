import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useQueries } from "@tanstack/react-query";
import { Clock, MapPin, CalendarDays, Printer, AlertCircle } from "lucide-react";
import { Card, Badge } from "@/components/ui/shared";
import { useCoursesForRole, colorForCourse } from "@/lib/queries";
import { coursesApi, type CourseResponseDto, type ScheduleResponseDto } from "@/lib/external-api";

const ARABIC_DAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

interface FlatEntry extends ScheduleResponseDto {
  courseName: string;
  courseCode: string;
  courseColor: string;
}

export default function StudentSchedule() {
  const { data: courses = [], isLoading: loadingCourses, error } = useCoursesForRole();

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

  const flat: FlatEntry[] = useMemo(() => {
    const out: FlatEntry[] = [];
    for (const c of fullCourses) {
      const color = colorForCourse(c.id);
      for (const s of c.schedules ?? []) {
        out.push({ ...s, courseName: c.courseName, courseCode: c.courseCode, courseColor: color });
      }
    }
    return out;
  }, [fullCourses]);

  const grouped = useMemo(
    () =>
      ARABIC_DAYS.map((dayName) => ({
        dayName,
        entries: flat
          .filter((e) => normalizeDay(e.dayOfWeek) === dayName)
          .sort((a, b) => a.startTime.localeCompare(b.startTime)),
      })),
    [flat],
  );

  const isLoading = loadingCourses || detailQueries.some((q) => q.isLoading);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-border print:hidden">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">جدولي الأسبوعي</h1>
          <p className="text-muted-foreground mt-1">المواعيد المضافة لكل مادة من موادك المسجّلة</p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 h-12 px-5 rounded-xl border-2 border-primary/20 text-primary hover:bg-primary/5 font-bold transition-colors"
        >
          <Printer className="w-4 h-4" /> طباعة
        </button>
      </div>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive break-words">{(error as Error).message}</p>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white rounded-2xl border border-border" />)}
        </div>
      ) : flat.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-border">
          <CalendarDays className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">لا يوجد جدول بعد</h3>
          <p className="text-muted-foreground">لم تتم إضافة مواعيد لأي مادة من موادك.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map((dayGroup, idx) => {
            if (dayGroup.entries.length === 0) return null;
            return (
              <motion.div
                key={dayGroup.dayName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm flex flex-col md:flex-row"
              >
                <div className="p-6 md:w-52 flex flex-col items-center justify-center md:border-l border-b md:border-b-0 border-border bg-primary/5 text-primary">
                  <h3 className="text-2xl font-display font-bold">{dayGroup.dayName}</h3>
                </div>
                <div className="p-6 flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayGroup.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 rounded-2xl border border-border bg-white hover:shadow-md transition-shadow"
                      style={{ borderInlineStartColor: entry.courseColor, borderInlineStartWidth: 4 }}
                    >
                      <Badge variant="outline" className="mb-3 font-mono">{entry.courseCode}</Badge>
                      <h4 className="font-bold text-lg text-foreground mb-3 break-words">{entry.courseName}</h4>
                      <div className="space-y-2 text-sm text-foreground/80 font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 opacity-70" />
                          <span dir="ltr">{entry.startTime} - {entry.endTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 opacity-70" />
                          <span>{[entry.building, entry.roomNumber].filter(Boolean).join(" - ") || "غير محدد"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function normalizeDay(d: string): string {
  if (!d) return "";
  if ((ARABIC_DAYS as readonly string[]).includes(d)) return d;
  const map: Record<string, string> = {
    sunday: "الأحد",
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
    "0": "الأحد",
    "1": "الاثنين",
    "2": "الثلاثاء",
    "3": "الأربعاء",
    "4": "الخميس",
    "5": "الجمعة",
    "6": "السبت",
  };
  return map[d.toLowerCase().trim()] ?? d;
}
