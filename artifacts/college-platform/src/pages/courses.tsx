import React, { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetCourses, useCreateCourse, useDeleteCourse, Course } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, BookOpen, Clock, Users, Trash2, ChevronLeft } from "lucide-react";
import { Button, Card, Modal, Input, Select, Badge } from "@/components/ui/shared";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const courseSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  code: z.string().min(2, "رمز المادة مطلوب"),
  description: z.string().optional(),
  year: z.coerce.number().min(1).max(4),
  semester: z.string().min(1, "الفصل مطلوب"),
  credits: z.coerce.number().min(1),
  instructor: z.string().optional(),
  color: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const COLORS = ["#1e40af", "#0f766e", "#b45309", "#be123c", "#6d28d9", "#4338ca"];

export default function Courses() {
  const queryClient = useQueryClient();
  const { data: courses = [], isLoading } = useGetCourses();
  const createCourse = useCreateCourse();
  const deleteCourse = useDeleteCourse();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterYear, setFilterYear] = useState<string>("all");

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: { year: 1, semester: "الفصل الأول", credits: 3, color: COLORS[0] }
  });

  const onSubmit = (data: CourseFormValues) => {
    createCourse.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
        setIsAddModalOpen(false);
        reset();
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if(confirm("هل أنت متأكد من حذف هذه المادة؟")) {
      deleteCourse.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/courses"] })
      });
    }
  };

  const filteredCourses = filterYear === "all" ? courses : courses.filter(c => c.year.toString() === filterYear);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-border/50">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">المواد الدراسية</h1>
          <p className="text-muted-foreground mt-1">إدارة المقررات وتصفح محتوياتها</p>
        </div>
        <div className="flex items-center gap-4">
          <Select 
            value={filterYear} 
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-40 bg-muted/50"
          >
            <option value="all">جميع السنوات</option>
            <option value="1">السنة الأولى</option>
            <option value="2">السنة الثانية</option>
            <option value="3">السنة الثالثة</option>
            <option value="4">السنة الرابعة</option>
          </Select>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shrink-0">
            <Plus className="w-5 h-5" /> إضافة مادة
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 rounded-3xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, idx) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link href={`/courses/${course.id}`}>
                <Card className="h-full hover:shadow-xl hover:border-primary/30 transition-all duration-300 group cursor-pointer overflow-hidden flex flex-col relative">
                  <div 
                    className="h-3 w-full" 
                    style={{ backgroundColor: course.color || COLORS[0] }} 
                  />
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="outline" className="bg-muted/50 font-mono text-sm tracking-wider">
                        {course.code}
                      </Badge>
                      <button 
                        onClick={(e) => handleDelete(e, course.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <h3 className="text-2xl font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-1">
                      {course.description || "لا يوجد وصف متاح لهذه المادة."}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-auto pt-6 border-t border-border/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="truncate">{course.instructor || "غير محدد"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 text-accent" />
                        <span>{course.credits} وحدات</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-6 left-6 w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ChevronLeft className="w-5 h-5" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
          
          {filteredCourses.length === 0 && (
             <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-border">
               <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
               <h3 className="text-xl font-bold text-foreground mb-2">لا توجد مواد دراسية</h3>
               <p className="text-muted-foreground">قم بإضافة مواد جديدة لتظهر هنا.</p>
             </div>
          )}
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة مادة جديدة">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">اسم المادة</label>
              <Input {...register("name")} placeholder="مثال: هياكل البيانات" />
              {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">رمز المادة</label>
              <Input {...register("code")} placeholder="مثال: CS201" dir="ltr" className="text-left" />
              {errors.code && <span className="text-xs text-destructive">{errors.code.message}</span>}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2">وصف المادة</label>
            <Input {...register("description")} placeholder="وصف مختصر للمادة..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">السنة الدراسية</label>
              <Select {...register("year")}>
                <option value={1}>السنة الأولى</option>
                <option value={2}>السنة الثانية</option>
                <option value={3}>السنة الثالثة</option>
                <option value={4}>السنة الرابعة</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">الفصل الدراسي</label>
              <Select {...register("semester")}>
                <option value="الفصل الأول">الفصل الأول</option>
                <option value="الفصل الثاني">الفصل الثاني</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">عدد الوحدات</label>
              <Input type="number" {...register("credits")} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">أستاذ المادة</label>
              <Input {...register("instructor")} placeholder="اسم الدكتور..." />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">لون البطاقة</label>
            <div className="flex gap-2">
              {COLORS.map(color => (
                <label key={color} className="cursor-pointer relative">
                  <input type="radio" value={color} {...register("color")} className="sr-only peer" />
                  <div className="w-10 h-10 rounded-full border-2 border-transparent peer-checked:border-foreground peer-checked:scale-110 transition-all shadow-sm" style={{ backgroundColor: color }} />
                </label>
              ))}
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>إلغاء</Button>
            <Button type="submit" isLoading={createCourse.isPending}>حفظ المادة</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
