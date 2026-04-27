import { ApiNotice } from "@/components/api-notice";

export default function Files() {
  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border">
        <h1 className="text-3xl font-display font-bold text-foreground">مكتبة الملفات</h1>
        <p className="text-muted-foreground mt-1">عرض موحّد لجميع الملفات والمحاضرات المرئية</p>
      </div>

      <ApiNotice
        title="مكتبة الملفات تحتاج إلى نقاط نهاية إضافية"
        description="الـ EducationalPlatformAPI الحالي يدعم فقط محاضرات الفيديو لكل مادة على حدة. لعرض مكتبة موحّدة لكل ملفات وملاحظات الكلية يلزم إضافة نقاط نهاية للملفات وللتجميع المتعدد."
        endpoints={[
          "GET /api/files",
          "GET /api/files/{id}/download",
          "POST /api/courses/{courseId}/files",
          "DELETE /api/courses/{courseId}/files/{fileId}",
        ]}
      />
    </div>
  );
}
