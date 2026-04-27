import { ApiNotice } from "@/components/api-notice";

export default function StudentFiles() {
  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border">
        <h1 className="text-3xl font-display font-bold text-foreground">المكتبة</h1>
        <p className="text-muted-foreground mt-1">عرض موحّد لجميع المصادر التعليمية</p>
      </div>

      <ApiNotice
        title="المكتبة الموحّدة تحتاج إلى نقاط نهاية إضافية"
        description="حالياً يمكنك مشاهدة المحاضرات المرئية لكل مادة على حدة من صفحة المادة. لتجميع المصادر في مكتبة واحدة قابلة للتصفية يلزم إضافة نقاط نهاية للملفات في الـ API."
        endpoints={[
          "GET /api/files",
          "GET /api/courses/{courseId}/files",
          "GET /api/files/{id}/download",
        ]}
      />
    </div>
  );
}
