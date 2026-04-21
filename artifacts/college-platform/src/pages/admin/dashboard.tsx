import { useQuery } from "@tanstack/react-query";
import { Building2, Users, BookOpen, FileVideo, GraduationCap, Presentation, Crown } from "lucide-react";
import { Card } from "@/components/ui/shared";
import { api } from "@/lib/api";

interface Stats {
  teachers: number;
  students: number;
  departments: number;
  courses: number;
  lectures: number;
  files: number;
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => api<Stats>("/api/admin/stats"),
  });

  const cards = [
    { label: "الأقسام", value: data?.departments, icon: Building2, color: "from-purple-600 to-purple-800" },
    { label: "الأساتذة", value: data?.teachers, icon: GraduationCap, color: "from-indigo-600 to-indigo-800" },
    { label: "الطلاب", value: data?.students, icon: Users, color: "from-emerald-600 to-emerald-800" },
    { label: "المواد", value: data?.courses, icon: BookOpen, color: "from-blue-600 to-blue-800" },
    { label: "المحاضرات", value: data?.lectures, icon: Presentation, color: "from-amber-600 to-amber-800" },
    { label: "الملفات", value: data?.files, icon: FileVideo, color: "from-rose-600 to-rose-800" },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-l from-purple-700 to-purple-900 text-white p-8 rounded-3xl shadow-xl flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
          <Crown className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">لوحة المدير العام</h1>
          <p className="text-white/80 mt-1">نظرة عامة على نشاط الكلية</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.label} className="p-6">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center mb-4`}>
              <c.icon className="w-6 h-6" />
            </div>
            <p className="text-sm text-muted-foreground font-bold">{c.label}</p>
            <p className="text-3xl font-display font-bold text-foreground mt-1">
              {isLoading ? "—" : c.value ?? 0}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
