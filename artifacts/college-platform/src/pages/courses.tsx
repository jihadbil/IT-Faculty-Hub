import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, BookOpen, Clock, Users, Trash2, ChevronLeft, AlertCircle, Pencil } from "lucide-react";
import { Button, Card, Modal, Input, Select, Badge } from "@/components/ui/shared";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth";
import { coursesApi, type CourseSummaryDto, asNumber, type Uuid } from "@/lib/external-api";
import { useCoursesForRole, useUsers, colorForCourse, useDepartments } from "@/lib/queries";

const courseSchema = z.object({
  courseName: z.string().min(2, "اسم المادة مطلوب"),
  courseCode: z.string().min(2, "رمز المادة مطلوب").max(20),
  description: z.string().max(1000).optional(),
  departmentId: z.string().min(1, "القسم مطلوب"),
  credits: z.coerce.number().min(1).max(6),
  semester: z.coerce.number().min(0).max(2),
  academicYear: z.string().min(1, "السنة الأكاديمية مطلوبة"),
});

const editSchema = z.object({
  courseName: z.string().min(2, "اسم المادة مطلوب"),
  description: z.string().max(1000).optional(),
  departmentId: z.string().min(1, "القسم مطلوب"),
  credits: z.coerce.number().min(1).max(6),
  semester: z.coerce.number().min(0).max(2),
  academicYear: z.string().min(1, "السنة الأكاديمية مطلوبة"),
  isActive: z.boolean().optional(),
  professorId: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;
type EditFormValues = z.infer<typeof editSchema>;

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
  const { data: departments = [] } = useDepartments();

  const teachers = useMemo(
    () =>
      users.filter((u) => {
        const lower = u.roles.map((r) => r.toLowerCase());
        return lower.some((r) => /teacher|instructor|professor/.test(r));
      }),
    [users],
  );

  const createCourse = useMutation({
    mutationFn: (data: CourseFormValues) =>
      coursesApi.create({
        courseCode: data.courseCode,
        courseName: data.courseName,
        description: data.description || undefined,
        departmentId: data.departmentId as Uuid,
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

  const updateCourse = useMutation({
    mutationFn: async (data: EditFormValues & { id: Uuid; originalProfessorId?: string }) => {
      const { id, originalProfessorId, professorId, ...rest } = data;
      await coursesApi.update(id, {
        courseName: rest.courseName,
        description: rest.description || null,
        departmentId: rest.departmentId as Uuid,
        credits: rest.credits,
        semester: rest.semester,
        academicYear: rest.academicYear,
        isActive: rest.isActive,
      });
      if (isAdmin && professorId && professorId !== originalProfessorId) {
        await coursesApi.assignProfessor(id, { professorId: professorId as Uuid });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external", "courses"] });
      queryClient.invalidateQueries({ queryKey: ["external", "course"] });
      setEditCourse(null);
    },
  });

  const deleteCourse = useMutation({
    mutationFn: (id: string) => coursesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["external", "courses"] }),
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<CourseSummaryDto | null>(null);
  const [filterDept, setFilterDept] = useState<string>("all");

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: { credits: 3, semester: 0, academicYear: thisAcademicYear() },
  });

  const {
    register: regEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    reset: resetEdit,
    setValue: setEditValue,
  } = useForm<EditFormValues>({ resolver: zodResolver(editSchema) });

  const openEdit = (course: CourseSummaryDto) => {
    setEditCourse(course);
    resetEdit({
      courseName: course.courseName,
      description: undefined,
      departmentId: course.departmentId ?? "",
      credits: asNumber(course.credits),
      semester: 0,
      academicYear: course.academicYear,
      isActive: course.isActive,
      professorId: "",
    });
  };

  const onSubmit = (data: CourseFormValues) => createCourse.mutate(data);
  const onEditSubmit = (data: EditFormValues) => {
    if (!editCourse) return;
    updateCourse.mutate({ ...data, id: editCourse.id as Uuid });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("هل أنت متأكد من حذف هذه المادة؟")) deleteCourse.mutate(id);
  };

  const filtered = filterDept === "all"
    ? courses
    : courses.filter((c) => c.departmentId === filterDept || c.department === filterDept);

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
          <Select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="w-52 bg-muted/50">
            <option value="all">كل الأقسام</option>
            {departments.map((d) => (
              <option key={d.id as string} value={d.id as string}>{d.name}</option>
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
              onEdit={openEdit}
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

      {/* ── نافذة الإضافة ── */}
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
              <label className="block text-sm font-bold mb-2">القسم الأكاديمي</label>
              <Select {...register("departmentId")}>
                <option value="">— اختر القسم —</option>
                {departments.map((d) => (
                  <option key={d.id as string} value={d.id as string}>{d.name}</option>
                ))}
              </Select>
              {errors.departmentId && <span className="text-xs text-destructive">{errors.departmentId.message}</span>}
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
            ملاحظة: سيتم تعيين المادة تلقائياً للأستاذ الذي يقوم بإنشائها.
          </p>
          {createCourse.isError && (
            <p className="text-sm text-destructive break-words">{(createCourse.error as Error).message}</p>
          )}
          <div className="pt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>إلغاء</Button>
            <Button type="submit" isLoading={createCourse.isPending}>حفظ المادة</Button>
          </div>
        </form>
      </Modal>

      {/* ── نافذة التعديل ── */}
      <Modal
        isOpen={!!editCourse}
        onClose={() => setEditCourse(null)}
        title={`تعديل: ${editCourse?.courseName ?? ""}`}
      >
        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">اسم المادة</label>
            <Input {...regEdit("courseName")} />
            {editErrors.courseName && <span className="text-xs text-destructive">{editErrors.courseName.message}</span>}
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
              {editErrors.departmentId && <span className="text-xs text-destructive">{editErrors.departmentId.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">السنة الأكاديمية</label>
              <Input {...regEdit("academicYear")} dir="ltr" className="text-left" />
              {editErrors.academicYear && <span className="text-xs text-destructive">{editErrors.academicYear.message}</span>}
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
              {editErrors.credits && <span className="text-xs text-destructive">{editErrors.credits.message}</span>}
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
              id="isActiveEdit"
              className="w-4 h-4 accent-primary"
              {...regEdit("isActive")}
            />
            <label htmlFor="isActiveEdit" className="text-sm font-bold cursor-pointer">
              المادة مفعّلة (ظاهرة للطلاب)
            </label>
          </div>

          {updateCourse.isError && (
            <p className="text-sm text-destructive break-words">{(updateCourse.error as Error).message}</p>
          )}

          <div className="pt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setEditCourse(null)}>إلغاء</Button>
            <Button type="submit" isLoading={updateCourse.isPending}>حفظ التعديلات</Button>
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
  onEdit,
}: {
  course: CourseSummaryDto;
  idx: number;
  isAdmin: boolean;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onEdit: (course: CourseSummaryDto) => void;
}) {
  const color = colorForCourse(course.id);
  const deptDisplay = course.departmentName || course.department || "";
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
              {(isAdmin || true) && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(course); }}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    title="تعديل المادة"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={(e) => onDelete(e, course.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                      title="حذف المادة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              {course.courseName}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">{deptDisplay}</p>
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
