import React from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useGetCourses, useGetLectures, useGetFiles, useGetSchedule } from "@workspace/api-client-react";
import { BookOpen, Video, FileText, CalendarDays, ArrowLeft, Users } from "lucide-react";
import { Card } from "@/components/ui/shared";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Dashboard() {
  const { data: courses = [], isLoading: loadingCourses } = useGetCourses();
  const { data: lectures = [] } = useGetLectures();
  const { data: files = [] } = useGetFiles();
  const { data: schedule = [] } = useGetSchedule();

  const pdfCount = files.filter(f => f.type === 'pdf').length;
  const videoCount = files.filter(f => f.type === 'video').length;

  const stats = [
    { label: "المواد الدراسية", value: courses.length, icon: BookOpen, color: "bg-blue-500", href: "/courses" },
    { label: "المحاضرات المرفوعة", value: lectures.length, icon: Video, color: "bg-teal-500", href: "/courses" },
    { label: "الملفات (PDF)", value: pdfCount, icon: FileText, color: "bg-rose-500", href: "/files" },
    { label: "محاضرات الأسبوع", value: schedule.length, icon: CalendarDays, color: "bg-amber-500", href: "/schedule" },
  ];

  const chartData = [
    { name: 'السنة الأولى', value: courses.filter(c => c.year === 1).length },
    { name: 'السنة الثانية', value: courses.filter(c => c.year === 2).length },
    { name: 'السنة الثالثة', value: courses.filter(c => c.year === 3).length },
    { name: 'السنة الرابعة', value: courses.filter(c => c.year === 4).length },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10"
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
          alt="Hero background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/40" />
        <div className="relative p-8 md:p-12 text-white">
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-4">مرحباً بك في منصة الكلية</h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed">
            نظام متكامل لإدارة المقررات الدراسية، رفع المحاضرات، وتتبع الجداول الأسبوعية لطلاب وأعضاء هيئة التدريس في كلية تقنية المعلومات.
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link href={stat.href}>
              <Card className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground font-medium mb-2">{stat.label}</p>
                    <h3 className="text-4xl font-display font-bold text-foreground">
                      {loadingCourses ? "-" : stat.value}
                    </h3>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center shadow-lg text-white transform group-hover:rotate-12 transition-transform`}>
                    <stat.icon className="w-7 h-7" />
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <Card className="lg:col-span-2 p-6 lg:p-8">
          <h3 className="text-xl font-display font-bold mb-8">توزيع المواد حسب السنوات الدراسية</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14, fontFamily: 'Cairo' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Schedule */}
        <Card className="p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-display font-bold">محاضرات اليوم</h3>
            <Link href="/schedule">
              <span className="text-sm font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer">
                الجدول <ArrowLeft className="w-4 h-4" />
              </span>
            </Link>
          </div>
          
          <div className="space-y-4">
            {schedule.slice(0, 4).map((entry) => {
              const course = courses.find(c => c.id === entry.courseId);
              return (
                <div key={entry.id} className="flex gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {entry.startTime.split(':')[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground line-clamp-1">{course?.name || 'مادة غير معروفة'}</h4>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-accent"></span>
                      {entry.location || 'قاعة غير محددة'} • {entry.type === 'lecture' ? 'محاضرة' : entry.type === 'lab' ? 'مختبر' : 'تمارين'}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {schedule.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>لا توجد محاضرات مجدولة اليوم</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
