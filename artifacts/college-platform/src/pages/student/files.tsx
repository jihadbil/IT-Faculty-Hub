import { useState } from "react";
import {
  FileText, Download, Search, Loader2,
  AlertCircle, FolderOpen, BookOpen,
} from "lucide-react";
import { Card, Badge } from "@/components/ui/shared";
import { useMyFiles, useMyEnrollments } from "@/lib/queries";
import { type FilesQuery, type Uuid, FILE_TYPE_LABEL_AR } from "@/lib/external-api";
import { resolveAssetUrl, forceDownloadFile } from "@/lib/utils";

function formatBytes(bytes: number | string): string {
  const n = typeof bytes === "string" ? Number(bytes) : bytes;
  if (!n || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeIcon(mime: string): string {
  if (mime.includes("pdf")) return "📄";
  if (mime.includes("image")) return "🖼";
  if (mime.includes("video")) return "🎬";
  if (mime.includes("audio")) return "🎵";
  if (mime.includes("zip") || mime.includes("compressed")) return "🗜";
  if (mime.includes("word") || mime.includes("document")) return "📝";
  if (mime.includes("sheet") || mime.includes("excel")) return "📊";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "📊";
  return "📁";
}

export default function StudentFiles() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [filterCourse, setFilterCourse] = useState<Uuid | "">("");

  const query: FilesQuery = {
    search: search || undefined,
    category: category || undefined,
    courseId: filterCourse || undefined,
    pageSize: 100,
  };

  const { data, isLoading, error } = useMyFiles(query);
  const { data: enrollments = [] } = useMyEnrollments();

  const files = data?.items ?? [];
  const categories = Array.from(new Set(files.map((f) => f.category).filter(Boolean)));

  const enrolledCourses = enrollments.map((e) => ({
    id: e.courseId,
    name: e.course?.courseName ?? e.courseId,
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50">
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <FileText className="w-8 h-8 text-purple-700" />
          المكتبة
        </h1>
        <p className="text-muted-foreground mt-1">جميع المصادر التعليمية لموادّك المسجّلة</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في الملفات…"
              className="w-full border border-border rounded-xl p-2.5 pr-9 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          {enrolledCourses.length > 0 && (
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value as Uuid | "")}
              className="border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">كل المواد</option>
              {enrolledCourses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          {categories.length > 0 && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">كل التصنيفات</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      </Card>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive break-words">{(error as Error).message}</p>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-700" /></div>
      ) : files.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">لا توجد ملفات في موادّك حتى الآن.</p>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{files.length} ملف</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((f) => (
              <Card key={f.id} className="p-5 flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">{mimeIcon(f.mimeType)}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-foreground truncate">{f.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{f.fileName}</p>
                  </div>
                </div>

                {f.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{f.description}</p>
                )}

                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    <BookOpen className="w-3 h-3 ms-1" />
                    {f.courseName}
                  </Badge>
                  {f.category && <Badge variant="default" className="text-xs">{FILE_TYPE_LABEL_AR[f.category] ?? f.category}</Badge>}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2">
                  <span>{formatBytes(f.fileSize)}</span>
                  <span>{Number(f.downloads)} تحميل</span>
                  <span>{new Date(f.uploadedAt).toLocaleDateString("ar")}</span>
                </div>

                <button
                  type="button"
                  onClick={() => forceDownloadFile(resolveAssetUrl(f.downloadUrl), f.fileName)}
                  className="flex items-center justify-center gap-2 text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl p-2 transition-colors font-bold w-full cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  تحميل
                </button>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
