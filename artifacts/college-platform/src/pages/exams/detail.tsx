import React, { useState } from "react";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ClipboardList,
  Clock,
  Target,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit2,
  Globe,
  EyeOff,
  Trash2,
  ChevronDown,
  ChevronUp,
  BarChart2,
} from "lucide-react";
import { Button, Card, Input, Badge, Modal } from "@/components/ui/shared";
import { useAuth } from "@/lib/auth";
import { useExam, useExamAttempts } from "@/lib/queries";
import { examsApi, asNumber, normalizeQuestionType, type UpdateExamDto, type Uuid } from "@/lib/external-api";
import { cn } from "@/lib/utils";

const Q_TYPE_LABEL: Record<string | number, string> = {
  1: "اختيار من متعدد",
  2: "صح أو خطأ",
  3: "إجابة قصيرة",
};

export default function ExamDetail() {
  const { user } = useAuth();
  const [, paramsTeacher] = useRoute("/courses/:courseId/exams/:examId");
  const [, paramsAdmin] = useRoute("/admin/courses/:courseId/exams/:examId");
  const courseId: Uuid | undefined = paramsTeacher?.courseId ?? paramsAdmin?.courseId;
  const examIdRaw = paramsTeacher?.examId ?? paramsAdmin?.examId;
  const examId = examIdRaw ? Number(examIdRaw) : null;
  const isAdmin = user?.role === "admin";
  const backPath = isAdmin ? `/admin/courses/${courseId}` : `/courses/${courseId}`;

  const qc = useQueryClient();
  const { data: exam, isLoading, error } = useExam(courseId, examId);
  const { data: attempts = [], isLoading: loadingAttempts } = useExamAttempts(courseId, examId);

  const [editOpen, setEditOpen] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const publish = useMutation({
    mutationFn: () => examsApi.publish(courseId!, examId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["external", "course", courseId, "exam", examId] }),
  });

  const remove = useMutation({
    mutationFn: () => examsApi.remove(courseId!, examId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["external", "course", courseId, "exams"] });
      window.history.back();
    },
  });

  if (isLoading) return <div className="h-96 bg-muted/30 rounded-3xl animate-pulse" />;
  if (error || !exam)
    return (
      <Card className="p-6 border-destructive/40 bg-destructive/5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm text-destructive break-words">{error ? (error as Error).message : "الامتحان غير موجود"}</p>
      </Card>
    );

  const now = new Date();
  const start = new Date(exam.startDate);
  const end = new Date(exam.endDate);
  const isActive = now >= start && now <= end;
  const isPast = now > end;

  const passedAttempts = attempts.filter((a) => a.isPassed).length;
  const submittedAttempts = attempts.filter((a) => a.status !== "InProgress");

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <Link href={backPath}>
        <span className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary cursor-pointer text-sm font-bold transition-colors">
          <ArrowRight className="w-4 h-4" />
          العودة إلى المادة
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden p-8 text-white"
        style={{ background: "linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)" }}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex flex-wrap gap-2 mb-4">
            {exam.isPublished ? (
              <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30">● منشور</Badge>
            ) : (
              <Badge className="bg-white/10 text-white/70 border-white/20">مسودة</Badge>
            )}
            {isActive && <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30">● جارٍ الآن</Badge>}
            {isPast && <Badge className="bg-white/10 text-white/70 border-white/20">انتهى</Badge>}
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">{exam.title}</h1>
          {exam.description && <p className="text-white/70 mb-4">{exam.description}</p>}
          <div className="flex flex-wrap gap-6 text-sm text-white/80">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{asNumber(exam.durationMinutes)} دقيقة</span>
            <span className="flex items-center gap-1.5"><Target className="w-4 h-4" />النجاح: {asNumber(exam.passScore)} / {asNumber(exam.maxScore)}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span dir="ltr">{new Date(exam.startDate).toLocaleDateString("ar")} – {new Date(exam.endDate).toLocaleDateString("ar")}</span></span>
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{asNumber(exam.maxAttempts)} محاولة مسموح</span>
          </div>
        </div>
        <div className="absolute bottom-4 left-6 right-6 flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={() => setEditOpen(true)}
          >
            <Edit2 className="w-4 h-4 ml-1" /> تعديل
          </Button>
          <Button
            size="sm"
            variant="outline"
            isLoading={publish.isPending}
            className={cn(
              "border-white/20 text-white hover:bg-white/20",
              exam.isPublished ? "bg-white/10" : "bg-emerald-500/20",
            )}
            onClick={() => publish.mutate()}
          >
            {exam.isPublished ? (
              <><EyeOff className="w-4 h-4 ml-1" /> إلغاء النشر</>
            ) : (
              <><Globe className="w-4 h-4 ml-1" /> نشر</>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-red-500/20 border-red-400/30 text-white hover:bg-red-500/30"
            onClick={() => { if (confirm("حذف الامتحان؟")) remove.mutate(); }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 text-center">
          <div className="text-3xl font-bold text-primary">{exam.questions?.length ?? 0}</div>
          <div className="text-sm text-muted-foreground mt-1">سؤال</div>
        </Card>
        <Card className="p-5 text-center">
          <div className="text-3xl font-bold text-primary">{submittedAttempts.length}</div>
          <div className="text-sm text-muted-foreground mt-1">تسليم</div>
        </Card>
        <Card className="p-5 text-center">
          <div className="text-3xl font-bold text-emerald-600">{passedAttempts}</div>
          <div className="text-sm text-muted-foreground mt-1">نجاح</div>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" /> الأسئلة ({exam.questions?.length ?? 0})
        </h2>
        {!exam.questions || exam.questions.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">لا توجد أسئلة</Card>
        ) : (
          <div className="space-y-2">
            {exam.questions.map((q, idx) => (
              <Card key={q.id} className="overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm break-words">{q.questionText}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {Q_TYPE_LABEL[normalizeQuestionType(q.questionType)] ?? q.questionType} — {asNumber(q.points)} درجة
                    </p>
                  </div>
                  {expandedQ === q.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </div>
                {expandedQ === q.id && q.options && q.options.length > 0 && (
                  <div className="border-t border-border p-4 space-y-2 bg-muted/10">
                    {q.options.map((opt) => (
                      <div key={opt.id} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm", opt.isCorrect && "bg-emerald-50 border border-emerald-200")}>
                        {opt.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
                        )}
                        <span className={opt.isCorrect ? "font-bold text-emerald-700" : ""}>{opt.optionText}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {attempts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" /> محاولات الطلاب ({submittedAttempts.length})
          </h2>
          <div className="space-y-2">
            {attempts.filter((a) => a.status !== "InProgress").map((attempt) => (
              <Card key={attempt.id} className="p-4 flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", attempt.isPassed ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
                  {attempt.isPassed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{attempt.studentName}</p>
                  <p className="text-xs text-muted-foreground">
                    محاولة #{asNumber(attempt.attemptNumber)} •{" "}
                    {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString("ar") : "—"}
                  </p>
                </div>
                <div className="text-left shrink-0">
                  <p className="font-bold text-sm" dir="ltr">
                    {asNumber(attempt.score)} / {asNumber(attempt.maxScore)}
                  </p>
                  <Badge variant={attempt.isPassed ? "success" : "warning"} className="text-xs">
                    {attempt.isPassed ? "ناجح" : "راسب"}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {editOpen && (
        <EditExamModal
          exam={exam}
          courseId={courseId!}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["external", "course", courseId, "exam", examId] });
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}

function EditExamModal({
  exam,
  courseId,
  onClose,
  onSaved,
}: {
  exam: { id: number; title: string; description?: string | null; durationMinutes: number | string; passScore: number | string; startDate: string; endDate: string; maxAttempts: number | string };
  courseId: Uuid;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(exam.title);
  const [description, setDescription] = useState(exam.description ?? "");
  const [duration, setDuration] = useState(String(asNumber(exam.durationMinutes)));
  const [pass, setPass] = useState(String(asNumber(exam.passScore)));
  const [start, setStart] = useState(() => new Date(exam.startDate).toISOString().slice(0, 16));
  const [end, setEnd] = useState(() => new Date(exam.endDate).toISOString().slice(0, 16));
  const [maxAttempts, setMaxAttempts] = useState(String(asNumber(exam.maxAttempts)));

  const save = useMutation({
    mutationFn: () => {
      const body: UpdateExamDto = {
        title: title || null,
        description: description || null,
        durationMinutes: Number(duration),
        passScore: Number(pass),
        startDate: new Date(start).toISOString(),
        endDate: new Date(end).toISOString(),
        maxAttempts: Number(maxAttempts),
      };
      return examsApi.update(courseId, exam.id, body);
    },
    onSuccess: onSaved,
  });

  return (
    <Modal isOpen onClose={onClose} title="تعديل إعدادات الامتحان">
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">العنوان</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">الوصف</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-bold mb-2">المدة (دقيقة)</label>
            <Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">درجة النجاح</label>
            <Input type="number" min={0} value={pass} onChange={(e) => setPass(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">المحاولات</label>
            <Input type="number" min={1} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold mb-2">يبدأ في</label>
            <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">ينتهي في</label>
            <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
          </div>
        </div>
        {save.isError && <p className="text-sm text-destructive">{(save.error as Error).message}</p>}
        <div className="pt-3 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button type="submit" isLoading={save.isPending}>حفظ التعديلات</Button>
        </div>
      </form>
    </Modal>
  );
}
