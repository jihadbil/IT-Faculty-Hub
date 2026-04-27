import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, Clock, Users, ArrowLeft, Search, AlertCircle } from "lucide-react";
import { Input, Select, Card, Badge } from "@/components/ui/shared";
import { useCoursesForRole, colorForCourse } from "@/lib/queries";
import { asNumber } from "@/lib/external-api";

export default function StudentCourses() {
  const [department, setDepartment] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: courses = [], isLoading, error } = useCoursesForRole();

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const c of courses) if (c.department) set.add(c.department);
    return Array.from(set);
  }, [courses]);

  const semesters = useMemo(() => {
    const set = new Set<string>();
    for (const c of courses) if (c.semester) set.add(c.semester);
    return Array.from(set);
  }, [courses]);

  const filtered = courses.filter((c) => {
    if (department && c.department !== department) return false;
    if (semester && c.semester !== semester) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.courseName.toLowerCase().includes(q) && !c.courseCode.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border">
        <h1 className="text-3xl font-display font-bold text-foreground mb-1">المواد الدراسية</h1>
        <p className="text-muted-foreground mb-6">المواد التي أنت مسجّل بها — اضغط أي مادة لمشاهدة محاضراتها.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="ابحث باسم المادة أو الرمز..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-11"
            />
          </div>
          <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">كل الأقسام</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Select value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="">كل الفصول</option>
            {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive break-words">{(error as Error).message}</p>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-56 bg-white rounded-3xl border border-border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-border">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">لا توجد مواد</h3>
          <p className="text-muted-foreground">جرّب تغيير المرشحات أو تواصل مع الإدارة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c, i) => {
            const color = colorForCourse(c.id);
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={`/student/courses/${c.id}`}>
                  <div className="cursor-pointer group">
                    <Card className="h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                      <div className="h-3 w-full" style={{ background: color }} />
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3 gap-3">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
                            style={{ background: color }}
                          >
                            <BookOpen className="w-7 h-7" />
                          </div>
                          <Badge variant="outline" className="font-mono">{c.courseCode}</Badge>
                        </div>
                        <h3 className="text-xl font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors break-words">
                          {c.courseName}
                        </h3>
                        {c.professorName && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
                            <Users className="w-4 h-4" />
                            {c.professorName}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3 mt-3">
                          <span>{c.department}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {asNumber(c.credits)} وحدة</span>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs font-bold text-muted-foreground">
                            {c.semester} • <span dir="ltr">{c.academicYear}</span>
                          </span>
                          <ArrowLeft className="w-5 h-5 text-primary group-hover:-translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Card>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
