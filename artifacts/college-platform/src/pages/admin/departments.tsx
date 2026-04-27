import { useMemo } from "react";
import { Building2, Loader2, AlertCircle } from "lucide-react";
import { Card, Badge } from "@/components/ui/shared";
import { ApiNotice } from "@/components/api-notice";
import { useAllCourses } from "@/lib/queries";

export default function AdminDepartments() {
  const { data: courses = [], isLoading, error } = useAllCourses();

  const departments = useMemo(() => {
    const map = new Map<string, { name: string; count: number; teachers: Set<string> }>();
    for (const c of courses) {
      const d = c.department || "غير محدد";
      if (!map.has(d)) map.set(d, { name: d, count: 0, teachers: new Set() });
      const entry = map.get(d)!;
      entry.count += 1;
      if (c.professorName) entry.teachers.add(c.professorName);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [courses]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50">
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Building2 className="w-8 h-8 text-purple-700" />
          الأقسام
        </h1>
        <p className="text-muted-foreground mt-1">الأقسام مستخرجة من حقل القسم في كل مادة</p>
      </div>

      <ApiNotice
        title="إدارة الأقسام تحتاج نقاط نهاية CRUD"
        description="الـ API الحالي يخزّن القسم كنص داخل كل مادة ولا يدعم إنشاء/تعديل/حذف الأقسام بشكل مستقل. الجدول أدناه مستخرج من المواد الموجودة."
        endpoints={[
          "GET /api/departments",
          "POST /api/departments",
          "PUT /api/departments/{id}",
          "DELETE /api/departments/{id}",
        ]}
      />

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive break-words">{(error as Error).message}</p>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-700" /></div>
      ) : departments.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">لا توجد أقسام مكتشفة من المواد.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <Card key={d.name} className="p-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-purple-700 mb-3">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground break-words">{d.name}</h3>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Badge variant="default">{d.teachers.size} أستاذ</Badge>
                <Badge variant="outline">{d.count} مادة</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
