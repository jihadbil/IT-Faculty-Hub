import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { Plus, Trash2, MapPin, Clock, CalendarDays, AlertCircle } from "lucide-react";
import { Button, Card, Modal, Select, Input, Badge } from "@/components/ui/shared";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth";
import { useCoursesForRole, colorForCourse } from "@/lib/queries";
import {
  coursesApi,
  schedulesApi,
  type CourseResponseDto,
  type ScheduleResponseDto,
  type Uuid,
} from "@/lib/external-api";

const ARABIC_DAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

const scheduleSchema = z.object({
  courseId: z.string().min(1, "اختر المادة"),
  dayOfWeek: z.string().min(1, "اختر اليوم"),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  building: z.string().optional(),
  room: z.string().optional(),
});
type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface FlatEntry extends ScheduleResponseDto {
  courseName: string;
  courseCode: string;
  courseColor: string;
}

export default function Schedule() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: courses = [], isLoading: loadingCourses } = useCoursesForRole();

  const courseIds = useMemo(() => courses.map((c) => c.id), [courses]);

  const detailQueries = useQueries({
    queries: courseIds.map((id) => ({
      queryKey: ["external", "course", id],
      queryFn: () => coursesApi.get(id),
      staleTime: 60_000,
    })),
  });

  const isLoading = loadingCourses || detailQueries.some((q) => q.isLoading);
  const errorEntry = detailQueries.find((q) => q.error);
  const fullCourses: CourseResponseDto[] = detailQueries
    .map((q) => q.data)
    .filter((c): c is CourseResponseDto => !!c);

  const flat: FlatEntry[] = useMemo(() => {
    const out: FlatEntry[] = [];
    for (const c of fullCourses) {
      const color = colorForCourse(c.id);
      for (const s of c.schedules ?? []) {
        out.push({
          ...s,
          courseName: c.courseName,
          courseCode: c.courseCode,
          courseColor: color,
        });
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

  const [isAddOpen, setIsAddOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { dayOfWeek: ARABIC_DAYS[0] },
  });

  const createEntry = useMutation({
    mutationFn: (data: ScheduleFormValues) =>
      schedulesApi.create(data.courseId, {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        building: data.building || undefined,
        room: data.room || undefined,
      }),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["external", "course", vars.courseId] });
      setIsAddOpen(false);
      reset();
    },
  });

  const deleteEntry = useMutation({
    mutationFn: ({ courseId, sid }: { courseId: Uuid; sid: number }) =>
      schedulesApi.remove(courseId, sid),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["external", "course", vars.courseId] });
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-border">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">جدول المحاضرات</h1>
          <p className="text-muted-foreground mt-1">المواعيد المضمّنة في الـ API لكل مادة من موادك</p>
        </div>

        {isAdmin && (
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 shrink-0" disabled={courses.length === 0}>
            <Plus className="w-5 h-5" /> إضافة موعد
          </Button>
        )}
      </div>

      {errorEntry?.error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm text-destructive">
            <p className="font-bold">تعذّر تحميل بعض المواد</p>
            <p className="break-words mt-1">{(errorEntry.error as Error).message}</p>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white rounded-2xl border border-border" />)}
        </div>
      ) : (
        <div className="space-y-6">
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
                <div className="bg-primary/5 p-6 md:w-48 flex items-center justify-center md:border-l border-b md:border-b-0 border-border">
                  <h3 className="text-2xl font-display font-bold text-primary">{dayGroup.dayName}</h3>
                </div>
                <div className="p-6 flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayGroup.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 rounded-2xl border border-border bg-white hover:shadow-md transition-shadow relative group"
                      style={{ borderInlineStartColor: entry.courseColor, borderInlineStartWidth: 4 }}
                    >
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm("حذف هذا الموعد؟")) {
                              deleteEntry.mutate({ courseId: entry.courseId, sid: entry.id });
                            }
                          }}
                          className="absolute top-2 left-2 p-1.5 text-destructive bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <Badge variant="outline" className="mb-3 font-mono">{entry.courseCode}</Badge>
                      <h4 className="font-bold text-lg text-foreground mb-3 break-words">{entry.courseName}</h4>
                      <div className="space-y-2 text-sm text-foreground/80 font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 opacity-70" />
                          <span dir="ltr">{entry.startTime} - {entry.endTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 opacity-70" />
                          <span>{[entry.building, entry.room].filter(Boolean).join(" - ") || "غير محدد"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {flat.length === 0 && !errorEntry && (
            <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-border">
              <CalendarDays className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">الجدول فارغ</h3>
              <p className="text-muted-foreground">لا توجد مواعيد محاضرات مضافة لأي مادة بعد.</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="إضافة موعد للجدول">
        <form onSubmit={handleSubmit((d) => createEntry.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">المادة الدراسية</label>
            <Select {...register("courseId")} required>
              <option value="">— اختر المادة —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.courseName} ({c.courseCode})</option>
              ))}
            </Select>
            {errors.courseId && <span className="text-xs text-destructive">{errors.courseId.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">اليوم</label>
            <Select {...register("dayOfWeek")}>
              {ARABIC_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2" dir="ltr">من</label>
              <Input type="time" {...register("startTime")} required dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" dir="ltr">إلى</label>
              <Input type="time" {...register("endTime")} required dir="ltr" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">المبنى</label>
              <Input {...register("building")} placeholder="مبنى الحاسوب" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">القاعة</label>
              <Input {...register("room")} placeholder="قاعة 302" />
            </div>
          </div>
          {createEntry.isError && (
            <p className="text-sm text-destructive break-words">{(createEntry.error as Error).message}</p>
          )}
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>إلغاء</Button>
            <Button type="submit" isLoading={createEntry.isPending}>حفظ</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function normalizeDay(d: string): string {
  if (!d) return "";
  // Try direct Arabic match first
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
  const k = d.toLowerCase().trim();
  return map[k] ?? d;
}
