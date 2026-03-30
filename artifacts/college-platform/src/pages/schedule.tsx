import React, { useState } from "react";
import { motion } from "framer-motion";
import { useGetSchedule, useGetCourses, useCreateScheduleEntry, useDeleteScheduleEntry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, MapPin, Clock } from "lucide-react";
import { Button, Card, Modal, Select, Input, Badge } from "@/components/ui/shared";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ARABIC_DAYS } from "@/lib/utils";

const scheduleSchema = z.object({
  courseId: z.coerce.number().min(1, "اختر المادة"),
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().min(1, "مطلوب"),
  endTime: z.string().min(1, "مطلوب"),
  location: z.string().optional(),
  type: z.enum(["lecture", "lab", "tutorial"])
});
type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export default function Schedule() {
  const queryClient = useQueryClient();
  
  const [year, setYear] = useState<number>(1);
  const [semester, setSemester] = useState<string>("الفصل الأول");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: schedule = [], isLoading } = useGetSchedule({ year, semester });
  const { data: courses = [] } = useGetCourses({ year, semester });
  
  const createEntry = useCreateScheduleEntry();
  const deleteEntry = useDeleteScheduleEntry();

  const { register, handleSubmit, reset } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { type: "lecture", dayOfWeek: 0 }
  });

  const onSubmit = (data: ScheduleFormValues) => {
    createEntry.mutate({ data: { ...data, year, semester } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
        setIsAddOpen(false);
        reset();
      }
    });
  };

  // Group schedule by day
  const groupedSchedule = ARABIC_DAYS.map((dayName, dayIndex) => ({
    dayName,
    entries: schedule.filter(s => s.dayOfWeek === dayIndex).sort((a, b) => a.startTime.localeCompare(b.startTime))
  }));

  const getTypeLabel = (type: string) => {
    if(type === 'lab') return { label: 'مختبر', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' };
    if(type === 'tutorial') return { label: 'تمارين', color: 'bg-amber-500/10 text-amber-600 border-amber-200' };
    return { label: 'محاضرة', color: 'bg-blue-500/10 text-blue-600 border-blue-200' };
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-border">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">جدول المحاضرات</h1>
          <p className="text-muted-foreground mt-1">تنظيم ومتابعة المحاضرات الأسبوعية</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 flex-1 lg:flex-none bg-muted/30 p-2 rounded-xl border border-border">
            <Select value={year} onChange={e => setYear(parseInt(e.target.value))} className="bg-transparent border-none shadow-none focus-visible:ring-0">
              <option value={1}>السنة الأولى</option>
              <option value={2}>السنة الثانية</option>
              <option value={3}>السنة الثالثة</option>
              <option value={4}>السنة الرابعة</option>
            </Select>
            <div className="w-px h-6 bg-border" />
            <Select value={semester} onChange={e => setSemester(e.target.value)} className="bg-transparent border-none shadow-none focus-visible:ring-0">
              <option value="الفصل الأول">الفصل الأول</option>
              <option value="الفصل الثاني">الفصل الثاني</option>
            </Select>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 w-full sm:w-auto shrink-0">
            <Plus className="w-5 h-5" /> إضافة موعد
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-border" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedSchedule.map((dayGroup, idx) => {
            if (dayGroup.entries.length === 0) return null;
            
            return (
              <motion.div
                key={dayGroup.dayName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm flex flex-col md:flex-row"
              >
                <div className="bg-primary/5 p-6 md:w-48 flex items-center justify-center md:border-l border-b md:border-b-0 border-border">
                  <h3 className="text-2xl font-display font-bold text-primary">{dayGroup.dayName}</h3>
                </div>
                
                <div className="p-6 flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayGroup.entries.map(entry => {
                    const course = courses.find(c => c.id === entry.courseId);
                    const typeInfo = getTypeLabel(entry.type);
                    
                    return (
                      <div key={entry.id} className={`p-4 rounded-2xl border transition-all hover:shadow-md relative group ${typeInfo.color} bg-white`}>
                        <button 
                          onClick={() => {
                            if(confirm('حذف هذا الموعد؟')) deleteEntry.mutate({ id: entry.id }, {
                              onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/schedule"] })
                            });
                          }}
                          className="absolute top-2 left-2 p-1.5 text-destructive bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <Badge variant="outline" className={`mb-3 bg-white/50 ${typeInfo.color}`}>
                          {typeInfo.label}
                        </Badge>
                        <h4 className="font-bold text-lg text-foreground mb-3">{course?.name || 'مادة محذوفة'}</h4>
                        
                        <div className="space-y-2 text-sm text-foreground/80 font-medium">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 opacity-70" />
                            <span dir="ltr">{entry.startTime} - {entry.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 opacity-70" />
                            <span>{entry.location || 'غير محدد'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
          
          {schedule.length === 0 && (
             <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-border">
               <CalendarDays className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
               <h3 className="text-xl font-bold text-foreground mb-2">الجدول فارغ</h3>
               <p className="text-muted-foreground">قم بإضافة مواعيد محاضرات للجدول لتظهر هنا.</p>
             </div>
          )}
        </div>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="إضافة موعد جديد للجدول">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">المادة الدراسية</label>
            <Select {...register("courseId")} required>
              <option value="">-- اختر المادة --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            {courses.length === 0 && <p className="text-xs text-amber-600 mt-1">يجب إضافة مواد لهذا الفصل أولاً.</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">اليوم</label>
              <Select {...register("dayOfWeek")}>
                {ARABIC_DAYS.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">النوع</label>
              <Select {...register("type")}>
                <option value="lecture">محاضرة</option>
                <option value="lab">مختبر</option>
                <option value="tutorial">تمارين</option>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2" dir="ltr">من الساعة (e.g. 08:00)</label>
              <Input type="time" {...register("startTime")} required dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" dir="ltr">إلى الساعة (e.g. 10:00)</label>
              <Input type="time" {...register("endTime")} required dir="ltr" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">القاعة / المعمل</label>
            <Input {...register("location")} placeholder="مثال: قاعة 302" />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>إلغاء</Button>
            <Button type="submit" isLoading={createEntry.isPending} disabled={courses.length === 0}>حفظ الموعد</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
