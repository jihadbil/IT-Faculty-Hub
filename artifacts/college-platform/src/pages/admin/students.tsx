import { useQuery } from "@tanstack/react-query";
import { Users, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/shared";
import { api } from "@/lib/api";

interface Student {
  id: number;
  username: string;
  fullName: string;
  createdAt: string | null;
}

export default function AdminStudents() {
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/admin/students"],
    queryFn: () => api("/api/admin/students"),
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50">
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Users className="w-8 h-8 text-purple-700" />
          الطلاب
        </h1>
        <p className="text-muted-foreground mt-1">قائمة الطلاب المسجلين في المنصة</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-700" /></div>
      ) : students.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">لا يوجد طلاب مسجلون بعد.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-muted/50">
              <tr className="text-sm font-bold text-foreground">
                <th className="p-4">الاسم الكامل</th>
                <th className="p-4">اسم المستخدم</th>
                <th className="p-4">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="p-4 font-bold">{s.fullName}</td>
                  <td className="p-4 font-mono text-sm" dir="ltr">{s.username}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString("ar") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
