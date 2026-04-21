import React, { useState } from "react";
import { motion } from "framer-motion";
import { useGetFiles, useGetCourses } from "@workspace/api-client-react";
import { FileText, Video, Download, ExternalLink, Search } from "lucide-react";
import { Input, Select, Card, Badge } from "@/components/ui/shared";
import { formatBytes } from "@/lib/utils";

export default function StudentFiles() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");

  const { data: files = [], isLoading } = useGetFiles();
  const { data: courses = [] } = useGetCourses();

  const filtered = files.filter(f => {
    if (type && f.type !== type) return false;
    if (courseId && f.courseId !== parseInt(courseId)) return false;
    if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border">
        <h1 className="text-3xl font-display font-bold text-foreground mb-1">مكتبة الملفات</h1>
        <p className="text-muted-foreground mb-6">حمّل ملفات PDF ومقاطع الفيديو لجميع المواد.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="ابحث عن ملف..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-11"
            />
          </div>
          <Select value={courseId} onChange={e => setCourseId(e.target.value)}>
            <option value="">كل المواد</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={type} onChange={e => setType(e.target.value)}>
            <option value="">كل الأنواع</option>
            <option value="pdf">ملفات PDF</option>
            <option value="video">مقاطع فيديو</option>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-40 bg-white rounded-2xl border border-border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-border">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">لا توجد ملفات</h3>
          <p className="text-muted-foreground">جرّب تغيير المرشحات أو تواصل مع الأستاذ.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((f, i) => {
            const isVideo = f.type === "video";
            const Icon = isVideo ? Video : FileText;
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="p-5 hover:shadow-xl transition-shadow group h-full flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${isVideo ? "bg-rose-500" : "bg-blue-500"}`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Badge variant={isVideo ? "warning" : "default"} className="mb-2">
                        {isVideo ? "فيديو" : "PDF"}
                      </Badge>
                      <h3 className="font-bold text-foreground line-clamp-2 leading-snug">{f.title}</h3>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1 mb-4 flex-1">
                    {f.course && <p className="truncate">📚 {f.course.name}</p>}
                    {f.lecture && <p className="truncate">🎓 {f.lecture.title}</p>}
                    <p>📦 {formatBytes(f.size || 0)}</p>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-border">
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted text-foreground text-sm font-bold transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> فتح
                    </a>
                    <a
                      href={f.url}
                      download={f.filename}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold transition-colors"
                    >
                      <Download className="w-4 h-4" /> تحميل
                    </a>
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
