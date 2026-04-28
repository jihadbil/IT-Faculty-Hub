import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, BookOpen, Clock, Users, Trash2, ChevronLeft, AlertCircle } from "lucide-react";
import { Button, Card, Modal, Input, Select, Badge } from "@/components/ui/shared";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth";
import { coursesApi, type CourseSummaryDto, asNumber } from "@/lib/external-api";
import { useCoursesForRole, useUsers, colorForCourse } from "@/lib/queries";

const courseSchema = z.object({
  courseName: z.string().min(2, "اسم المادة مطلوب"),
  courseCode: z.string().min(2, "رمز المادة مطلوب").max(20),
  description: z.string().max(1000).optional(),
  department: z.string().min(1, "القسم مطلوب").max(100),
  credits: z.coerce.number().min(1).max(6),
  semester: z.coerce.number().min(0).max(2),
  academicYear: z.string().min(1, "السنة الأكاديمية مطلوبة"),
});

type CourseFormValues = z.infer<typeof courseSchema>;

function thisAcademicYear(): string {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

export default function Courses() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: courses = [], isLoading, error } = useCoursesForRole();
  const { data: users = [] } = useUsers();

  const teachers = useMemo(
    () =>
      users.filter((u) => {
        const lower = u.roles.map((r) => r.toLowerCase());
        return lower.some((r) => /teacher|instructor|professor/.test(r));
      }),
    [users],
  );

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const c of courses) if (c.department) set.add(c.department);
    return Array.from(set);
  }, [courses]);

  const createCourse = useMutation({
    mutationFn: (data: CourseFormValues) =>
      coursesApi.create({
        courseCode: data.courseCode,
        courseName: data.courseName,
        description: data.description || undefined,
        department: data.department,
        credits: data.credits,
        semester: data.semester,
        academicYear: data.academicYear,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external", "courses"] });
      setIsAddModalOpen(false);
      reset();
    },
  });

  const deleteCourse = useMutation({
    mutationFn: (id: string) => coursesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["external", "courses"] }),
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterDept, setFilterDept] = useState<string>("all");

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      credits: 3,
      semester: 0,
      academicYear: thisAcademicYear(),
    },
  });

  const onSubmit = (data: CourseFormValues) => createCourse.mutate(data);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("هل أنت متأكد من حذف هذه المادة؟")) deleteCourse.mutate(id);
  };

  const filtered = filterDept === "all" ? courses : courses.filter((c) => c.department === filterDept);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-border/50">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">المواد الدراسية</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? "إدارة المقررات وتعيين الأساتذة" : "موادك الموكلة إليك"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-48 bg-muted/50"
          >
            <option value="all">كل الأقسام</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
          {isAdmin && (
            <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shrink-0">
              <Plus className="w-5 h-5" /> إضافة مادة
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm text-destructive">
            <p className="font-bold">تعذّر تحميل المواد</p>
            <p className="mt-1 break-words">{(error as Error).message}</p>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course, idx) => (
            <CourseCard
              key={course.id}
              course={course}
              idx={idx}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          ))}

          {filtered.length === 0 && !error && (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-border">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">لا توجد مواد دراسية</h3>
              <p className="text-muted-foreground">
                {isAdmin ? "ابدأ بإضافة أول مادة." : "لم يتم تعيين أي مادة لك بعد."}
              </p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة مادة جديدة">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">اسم المادة</label>
              <Input {...register("courseName")} placeholder="مثال: هياكل البيانات" />
              {errors.courseName && <span className="text-xs text-destructive">{errors.courseName.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">رمز المادة</label>
              <Input {...register("courseCode")} placeholder="CS201" dir="ltr" className="text-left" />
              {errors.courseCode && <span className="text-xs text-destructive">{errors.courseCode.message}</span>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">الوصف</label>
            <Input {...register("description")} placeholder="وصف مختصر للمادة..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">القسم</label>
              <Input {...register("department")} placeholder="مثال: قسم الحاسوب" list="departments-suggest" />
              <datalist id="departments-suggest">
                {departments.map((d) => <option key={d} value={d} />)}
              </datalist>
              {errors.department && <span className="text-xs text-destructive">{errors.department.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">السنة الأكاديمية</label>
              <Input {...register("academicYear")} placeholder="2025-2026" dir="ltr" className="text-left" />
              {errors.academicYear && <span className="text-xs text-destructive">{errors.academicYear.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">الفصل الدراسي</label>
              <Select {...register("semester")}>
                <option value={0}>الفصل الأول (Fall)</option>
                <option value={1}>الفصل الثاني (Spring)</option>
                <option value={2}>الفصل الصيفي (Summer)</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">عدد الوحدات (1-6)</label>
              <Input type="number" min={1} max={6} {...register("credits")} />
              {errors.credits && <span className="text-xs text-destructive">{errors.credits.message}</span>}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            ملاحظة: سيتم تعيين المادة تلقائياً للأستاذ الذي يقوم بإنشائها — لا يمكن تعيين أستاذ آخر من هنا.
          </p>

          {createCourse.isError && (
            <p className="text-sm text-destructive break-words">
              {(createCourse.error as Error).message}
            </p>
          )}

          <div className="pt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>إلغاء</Button>
            <Button type="submit" isLoading={createCourse.isPending}>حفظ المادة</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CourseCard({
  course,
  idx,
  isAdmin,
  onDelete,
}: {
  course: CourseSummaryDto;
  idx: number;
  isAdmin: boolean;
  onDelete: (e: React.MouseEvent, id: string) => void;
}) {
  const color = colorForCourse(course.id);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
    >
      <Link href={`${isAdmin ? "/admin" : ""}/courses/${course.id}`}>
        <Card className="h-full hover:shadow-xl hover:border-primary/30 transition-all duration-300 group cursor-pointer overflow-hidden flex flex-col relative">
          <div className="h-3 w-full" style={{ backgroundColor: color }} />
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <Badge variant="outline" className="bg-muted/50 font-mono text-sm tracking-wider">
                {course.courseCode}
              </Badge>
              {isAdmin && (
                <button
                  onClick={(e) => onDelete(e, course.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              {course.courseName}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">{course.department}</p>
            <div className="grid grid-cols-2 gap-4 mt-auto pt-6 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4 text-primary" />
                <span className="truncate">{course.professorName || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-accent" />
                <span>{asNumber(course.credits)} وحدات</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{course.semester || "—"}</span>
              <span>•</span>
              <span dir="ltr">{course.academicYear}</span>
            </div>
          </div>
          <div className="absolute bottom-6 left-6 w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <ChevronLeft className="w-5 h-5" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
