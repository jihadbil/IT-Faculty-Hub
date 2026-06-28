import React, { useState } from "react";
import { useRoute, Redirect, Link } from "wouter";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlayCircle,
  Plus,
  Trash2,
  Clock,
  UploadCloud,
  ExternalLink,
  ArrowRight,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Video,
  ClipboardCheck,
  CalendarCheck,
  ClipboardList,
  FolderOpen,
  Users as UsersIcon,
  Pencil,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, Card, Modal, Input, Select, Badge } from "@/components/ui/shared";
import { useAuth } from "@/lib/auth";
import { useCourse, useCourseVideos, colorForCourse, useDepartments, useUsers } from "@/lib/queries";
import {
  videosApi,
  coursesApi,
  asNumber,
  type VideoLectureResponseDto,
  type Uuid,
  type ScheduleResponseDto,
} from "@/lib/external-api";
import {
  AssessmentsTab,
  AttendanceTab,
  ExamsTab,
  FilesTab,
  StudentsTab,
} from "@/components/course-tabs";
import { cn, resolveAssetUrl } from "@/lib/utils";

// ── Edit form schema ──
const editCourseSchema = z.object({
  courseName: z.string().min(2, "اسم المادة مطلوب"),
  description: z.string().max(1000).optional(),
  departmentId: z.string().min(1, "القسم مطلوب"),
  credits: z.coerce.number().min(1).max(6),
  semester: z.coerce.number().min(0).max(2),
  academicYear: z.string().min(1, "السنة الأكاديمية مطلوبة"),
  isActive: z.boolean().optional(),
  professorId: z.string().optional(),
});
type EditCourseValues = z.infer<typeof editCourseSchema>;

type TabKey = "videos" | "files" | "assessments" | "attendance" | "exams" | "students";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "videos", label: "الفيديوهات", icon: Video },
  { key: "files", label: "الملفات", icon: FolderOpen },
  { key: "assessments", label: "التقييمات", icon: ClipboardCheck },
  { key: "attendance", label: "الحضور", icon: CalendarCheck },
  { key: "exams", label: "الامتحانات", icon: ClipboardList },
  { key: "students", label: "الطلاب", icon: UsersIcon },
];

export default function CourseDetails() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, paramsTeacher] = useRoute("/courses/:id");
  const [, paramsAdmin] = useRoute("/admin/courses/:id");
  const courseId: Uuid | undefined = paramsTeacher?.id ?? paramsAdmin?.id;

  const { data: course, isLoading: loadingCourse, error } = useCourse(courseId);
  const { data: videos = [] } = useCourseVideos(courseId);
  const { data: departments = [] } = useDepartments();
  const { data: users = [] } = useUsers();

  const [tab, setTab] = useState<TabKey>("videos");
  const [editOpen, setEditOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const isOwnerTeacher = user?.role === "teacher" && course?.professor?.id === user?.id;
  const canEdit = isAdmin || isOwnerTeacher;
  const isTeacherButNotOwner = user?.role === "teacher" && course && course.professor?.id !== user.id;

  const teachers = React.useMemo(
    () =>
      users.filter((u) => {
        const lower = u.roles.map((r) => r.toLowerCase());
        return lower.some((r) => /teacher|instructor|professor/.test(r));
      }),
    [users],
  );

  const {
    register: regEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    reset: resetEdit,
  } = useForm<EditCourseValues>({ resolver: zodResolver(editCourseSchema) });

  const updateCourse = useMutation({
    mutationFn: async (data: EditCourseValues) => {
      if (!courseId) return;
      await coursesApi.update(courseId, {
        courseName: data.courseName,
        description: data.description || null,
        departmentId: data.departmentId as Uuid,
        credits: data.credits,
        semester: data.semester,
        academicYear: data.academicYear,
        isActive: data.isActive,
      });
      if (isAdmin && data.professorId) {
        await coursesApi.assignProfessor(courseId, { professorId: data.professorId as Uuid });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external", "course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["external", "courses"] });
      setEditOpen(false);
    },
  });

  const openEditModal = () => {
    if (!course) return;
    resetEdit({
      courseName: course.courseName,
      description: course.description ?? undefined,
      departmentId: course.departmentId ?? "",
      credits: asNumber(course.credits),
      semester: 0,
      academicYear: course.academicYear,
      isActive: course.isActive,
      professorId: course.professor?.id ?? "",
    });
    setEditOpen(true);
  };

  if (loadingCourse) return <div className="p-12 text-center text-xl animate-pulse">جاري التحميل...</div>;
  if (error)
    return (
      <Card className="p-6 border-destructive/40 bg-destructive/5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div className="text-sm text-destructive">
          <p className="font-bold">فشل تحميل المادة</p>
          <p className="break-words mt-1">{(error as Error).message}</p>
        </div>
      </Card>
    );
  if (!course) return <div className="p-12 text-center text-xl text-destructive">لم يتم العثور على المادة</div>;
  if (isTeacherButNotOwner) return <Redirect to="/courses" />;

  const color = colorForCourse(course.id);

  return (
    <div className="space-y-8">
      <Link href={isAdmin ? "/admin/courses" : "/courses"}>
        <span className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary cursor-pointer text-sm font-bold transition-colors">
          <ArrowRight className="w-4 h-4" />
          العودة إلى المواد
        </span>
      </Link>

      {/* ── Header ── */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl p-8 md:p-12 text-white" style={{ backgroundColor: color }}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <Badge variant="outline" className="bg-white/20 text-white border-white/30 font-mono">
                {course.courseCode}
              </Badge>
              {canEdit && (
                <button
                  onClick={openEditModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-bold transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  تعديل المادة
                </button>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 break-words">{course.courseName}</h1>
            <p className="text-white/80 max-w-2xl text-lg break-words">{course.description || "لا يوجد وصف"}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/80">
              <span>📍 {course.departmentName || course.department || "—"}</span>
              <span>👤 {course.professor?.fullName || "—"}</span>
              <span dir="ltr">📅 {course.semester} • {course.academicYear}</span>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 min-w-[100px]">
              <div className="text-3xl font-bold mb-1">{videos.length}</div>
              <div className="text-white/70 text-sm">فيديو</div>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 min-w-[100px]">
              <div className="text-3xl font-bold mb-1">{asNumber(course.enrolledStudentsCount)}</div>
              <div className="text-white/70 text-sm">طالب</div>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 min-w-[100px]">
              <div className="text-3xl font-bold mb-1">{asNumber(course.credits)}</div>
              <div className="text-white/70 text-sm">وحدة</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Schedules ── */}
      {course.schedules?.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-display font-bold mb-4">أوقات المحاضرات</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {course.schedules.map((s: ScheduleResponseDto) => (
              <div key={s.id} className="p-4 rounded-2xl bg-muted/40 border border-border">
                <p className="font-bold text-foreground">{s.dayOfWeek}</p>
                <p className="text-sm text-muted-foreground mt-1" dir="ltr">{s.startTime} - {s.endTime}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {[s.building, s.roomNumber].filter(Boolean).join(" - ") || "بدون قاعة"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Tabs ── */}
      <div className="bg-white rounded-2xl border border-border p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                tab === t.key
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted/50",
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "videos" && <VideosTab courseId={course.id} canEdit={canEdit} color={color} />}
      {tab === "files" && <FilesTab courseId={course.id} canEdit={canEdit} />}
      {tab === "assessments" && <AssessmentsTab courseId={course.id} canEdit={canEdit} />}
      {tab === "attendance" && <AttendanceTab courseId={course.id} canEdit={canEdit} />}
      {tab === "exams" && <ExamsTab courseId={course.id} canEdit={canEdit} />}
      {tab === "students" && <StudentsTab courseId={course.id} canEdit={canEdit} />}

      {/* ── Edit Modal ── */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="تعديل بيانات المادة">
        <form onSubmit={handleEditSubmit((d) => updateCourse.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">اسم المادة</label>
            <Input {...regEdit("courseName")} />
            {editErrors.courseName && (
              <span className="text-xs text-destructive">{editErrors.courseName.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">الوصف</label>
            <Input {...regEdit("description")} placeholder="وصف مختصر للمادة..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">القسم الأكاديمي</label>
              <Select {...regEdit("departmentId")}>
                <option value="">— اختر القسم —</option>
                {departments.map((d) => (
                  <option key={d.id as string} value={d.id as string}>{d.name}</option>
                ))}
              </Select>
              {editErrors.departmentId && (
                <span className="text-xs text-destructive">{editErrors.departmentId.message}</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">السنة الأكاديمية</label>
              <Input {...regEdit("academicYear")} dir="ltr" className="text-left" />
              {editErrors.academicYear && (
                <span className="text-xs text-destructive">{editErrors.academicYear.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">الفصل الدراسي</label>
              <Select {...regEdit("semester")}>
                <option value={0}>الفصل الأول (Fall)</option>
                <option value={1}>الفصل الثاني (Spring)</option>
                <option value={2}>الفصل الصيفي (Summer)</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">عدد الوحدات (1-6)</label>
              <Input type="number" min={1} max={6} {...regEdit("credits")} />
              {editErrors.credits && (
                <span className="text-xs text-destructive">{editErrors.credits.message}</span>
              )}
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="block text-sm font-bold mb-2">الأستاذ المسؤول</label>
              <Select {...regEdit("professorId")}>
                <option value="">— لا تغيير —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.fullName}</option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                اترك هذا الحقل فارغاً إذا لم تريد تغيير الأستاذ الحالي.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border">
            <input
              type="checkbox"
              id="isActiveChk"
              className="w-4 h-4 accent-primary"
              {...regEdit("isActive")}
            />
            <label htmlFor="isActiveChk" className="text-sm font-bold cursor-pointer">
              المادة مفعّلة (ظاهرة للطلاب)
            </label>
          </div>

          {updateCourse.isError && (
            <p className="text-sm text-destructive break-words">
              {(updateCourse.error as Error).message}
            </p>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>إلغاء</Button>
            <Button type="submit" isLoading={updateCourse.isPending}>حفظ التعديلات</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────
// Videos tab
// ─────────────────────────────────────────
function VideosTab({ courseId, canEdit, color }: { courseId: Uuid; canEdit: boolean; color: string }) {
  const queryClient = useQueryClient();
  const { data: videos = [], isLoading } = useCourseVideos(courseId);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const deleteVideo = useMutation({
    mutationFn: (id: number) => videosApi.remove(courseId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["external", "course", courseId, "videos"] }),
  });

  const publishVideo = useMutation({
    mutationFn: (id: number) => videosApi.publish(courseId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["external", "course", courseId, "videos"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold">المحاضرات المرئية</h2>
        {canEdit && (
          <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
            <UploadCloud className="w-5 h-5" /> رفع فيديو
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : videos.length === 0 ? (
        <Card className="p-16 text-center border-dashed bg-transparent">
          <PlayCircle className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold mb-2">لا توجد محاضرات مرئية</h3>
          <p className="text-muted-foreground">
            {canEdit ? "ابدأ برفع أول فيديو لهذه المادة." : "لم يتم رفع أي فيديو بعد."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...videos]
            .sort((a, b) => asNumber(a.videoOrder) - asNumber(b.videoOrder))
            .map((v) => (
              <VideoCard
                key={v.id}
                video={v}
                canEdit={canEdit}
                color={color}
                onDelete={(id) => {
                  if (confirm("حذف هذا الفيديو؟")) deleteVideo.mutate(id);
                }}
                onPublish={(id) => publishVideo.mutate(id)}
                isPublishing={publishVideo.isPending}
              />
            ))}
        </div>
      )}

      <UploadVideoModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        courseId={courseId}
        nextOrder={videos.length + 1}
      />
    </div>
  );
}

function VideoCard({
  video,
  canEdit,
  color,
  onDelete,
  onPublish,
  isPublishing,
}: {
  video: VideoLectureResponseDto;
  canEdit: boolean;
  color: string;
  onDelete: (id: number) => void;
  onPublish: (id: number) => void;
  isPublishing: boolean;
}) {
  return (
    <Card className="p-6 flex flex-col group hover:border-primary/30 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div
          className="w-12 h-12 rounded-xl text-white flex items-center justify-center font-display font-bold text-xl"
          style={{ backgroundColor: color }}
        >
          {asNumber(video.videoOrder)}
        </div>
        <div className="flex items-center gap-2">
          {video.isPublished ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> منشور
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300 bg-amber-50">
              <XCircle className="w-3.5 h-3.5" /> مسودة
            </Badge>
          )}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2 break-words">{video.title}</h3>
      <p className="text-muted-foreground text-sm flex-1 break-words">{video.description || "لا يوجد وصف"}</p>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" /> {asNumber(video.views)} مشاهدة
        </span>
        {video.durationSeconds ? (
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {Math.round(asNumber(video.durationSeconds) / 60)} د
          </span>
        ) : null}
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
        {video.streamUrl && (
          <a
            href={resolveAssetUrl(video.streamUrl)}
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted text-foreground text-sm font-bold transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> فتح
          </a>
        )}
        {canEdit && !video.isPublished && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onPublish(video.id)}
            disabled={isPublishing}
            className="gap-1"
          >
            <CheckCircle2 className="w-4 h-4" /> نشر
          </Button>
        )}
        {canEdit && (
          <button
            onClick={() => onDelete(video.id)}
            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            aria-label="حذف"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </Card>
  );
}

function UploadVideoModal({
  isOpen,
  onClose,
  courseId,
  nextOrder,
}: {
  isOpen: boolean;
  onClose: () => void;
  courseId: Uuid;
  nextOrder: number;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(nextOrder);
  const [video, setVideo] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  React.useEffect(() => {
    if (isOpen) setOrder(nextOrder);
  }, [isOpen, nextOrder]);

  const upload = useMutation({
    mutationFn: () =>
      videosApi.create(courseId, {
        title,
        description: description || undefined,
        videoOrder: order,
        video: video!,
        thumbnail: thumbnail || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external", "course", courseId, "videos"] });
      onClose();
      setTitle("");
      setDescription("");
      setVideo(null);
      setThumbnail(null);
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;
    upload.mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="رفع محاضرة فيديو جديدة">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">عنوان المحاضرة</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مقدمة في الخوارزميات"
            required
            maxLength={300}
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">وصف مختصر</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="عن ماذا تتحدث المحاضرة..."
            maxLength={1000}
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">ترتيب الفيديو</label>
          <Input type="number" min={1} max={999} value={order} onChange={(e) => setOrder(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">ملف الفيديو</label>
          <div className="border-2 border-dashed border-muted rounded-2xl p-6 text-center relative hover:bg-muted/30 transition-colors">
            <input
              type="file"
              required
              accept="video/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => e.target.files?.[0] && setVideo(e.target.files[0])}
            />
            <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="font-bold text-primary text-sm">{video ? video.name : "انقر لاختيار ملف الفيديو"}</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">صورة مصغّرة (اختياري)</label>
          <div className="border-2 border-dashed border-muted rounded-2xl p-4 text-center relative hover:bg-muted/30 transition-colors">
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => e.target.files?.[0] && setThumbnail(e.target.files[0])}
            />
            <p className="text-sm text-muted-foreground">{thumbnail ? thumbnail.name : "اختر صورة مصغّرة"}</p>
          </div>
        </div>

        {upload.isError && (
          <p className="text-sm text-destructive break-words">{(upload.error as Error).message}</p>
        )}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button type="submit" isLoading={upload.isPending} disabled={!video}>
            <Plus className="w-4 h-4 ms-2" /> رفع
          </Button>
        </div>
      </form>
    </Modal>
  );
}
