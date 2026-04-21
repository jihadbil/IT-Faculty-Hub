import React, { useState } from "react";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { useGetCourse, useGetLectures, useGetFiles } from "@workspace/api-client-react";
import { BookOpen, ArrowRight, Clock, Users, Video, FileText, Download, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Card, Badge } from "@/components/ui/shared";
import { formatBytes } from "@/lib/utils";

export default function StudentCourse() {
  const [, params] = useRoute("/student/courses/:id");
  const courseId = parseInt(params?.id || "0");

  const { data: course, isLoading } = useGetCourse(courseId);
  const { data: lectures = [] } = useGetLectures({ courseId });
  const { data: courseFiles = [] } = useGetFiles({ courseId });

  const [expandedLectures, setExpandedLectures] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setExpandedLectures(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return <div className="h-96 bg-white rounded-3xl border border-border animate-pulse" />;
  }

  if (!course) {
    return (
      <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-border">
        <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">المادة غير موجودة</h3>
        <Link href="/student/courses"><span className="text-primary cursor-pointer hover:underline">العودة إلى المواد</span></Link>
      </div>
    );
  }

  const sortedLectures = [...lectures].sort((a, b) => a.lectureNumber - b.lectureNumber);
  const generalFiles = courseFiles.filter(f => !f.lectureId);

  return (
    <div className="space-y-8">
      <Link href="/student/courses">
        <span className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary cursor-pointer text-sm font-bold transition-colors">
          <ArrowRight className="w-4 h-4" />
          العودة إلى كل المواد
        </span>
      </Link>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl overflow-hidden shadow-xl"
      >
        <div className="h-3" style={{ background: course.color || "#3B82F6" }} />
        <div className="bg-white p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-lg shrink-0"
              style={{ background: course.color || "#3B82F6" }}
            >
              <BookOpen className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline">{course.code}</Badge>
                <Badge>السنة {course.year}</Badge>
                <Badge variant="outline">{course.semester}</Badge>
                <Badge variant="success">{course.credits} ساعات معتمدة</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">{course.name}</h1>
              {course.instructor && (
                <p className="text-muted-foreground mt-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  المحاضر: <span className="font-bold">{course.instructor}</span>
                </p>
              )}
              {course.description && (
                <p className="text-foreground/80 mt-4 leading-relaxed">{course.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-border">
            <div className="text-center p-3 bg-muted/30 rounded-xl">
              <p className="text-2xl font-bold text-primary">{lectures.length}</p>
              <p className="text-xs text-muted-foreground">محاضرة</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-xl">
              <p className="text-2xl font-bold text-primary">{courseFiles.length}</p>
              <p className="text-xs text-muted-foreground">ملف</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-xl">
              <p className="text-2xl font-bold text-primary">{course.credits}</p>
              <p className="text-xs text-muted-foreground">ساعة</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* General files */}
      {generalFiles.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-display font-bold text-foreground mb-4">مصادر عامة للمادة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {generalFiles.map(f => <FileItem key={f.id} file={f} />)}
          </div>
        </Card>
      )}

      {/* Lectures */}
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-4">المحاضرات</h2>
        {sortedLectures.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-border">
            <Video className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">لم تتم إضافة أي محاضرة لهذه المادة بعد.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedLectures.map((lec, i) => {
              const lecFiles = courseFiles.filter(f => f.lectureId === lec.id);
              const isOpen = expandedLectures.has(lec.id);

              return (
                <motion.div
                  key={lec.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card>
                    <button
                      onClick={() => toggle(lec.id)}
                      className="w-full p-5 flex items-center gap-4 text-right hover:bg-muted/20 transition-colors"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                        style={{ background: course.color || "#3B82F6" }}
                      >
                        {lec.lectureNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-foreground truncate">{lec.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {lec.duration && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lec.duration} د</span>
                          )}
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {lecFiles.length} ملف</span>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </button>

                    {isOpen && (
                      <div className="border-t border-border p-5 bg-muted/10 space-y-4">
                        {lec.description && (
                          <p className="text-foreground/80 leading-relaxed">{lec.description}</p>
                        )}
                        {lecFiles.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">لا توجد ملفات مرفقة لهذه المحاضرة.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {lecFiles.map(f => <FileItem key={f.id} file={f} />)}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FileItem({ file }: { file: any }) {
  const isVideo = file.type === "video";
  const Icon = isVideo ? Video : FileText;
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border hover:border-primary/40 hover:shadow-md transition-all">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 ${isVideo ? "bg-rose-500" : "bg-blue-500"}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-foreground truncate">{file.title}</h4>
        <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
      </div>
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
        title="فتح"
      >
        <ExternalLink className="w-4 h-4" />
      </a>
      <a
        href={file.url}
        download={file.filename}
        className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
        title="تحميل"
      >
        <Download className="w-4 h-4" />
      </a>
    </div>
  );
}
