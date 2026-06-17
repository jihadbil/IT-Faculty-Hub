import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQueries } from "@tanstack/react-query";
import {
  ClipboardList,
  Clock,
  Target,
  Calendar,
  ChevronLeft,
  Search,
  CheckCircle2,
  Lock,
  Hourglass,
  AlertCircle,
} from "lucide-react";
import { Card, Input, Badge } from "@/components/ui/shared";
import { useCoursesForRole, colorForCourse } from "@/lib/queries";
import { examsApi, asNumber, type ExamResponseDto, type Uuid } from "@/lib/external-api";
import { cn } from "@/lib/utils";

type ExamStatus = "upcoming" | "active" | "past";

function examStatus(exam: ExamResponseDto): ExamStatus {
  const now = Date.now();
  const start = new Date(exam.startDate).getTime();
  const end = new Date(exam.endDate).getTime();
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "active";
}

const STATUS_META: Record<ExamStatus, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: "متاح الآن", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: ClipboardList },
  upcoming: { label: "قادم", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Hourglass },
  past: { label: "انتهى", color: "bg-muted text-muted-foreground border-border", icon: Lock },
};

const FILTER_OPTIONS = [
  { label: "الكل", value: "all" as const },
  { label: "متاح الآن", value: "active" as const },
  { label: "قادم", value: "upcoming" as const },
  { label: "انتهى", value: "past" as const },
];

export default function StudentExams() {
  const { data: courses = [], isLoading: loadingCourses } = useCoursesForRole();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | ExamStatus>("all");

  const examQueries = useQueries({
    queries: courses.map((c) => ({
      queryKey: ["external", "course", c.id, "exams"],
      queryFn: () => examsApi.list(c.id as Uuid),
      enabled: !!c.id,
    })),
  });

  const allExams = useMemo(() => {
    return courses.flatMap((c, i) => {
      const data = examQueries[i]?.data ?? [];
      return data
        .filter((e) => e.isPublished)
        .map((e) => ({ exam: e, course: c }));
    });
  }, [courses, examQueries]);

  const filtered = useMemo(() => {
    return allExams.filter(({ exam, course }) => {
      const st = examStatus(exam as ExamResponseDto);
      if (filter !== "all" && st !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return exam.title.toLowerCase().includes(q) || course.courseName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allExams, filter, search]);

  const isLoading = loadingCourses || examQueries.some((q) => q.isLoading);

  const grouped = useMemo(() => {
    const order: ExamStatus[] = ["active", "upcoming", "past"];
    const map: Record<ExamStatus, typeof filtered> = { active: [], upcoming: [], past: [] };
    for (const item of filtered) map[examStatus(item.exam as ExamResponseDto)].push(item);
    return order.map((st) => ({ status: st, items: map[st] })).filter((g) => g.items.length > 0);
  }, [filtered]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">امتحاناتي</h1>
          <p className="text-muted-foreground text-sm mt-0.5">جميع الامتحانات عبر موادك المسجَّلة</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن امتحان أو مادة..."
            className="pr-9"
          />
        </div>
        <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-bold transition-all",
                filter === f.value ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 bg-muted/30 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">لا توجد امتحانات</h3>
          <p className="text-muted-foreground">
            {search ? "لا توجد نتائج مطابقة" : "لم تُنشر أي امتحانات في موادك حتى الآن"}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ status, items }) => {
            const meta = STATUS_META[status];
            return (
              <div key={status} className="space-y-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <meta.icon className="w-5 h-5 text-muted-foreground" />
                  {meta.label}
                  <Badge variant="outline">{items.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(({ exam, course }, i) => {
                    const st = examStatus(exam as ExamResponseDto);
                    const color = colorForCourse(course.id);
                    return (
                      <motion.div
                        key={exam.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Link href={`/student/courses/${course.id}/exams/${exam.id}`}>
                          <Card
                            className={cn(
                              "p-5 cursor-pointer hover:shadow-md transition-all duration-200 group",
                              st === "active" && "ring-2 ring-emerald-400/30",
                              st === "past" && "opacity-70",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
                                style={{ backgroundColor: color }}
                              >
                                <ClipboardList className="w-5 h-5" />
                              </div>
                              <Badge className={cn("text-xs border shrink-0", meta.color)}>
                                {meta.label}
                              </Badge>
                            </div>
                            <h3 className="font-bold text-base break-words group-hover:text-primary transition-colors mb-1">
                              {exam.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3">{course.courseName}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{asNumber(exam.durationMinutes)} دقيقة</span>
                              <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" />النجاح: {asNumber(exam.passScore)}</span>
                              <span className="flex items-center gap-1" dir="ltr">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(exam.endDate).toLocaleDateString("ar")}
                              </span>
                            </div>
                            {st === "active" && (
                              <div className="mt-3 flex items-center justify-end gap-1 text-xs font-bold text-emerald-600">
                                ابدأ الآن <ChevronLeft className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </Card>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
