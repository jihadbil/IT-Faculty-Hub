import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText, Upload, Trash2, Download, Search, Loader2,
  AlertCircle, X, FolderOpen, BookOpen,
} from "lucide-react";
import { Card, Button, Badge } from "@/components/ui/shared";
import { useFiles, useCoursesForRole } from "@/lib/queries";
import { resolveAssetUrl, forceDownloadFile } from "@/lib/utils";
import {
  filesApi,
  FILE_TYPE_LABEL_AR,
  type FilesQuery,
  type Uuid,
} from "@/lib/external-api";

const FILE_TYPES = [1, 2, 3, 4, 5, 6];

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

interface UploadDialogProps {
  courses: { id: Uuid; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

function UploadDialog({ courses, onClose, onSuccess }: UploadDialogProps) {
  const [courseId, setCourseId] = useState<Uuid>(courses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileType, setFileType] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: async () => {
      if (!file || !courseId || !title.trim()) throw new Error("أكمل الحقول المطلوبة");
      const fd = new FormData();
      fd.append("CourseId", courseId);
      fd.append("Title", title.trim());
      fd.append("Description", description.trim());
      fd.append("FileType", String(fileType));
      fd.append("File", file);
      return filesApi.uploadToCourse(courseId, fd);
    },
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold">رفع ملف جديد</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-bold mb-1">المادة <span className="text-destructive">*</span></label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value as Uuid)}
              className="w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">العنوان <span className="text-destructive">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان الملف"
              className="w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">الوصف</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="وصف اختياري"
              className="w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">نوع الملف</label>
            <select
              value={fileType}
              onChange={(e) => setFileType(Number(e.target.value))}
              className="w-full border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {FILE_TYPES.map((t) => (
                <option key={t} value={t}>{FILE_TYPE_LABEL_AR[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">الملف <span className="text-destructive">*</span></label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-purple-400 transition-colors"
            >
              {file ? (
                <p className="text-sm font-bold text-purple-700">{file.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">انقر لاختيار ملف</p>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button isLoading={upload.isPending} onClick={() => upload.mutate()}>
            <Upload className="w-4 h-4" />
            رفع الملف
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function Files() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [filterCourse, setFilterCourse] = useState<Uuid | "">("");
  const [showUpload, setShowUpload] = useState(false);

  const query: FilesQuery = {
    search: search || undefined,
    category: category || undefined,
    courseId: filterCourse || undefined,
    pageSize: 100,
  };

  const { data, isLoading, error } = useFiles(query);
  const { data: courses = [] } = useCoursesForRole();

  const files = data?.items ?? [];

  const deleteFile = useMutation({
    mutationFn: (id: number) => filesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["external", "files"] }),
  });

  const categories = Array.from(new Set(files.map((f) => f.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-700" />
            مكتبة الملفات
          </h1>
          <p className="text-muted-foreground mt-1">جميع الملفات المرفوعة على موادّك</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="gap-2">
          <Upload className="w-4 h-4" />
          رفع ملف
        </Button>
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
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value as Uuid | "")}
            className="border border-border rounded-xl p-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">كل المواد</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.courseName}</option>
            ))}
          </select>
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
          <p className="text-muted-foreground">لا توجد ملفات. ارفع ملفاً جديداً من الزر أعلاه.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((f) => (
            <Card key={f.id} className="p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{mimeIcon(f.mimeType)}</span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground truncate">{f.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{f.fileName}</p>
                  </div>
                </div>
                <button
                  onClick={() => { if (confirm(`حذف "${f.title}"؟`)) deleteFile.mutate(f.id); }}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  disabled={deleteFile.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
      )}

      {showUpload && courses.length > 0 && (
        <UploadDialog
          courses={courses.map((c) => ({ id: c.id, name: c.courseName }))}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["external", "files"] });
          }}
        />
      )}
    </div>
  );
}
