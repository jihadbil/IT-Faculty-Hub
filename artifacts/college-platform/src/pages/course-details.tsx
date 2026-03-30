import React, { useState } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useGetCourse, 
  useGetLectures, 
  useCreateLecture, 
  useDeleteLecture,
  useGetFiles,
  useUploadFile,
  useDeleteFile
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PlayCircle, FileText, Plus, Trash2, Clock, UploadCloud, File as FileIcon, ExternalLink } from "lucide-react";
import { Button, Card, Modal, Input, Badge } from "@/components/ui/shared";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { formatBytes } from "@/lib/utils";

const lectureSchema = z.object({
  title: z.string().min(2, "مطلوب"),
  description: z.string().optional(),
  lectureNumber: z.coerce.number().min(1),
  duration: z.coerce.number().optional(),
});

type LectureFormValues = z.infer<typeof lectureSchema>;

export default function CourseDetails() {
  const [, params] = useRoute("/courses/:id");
  const courseId = params?.id ? parseInt(params.id) : 0;
  
  const queryClient = useQueryClient();
  const { data: course, isLoading: loadingCourse } = useGetCourse(courseId);
  const { data: lectures = [], isLoading: loadingLectures } = useGetLectures({ courseId });
  const { data: files = [], isLoading: loadingFiles } = useGetFiles({ courseId });
  
  const createLecture = useCreateLecture();
  const deleteLecture = useDeleteLecture();
  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();

  const [activeTab, setActiveTab] = useState<'lectures' | 'files'>('lectures');
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { register: regLecture, handleSubmit: submitLecture, reset: resetLecture } = useForm<LectureFormValues>({
    resolver: zodResolver(lectureSchema),
    defaultValues: { lectureNumber: (lectures.length || 0) + 1 }
  });

  const onAddLecture = (data: LectureFormValues) => {
    createLecture.mutate({ data: { ...data, courseId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/lectures"] });
        setIsAddLectureOpen(false);
        resetLecture({ lectureNumber: lectures.length + 2 });
      }
    });
  };

  const [fileState, setFileState] = useState<{ file: File | null, title: string, type: 'pdf' | 'video', lectureId?: number }>({
    file: null, title: '', type: 'pdf'
  });

  const onUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileState.file || !fileState.title) return;
    
    uploadFile.mutate({ 
      data: {
        file: fileState.file as unknown as Blob,
        title: fileState.title,
        type: fileState.type,
        courseId,
        lectureId: fileState.lectureId || undefined
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/files"] });
        setIsUploadOpen(false);
        setFileState({ file: null, title: '', type: 'pdf' });
      }
    });
  };

  if (loadingCourse) return <div className="p-12 text-center text-xl animate-pulse">جاري التحميل...</div>;
  if (!course) return <div className="p-12 text-center text-xl text-destructive">لم يتم العثور على المادة</div>;

  return (
    <div className="space-y-8">
      {/* Course Header */}
      <div 
        className="relative rounded-3xl overflow-hidden shadow-xl p-8 md:p-12 text-white"
        style={{ backgroundColor: course.color || '#1e40af' }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30 mb-4 font-mono">
              {course.code}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">{course.name}</h1>
            <p className="text-white/80 max-w-2xl text-lg">{course.description || "لا يوجد وصف"}</p>
          </div>
          <div className="flex gap-4 text-center">
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 min-w-[100px]">
              <div className="text-3xl font-bold mb-1">{lectures.length}</div>
              <div className="text-white/70 text-sm">محاضرة</div>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 min-w-[100px]">
              <div className="text-3xl font-bold mb-1">{files.length}</div>
              <div className="text-white/70 text-sm">ملف</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('lectures')}
          className={`pb-4 px-6 text-lg font-bold transition-all border-b-4 ${activeTab === 'lectures' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          المحاضرات
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`pb-4 px-6 text-lg font-bold transition-all border-b-4 ${activeTab === 'files' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          ملفات المادة
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'lectures' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={() => setIsAddLectureOpen(true)} className="gap-2">
                  <Plus className="w-5 h-5" /> إضافة محاضرة
                </Button>
              </div>
              
              {lectures.length === 0 ? (
                <Card className="p-16 text-center border-dashed bg-transparent">
                  <PlayCircle className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-bold mb-2">لا توجد محاضرات</h3>
                  <p className="text-muted-foreground">انقر على إضافة محاضرة للبدء.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lectures.map((lecture) => (
                    <Card key={lecture.id} className="p-6 flex flex-col group hover:border-primary/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-xl">
                          {lecture.lectureNumber}
                        </div>
                        <button 
                          onClick={() => {
                            if(confirm('حذف المحاضرة؟')) deleteLecture.mutate({ id: lecture.id }, {
                              onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/lectures"] })
                            });
                          }}
                          className="text-muted-foreground hover:text-destructive p-2 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{lecture.title}</h3>
                      <p className="text-muted-foreground text-sm flex-1">{lecture.description || 'لا يوجد وصف'}</p>
                      
                      {lecture.duration && (
                        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-accent">
                          <Clock className="w-4 h-4" /> {lecture.duration} دقيقة
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={() => setIsUploadOpen(true)} className="gap-2 bg-secondary hover:bg-secondary/90 shadow-secondary/20">
                  <UploadCloud className="w-5 h-5" /> رفع ملف
                </Button>
              </div>
              
              {files.length === 0 ? (
                <Card className="p-16 text-center border-dashed bg-transparent">
                  <FileIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-bold mb-2">لا توجد ملفات</h3>
                  <p className="text-muted-foreground">قم برفع مذكرات، كتب، أو فيديوهات تخص المادة.</p>
                </Card>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                      <tr>
                        <th className="p-4">النوع</th>
                        <th className="p-4">اسم الملف</th>
                        <th className="p-4">المحاضرة المرتبطة</th>
                        <th className="p-4">الحجم</th>
                        <th className="p-4">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {files.map((file) => (
                        <tr key={file.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            {file.type === 'pdf' ? (
                              <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                                <PlayCircle className="w-5 h-5" />
                              </div>
                            )}
                          </td>
                          <td className="p-4 font-bold text-foreground">{file.title}</td>
                          <td className="p-4 text-muted-foreground">
                            {file.lectureId ? lectures.find(l => l.id === file.lectureId)?.title : 'عام'}
                          </td>
                          <td className="p-4 text-muted-foreground" dir="ltr">{formatBytes(file.size)}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <a href={file.url} target="_blank" rel="noreferrer" className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button 
                                onClick={() => {
                                  if(confirm('حذف الملف؟')) deleteFile.mutate({ id: file.id }, {
                                    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/files"] })
                                  });
                                }}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <Modal isOpen={isAddLectureOpen} onClose={() => setIsAddLectureOpen(false)} title="إضافة محاضرة جديدة">
        <form onSubmit={submitLecture(onAddLecture)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">عنوان المحاضرة</label>
            <Input {...regLecture("title")} placeholder="مثال: مقدمة في الخوارزميات" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">وصف مختصر</label>
            <Input {...regLecture("description")} placeholder="عن ماذا تتحدث المحاضرة..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">رقم المحاضرة</label>
              <Input type="number" {...regLecture("lectureNumber")} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">المدة (دقائق)</label>
              <Input type="number" {...regLecture("duration")} placeholder="60" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsAddLectureOpen(false)}>إلغاء</Button>
            <Button type="submit" isLoading={createLecture.isPending}>حفظ المحاضرة</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="رفع ملف جديد">
        <form onSubmit={onUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">عنوان الملف</label>
            <Input 
              required 
              value={fileState.title} 
              onChange={e => setFileState(prev => ({...prev, title: e.target.value}))} 
              placeholder="مثال: مذكرة الفصل الأول" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">نوع الملف</label>
              <select 
                className="flex h-12 w-full rounded-xl border-2 border-muted bg-white px-4 py-2 text-sm outline-none focus:border-primary"
                value={fileState.type}
                onChange={e => setFileState(prev => ({...prev, type: e.target.value as 'pdf'|'video'}))}
              >
                <option value="pdf">مستند (PDF)</option>
                <option value="video">مقطع فيديو</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">ربط بمحاضرة (اختياري)</label>
              <select 
                className="flex h-12 w-full rounded-xl border-2 border-muted bg-white px-4 py-2 text-sm outline-none focus:border-primary"
                value={fileState.lectureId || ""}
                onChange={e => setFileState(prev => ({...prev, lectureId: e.target.value ? parseInt(e.target.value) : undefined}))}
              >
                <option value="">-- عام للمادة --</option>
                {lectures.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">الملف</label>
            <div className="border-2 border-dashed border-muted rounded-2xl p-8 text-center relative hover:bg-muted/30 transition-colors">
              <input 
                type="file" 
                required 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept={fileState.type === 'pdf' ? '.pdf' : 'video/*'}
                onChange={e => {
                  if(e.target.files?.length) {
                    setFileState(prev => ({...prev, file: e.target.files![0]}));
                  }
                }}
              />
              <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="font-bold text-primary">
                {fileState.file ? fileState.file.name : "انقر لاختيار الملف أو اسحب وأفلت هنا"}
              </p>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsUploadOpen(false)}>إلغاء</Button>
            <Button type="submit" isLoading={uploadFile.isPending} className="bg-secondary">بدء الرفع</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
