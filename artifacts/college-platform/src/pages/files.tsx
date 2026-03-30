import React from "react";
import { motion } from "framer-motion";
import { useGetFiles, useDeleteFile, useGetCourses } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, PlayCircle, ExternalLink, Trash2, Search, Filter } from "lucide-react";
import { Input, Badge } from "@/components/ui/shared";
import { formatBytes } from "@/lib/utils";

export default function Files() {
  const queryClient = useQueryClient();
  const { data: files = [], isLoading } = useGetFiles();
  const { data: courses = [] } = useGetCourses();
  const deleteFile = useDeleteFile();
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | "pdf" | "video">("all");

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || f.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">مكتبة الملفات</h1>
        <p className="text-muted-foreground mt-1">تصفح جميع الملفات والمحاضرات المرئية المرفوعة على المنصة</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-border flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            className="pl-4 pr-12 bg-muted/30 border-transparent focus:bg-white" 
            placeholder="البحث في الملفات..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setTypeFilter("all")}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold transition-all ${typeFilter === 'all' ? 'bg-primary text-white shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            الكل
          </button>
          <button 
            onClick={() => setTypeFilter("pdf")}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${typeFilter === 'pdf' ? 'bg-rose-500 text-white shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button 
            onClick={() => setTypeFilter("video")}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${typeFilter === 'video' ? 'bg-indigo-500 text-white shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            <PlayCircle className="w-4 h-4" /> فيديو
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFiles.map((file, idx) => {
            const course = courses.find(c => c.id === file.courseId);
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-5 group flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${file.type === 'pdf' ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                    {file.type === 'pdf' ? <FileText className="w-7 h-7" /> : <PlayCircle className="w-7 h-7" />}
                  </div>
                  <div className="flex gap-1">
                    <a href={file.url} target="_blank" rel="noreferrer" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <button 
                      onClick={() => {
                        if(confirm('حذف الملف؟')) deleteFile.mutate({ id: file.id }, {
                          onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/files"] })
                        });
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-bold text-lg mb-1 text-foreground line-clamp-1" title={file.title}>{file.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1 mb-4" dir="ltr">{file.filename}</p>
                
                <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                  <Badge variant="outline" className="bg-muted/50 truncate max-w-[120px]">
                    {course?.name || 'عام'}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground" dir="ltr">{formatBytes(file.size)}</span>
                </div>
              </motion.div>
            )
          })}
          
          {filteredFiles.length === 0 && (
             <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-border">
               <Filter className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
               <h3 className="text-xl font-bold text-foreground mb-2">لا توجد ملفات مطابقة</h3>
               <p className="text-muted-foreground">جرب تغيير كلمات البحث أو الفلتر المستخدم.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
