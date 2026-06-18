import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, Search, AlertCircle, CheckCircle2, Plus, Loader2 } from "lucide-react";
import { Badge, Button, Card, Input, Select } from "@/components/ui/shared";
import { colorForCourse, useAllCourses, useMyEnrollments } from "@/lib/queries";
import { asNumber, enrollmentsApi, type Uuid } from "@/lib/external-api";

export default function BrowseCourses() {
  const qc = useQueryClient();
  const [department, setDepartment] = useState("");
  const [search, setSearch] = useState("");

  const { data: courses = [], isLoading, error } = useAllCourses();
  const { data: enrollments = [] } = useMyEnrollments();

  const enrolledIds = useMemo(() => new Set(enrollments.map((e) => e.courseId)), [enrollments]);

  const departments = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courses) {
      if (c.departmentId && c.departmentName) map.set(c.departmentId, c.departmentName);
      else if (c.department) map.set(c.department, c.department);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [courses]);

  const filtered = courses.filter((c) => {
    if (department && c.departmentId !== department && c.department !== department) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.courseName.toLowerCase().includes(q) && !c.courseCode.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const enroll = useMutation({
    mutationFn: (courseId: Uuid) => enrollmentsApi.enroll({ courseId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["external", "enrollments", "my"] });
      qc.invalidateQueries({ queryKey: ["external", "courses"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border">
        <h1 className="text-3xl font-display font-bold mb-1">تصفّح المواد</h1>
        <p className="text-muted-foreground mb-6">سجّل نفسك في المواد المتاحة من جميع الأقسام.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="ابحث باسم المادة أو الرمز…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-11"
            />
          </div>
          <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">كل الأقسام</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </div>
      </div>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive break-words">{(error as Error).message}</p>
        </Card>
      )}

      {enroll.isError && (
        <Card className="p-4 border-destructive/40 bg-destructive/5">
          <p className="text-sm text-destructive">{(enroll.error as Error).message}</p>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-56 bg-white rounded-3xl border border-border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-border">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold mb-2">لا توجد مواد متاحة</h3>
          <p className="text-muted-foreground">جرّب تغيير المرشحات.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c, i) => {
            const color = colorForCourse(c.id);
            const isEnrolled = enrolledIds.has(c.id);
            const isPending = enroll.isPending && enroll.variables === c.id;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="h-full">
                  <div className="h-3 w-full" style={{ background: color }} />
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
                        style={{ background: color }}
                      >
                        <BookOpen className="w-7 h-7" />
                      </div>
                      <Badge variant="outline" className="font-mono">{c.courseCode}</Badge>
                    </div>
                    <h3 className="text-xl font-display font-bold mb-2 break-words">{c.courseName}</h3>
                    {c.professorName && (
                      <p className="text-sm text-muted-foreground mb-2">{c.professorName}</p>
                    )}
                    <p className="text-xs text-muted-foreground mb-4">
                      {c.departmentName || c.department || "—"} • {c.semester} <span dir="ltr">{c.academicYear}</span> • {asNumber(c.credits)} وحدة
                    </p>
                    <div className="mt-auto">
                      {isEnrolled ? (
                        <Button variant="outline" disabled className="w-full gap-2">
                          <CheckCircle2 className="w-4 h-4" /> مسجّل بالفعل
                        </Button>
                      ) : (
                        <Button
                          onClick={() => enroll.mutate(c.id)}
                          disabled={isPending}
                          className="w-full gap-2"
                        >
                          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          سجّل في هذه المادة
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
