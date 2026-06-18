import React, { useState } from "react";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ArrowRight,
  Clock,
  Users,
  Video,
  ExternalLink,
  AlertCircle,
  PlayCircle,
  Eye,
  ClipboardCheck,
  CalendarCheck,
  ClipboardList,
  FolderOpen,
  Power,
} from "lucide-react";
import { Card, Badge, Button, Modal } from "@/components/ui/shared";
import { useCourse, useCourseVideos, colorForCourse, useMyEnrollments } from "@/lib/queries";
import { videosApi, enrollmentsApi, asNumber, type VideoLectureResponseDto } from "@/lib/external-api";
import { AssessmentsTab, AttendanceTab, ExamsTab, FilesTab } from "@/components/course-tabs";
import { cn } from "@/lib/utils";

type TabKey = "videos" | "files" | "assessments" | "attendance" | "exams";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "videos", label: "الفيديوهات", icon: Video },
  { key: "files", label: "الملفات", icon: FolderOpen },
  { key: "assessments", label: "درجاتي", icon: ClipboardCheck },
  { key: "attendance", label: "حضوري", icon: CalendarCheck },
  { key: "exams", label: "الامتحانات", icon: ClipboardList },
];

export default function StudentCourse() {
  const [, params] = useRoute("/student/courses/:id");
  const courseId = params?.id;
  const qc = useQueryClient();
  const { data: course, isLoading, error } = useCourse(courseId);
  const { data: videos = [] } = useCourseVideos(courseId);
  const { data: enrollments = [] } = useMyEnrollments();

  const [activeVideo, setActiveVideo] = useState<VideoLectureResponseDto | null>(null);
  const [tab, setTab] = useState<TabKey>("videos");

  const recordView = useMutation({
    mutationFn: (videoId: number) => videosApi.view(courseId!, videoId),
  });

  const unenroll = useMutation({
    mutationFn: () => enrollmentsApi.unenroll(courseId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["external"] });
      window.location.href = "/student/courses";
    },
  });

  if (isLoading) {
    return <div className="h-96 bg-white rounded-3xl border border-border animate-pulse" />;
  }

  if (error) {
    return (
      <Card className="p-6 border-destructive/40 bg-destructive/5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm text-destructive break-words">{(error as Error).message}</p>
      </Card>
    );
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

  const color = colorForCourse(course.id);
  const published = videos.filter((v) => v.isPublished);
  const isEnrolled = enrollments.some((e) => e.courseId === course.id);

  return (
    <div className="space-y-8">
      <Link href="/student/courses">
        <span className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary cursor-pointer text-sm font-bold transition-colors">
          <ArrowRight className="w-4 h-4" />
          العودة إلى كل المواد
        </span>
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl overflow-hidden shadow-xl">
        <div className="h-3" style={{ background: color }} />
        <div className="bg-white p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-lg shrink-0" style={{ background: color }}>
              <BookOpen className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className="font-mono">{course.courseCode}</Badge>
                <Badge>{course.semester}</Badge>
                <Badge variant="outline"><span dir="ltr">{course.academicYear}</span></Badge>
                <Badge variant="success">{asNumber(course.credits)} وحدات</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground break-words">{course.courseName}</h1>
              {course.professor?.fullName && (
                <p className="text-muted-foreground mt-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  المحاضر: <span className="font-bold">{course.professor.fullName}</span>
                </p>
              )}
              {course.description && (
                <p className="text-foreground/80 mt-4 leading-relaxed break-words">{course.description}</p>
              )}
            </div>
            {isEnrolled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("إلغاء تسجيلي من هذه المادة؟")) unenroll.mutate();
                }}
                disabled={unenroll.isPending}
                className="gap-1 shrink-0"
              >
                <Power className="w-4 h-4" /> إلغاء التسجيل
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-border">
            <Stat label="فيديو" value={published.length} />
            <Stat label="طالب مسجّل" value={asNumber(course.enrolledStudentsCount)} />
            <Stat label="ساعة" value={asNumber(course.credits)} />
          </div>
        </div>
      </motion.div>

      {course.schedules?.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-display font-bold text-foreground mb-4">أوقات المحاضرات</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {course.schedules.map((s) => (
              <div key={s.id} className="p-4 rounded-2xl bg-muted/30 border border-border">
                <p className="font-bold text-foreground">{s.dayOfWeek}</p>
                <p className="text-sm text-muted-foreground mt-1" dir="ltr">{s.startTime} - {s.endTime}</p>
                <p className="text-xs text-muted-foreground mt-1">{[s.building, s.roomNumber].filter(Boolean).join(" - ") || "بدون قاعة"}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-border p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                tab === t.key
                  ? "bg-emerald-700 text-white shadow-md"
                  : "text-muted-foreground hover:bg-muted/50",
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "videos" && (
        <div>
          {published.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-border">
              <Video className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">لم تتم إضافة أي محاضرة فيديو بعد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...published]
                .sort((a, b) => asNumber(a.videoOrder) - asNumber(b.videoOrder))
                .map((v) => (
                  <Card key={v.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="relative aspect-video bg-muted flex items-center justify-center group cursor-pointer" onClick={() => { setActiveVideo(v); recordView.mutate(v.id); }}>
                      {v.thumbnailUrl ? (
                        <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: color }}>
                          <PlayCircle className="w-16 h-16 text-white/80" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <PlayCircle className="w-16 h-16 text-white" />
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-lg text-foreground break-words">{v.title}</h3>
                        <Badge variant="outline" className="shrink-0">#{asNumber(v.videoOrder)}</Badge>
                      </div>
                      {v.description && <p className="text-sm text-muted-foreground line-clamp-2 break-words">{v.description}</p>}
                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {asNumber(v.views)} مشاهدة</span>
                        {v.durationSeconds ? (
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {Math.round(asNumber(v.durationSeconds) / 60)} د</span>
                        ) : null}
                      </div>
                      {v.streamUrl && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="mt-3 gap-1 w-full"
                          onClick={() => { setActiveVideo(v); recordView.mutate(v.id); }}
                        >
                          <PlayCircle className="w-4 h-4" /> مشاهدة
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}

      {tab === "files" && <FilesTab courseId={course.id} canEdit={false} studentMode />}
      {tab === "assessments" && <AssessmentsTab courseId={course.id} canEdit={false} studentMode />}
      {tab === "attendance" && <AttendanceTab courseId={course.id} canEdit={false} studentMode />}
      {tab === "exams" && <ExamsTab courseId={course.id} canEdit={false} studentMode />}

      {activeVideo && activeVideo.streamUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 bg-zinc-900 text-white">
              <h3 className="font-bold truncate">{activeVideo.title}</h3>
              <a href={activeVideo.streamUrl} target="_blank" rel="noreferrer" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
                <ExternalLink className="w-4 h-4" /> فتح
              </a>
            </div>
            <video src={activeVideo.streamUrl} controls autoPlay className="w-full aspect-video bg-black" />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center p-3 bg-muted/30 rounded-xl">
      <p className="text-2xl font-bold text-emerald-700">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
