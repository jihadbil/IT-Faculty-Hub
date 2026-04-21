import React, { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetCourses, useGetLectures, useGetFiles } from "@workspace/api-client-react";
import { BookOpen, Clock, Users, ArrowLeft, Search, Video, FileText } from "lucide-react";
import { Input, Select, Card, Badge } from "@/components/ui/shared";

export default function StudentCourses() {
  const [year, setYear] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: courses = [], isLoading } = useGetCourses();
  const { data: lectures = [] } = useGetLectures();
  const { data: files = [] } = useGetFiles();

  const filtered = courses.filter(c => {
    if (year && c.year !== parseInt(year)) return false;
    if (semester && c.semester !== semester) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border">
        <h1 className="text-3xl font-display font-bold text-foreground mb-1">المواد الدراسية</h1>
        <p className="text-muted-foreground mb-6">تصفّح جميع المواد المتاحة وادخل لكل مادة لرؤية محاضراتها ومصادرها.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="ابحث باسم المادة أو الكود..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-11"
            />
          </div>
          <Select value={year} onChange={e => setYear(e.target.value)}>
            <option value="">كل السنوات</option>
            <option value="1">السنة الأولى</option>
            <option value="2">السنة الثانية</option>
            <option value="3">السنة الثالثة</option>
            <option value="4">السنة الرابعة</option>
          </Select>
          <Select value={semester} onChange={e => setSemester(e.target.value)}>
            <option value="">كل الفصول</option>
            <option value="الفصل الأول">الفصل الأول</option>
            <option value="الفصل الثاني">الفصل الثاني</option>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-56 bg-white rounded-3xl border border-border animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-border">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">لا توجد مواد</h3>
          <p className="text-muted-foreground">جرّب تغيير المرشحات.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c, i) => {
            const lectureCount = lectures.filter(l => l.courseId === c.id).length;
            const fileCount = files.filter(f => f.courseId === c.id).length;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={`/student/courses/${c.id}`}>
                  <div className="cursor-pointer group">
                    <Card className="h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                      <div
                        className="h-3 w-full"
                        style={{ background: c.color || "#3B82F6" }}
                      />
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3 gap-3">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
                            style={{ background: c.color || "#3B82F6" }}
                          >
                            <BookOpen className="w-7 h-7" />
                          </div>
                          <Badge variant="outline">{c.code}</Badge>
                        </div>
                        <h3 className="text-xl font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {c.name}
                        </h3>
                        {c.instructor && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
                            <Users className="w-4 h-4" />
                            {c.instructor}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3 mt-3">
                          <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" /> {lectureCount} محاضرة</span>
                          <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {fileCount} ملف</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.credits} س</span>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs font-bold text-muted-foreground">السنة {c.year} • {c.semester}</span>
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
