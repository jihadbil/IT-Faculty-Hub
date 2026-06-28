import React, { useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { Button, Card, Input, Badge } from "@/components/ui/shared";
import { useAuth } from "@/lib/auth";
import { examsApi, type CreateExamQuestionDto, type CreateExamOptionDto, type Uuid } from "@/lib/external-api";
import { cn } from "@/lib/utils";

const QType = { MCQ: 1, TrueFalse: 2, ShortAnswer: 3 } as const;
type QTypeValue = 1 | 2 | 3;

const Q_LABELS: Record<QTypeValue, string> = {
  1: "اختيار من متعدد",
  2: "صح أو خطأ",
  3: "إجابة قصيرة",
};

interface OptionDraft {
  _id: string;
  optionText: string;
  isCorrect: boolean;
}

interface QuestionDraft {
  _id: string;
  questionText: string;
  questionType: QTypeValue;
  points: number;
  options: OptionDraft[];
}

function newId() {
  return Math.random().toString(36).slice(2);
}

function defaultOptions(type: QTypeValue): OptionDraft[] {
  if (type === QType.TrueFalse) {
    return [
      { _id: newId(), optionText: "صح", isCorrect: true },
      { _id: newId(), optionText: "خطأ", isCorrect: false },
    ];
  }
  if (type === QType.MCQ) {
    return [
      { _id: newId(), optionText: "", isCorrect: false },
      { _id: newId(), optionText: "", isCorrect: false },
    ];
  }
  return [];
}

function newQuestion(): QuestionDraft {
  return {
    _id: newId(),
    questionText: "",
    questionType: QType.MCQ,
    points: 1,
    options: defaultOptions(QType.MCQ),
  };
}

export default function ExamBuilder() {
  const { user } = useAuth();
  const [, paramsTeacher] = useRoute("/courses/:courseId/exams/new");
  const [, paramsAdmin] = useRoute("/admin/courses/:courseId/exams/new");
  const courseId: Uuid | undefined = paramsTeacher?.courseId ?? paramsAdmin?.courseId;
  const isAdmin = user?.role === "admin";
  const backPath = isAdmin ? `/admin/courses/${courseId}` : `/courses/${courseId}`;

  const [, navigate] = useLocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passScore, setPassScore] = useState(50);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [showResult, setShowResult] = useState(true);
  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion()]);
  const [expandedQ, setExpandedQ] = useState<string | null>(questions[0]._id);
  const [serverError, setServerError] = useState("");

  const create = useMutation({
    mutationFn: () => {
      const payload: CreateExamQuestionDto[] = questions.map((q, qi) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        points: q.points,
        questionOrder: qi + 1,
        options: q.options.map((o, oi) => ({
          optionText: o.optionText,
          isCorrect: o.isCorrect,
          optionOrder: oi + 1,
        })),
      }));
      return examsApi.create(courseId!, {
        courseId: courseId!,
        title,
        description: description || null,
        durationMinutes,
        passScore,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        maxAttempts,
        shuffleQuestions,
        shuffleOptions,
        showResultAfterSubmit: showResult,
        questions: payload,
      });
    },
    onSuccess: (exam) => {
      navigate(isAdmin ? `/admin/courses/${courseId}/exams/${exam.id}` : `/courses/${courseId}/exams/${exam.id}`);
    },
    onError: (e: Error) => setServerError(e.message),
  });

  const addQuestion = () => {
    const q = newQuestion();
    setQuestions((prev) => [...prev, q]);
    setExpandedQ(q._id);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q._id !== id));
    if (expandedQ === id) setExpandedQ(null);
  };

  const updateQuestion = (id: string, patch: Partial<QuestionDraft>) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q._id !== id) return q;
        const updated = { ...q, ...patch };
        if (patch.questionType !== undefined && patch.questionType !== q.questionType) {
          updated.options = defaultOptions(patch.questionType);
        }
        return updated;
      }),
    );
  };

  const addOption = (qid: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q._id === qid ? { ...q, options: [...q.options, { _id: newId(), optionText: "", isCorrect: false }] } : q,
      ),
    );
  };

  const removeOption = (qid: string, oid: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q._id === qid ? { ...q, options: q.options.filter((o) => o._id !== oid) } : q,
      ),
    );
  };

  const updateOption = (qid: string, oid: string, patch: Partial<OptionDraft>) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q._id === qid
          ? { ...q, options: q.options.map((o) => (o._id === oid ? { ...o, ...patch } : o)) }
          : q,
      ),
    );
  };

  const setCorrectOption = (qid: string, oid: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q._id === qid
          ? { ...q, options: q.options.map((o) => ({ ...o, isCorrect: o._id === oid })) }
          : q,
      ),
    );
  };

  const totalScore = questions.reduce((s, q) => s + q.points, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    for (const q of questions) {
      if (!q.questionText.trim()) {
        setServerError("يرجى إدخال نص لجميع الأسئلة.");
        return;
      }
      if (q.questionType !== QType.ShortAnswer) {
        if (!q.options.some((o) => o.isCorrect)) {
          setServerError(`السؤال "${q.questionText.slice(0, 30)}..." بدون إجابة صحيحة محددة.`);
          return;
        }
        if (q.options.some((o) => !o.optionText.trim())) {
          setServerError(`يرجى ملء نص جميع الخيارات.`);
          return;
        }
      }
    }
    create.mutate();
  };

  if (!courseId) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <Link href={backPath}>
        <span className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary cursor-pointer text-sm font-bold transition-colors">
          <ArrowRight className="w-4 h-4" />
          العودة إلى المادة
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">إنشاء امتحان جديد</h1>
          <p className="text-muted-foreground text-sm mt-0.5">أضف الإعدادات والأسئلة ثم انشر الامتحان</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-5">
          <h2 className="text-lg font-bold border-b pb-3">إعدادات الامتحان</h2>
          <div>
            <label className="block text-sm font-bold mb-2">عنوان الامتحان *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="مثال: امتحان الفصل الأول" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">وصف (اختياري)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="تعليمات أو معلومات إضافية للطلاب"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">المدة (دقيقة) *</label>
              <Input type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">درجة النجاح *</label>
              <Input type="number" min={0} value={passScore} onChange={(e) => setPassScore(Number(e.target.value))} required />
              <p className="text-xs text-muted-foreground mt-1">من {totalScore} درجة</p>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">عدد المحاولات</label>
              <Input type="number" min={1} value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} />
            </div>
            <div className="flex flex-col gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} className="rounded" />
                <span className="text-sm">ترتيب عشوائي للأسئلة</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={showResult} onChange={(e) => setShowResult(e.target.checked)} className="rounded" />
                <span className="text-sm">عرض النتيجة فور التسليم</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">تاريخ البدء *</label>
              <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">تاريخ الانتهاء *</label>
              <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              الأسئلة
              <Badge variant="outline" className="mr-2">{questions.length} سؤال — {totalScore} درجة</Badge>
            </h2>
            <Button type="button" size="sm" variant="outline" onClick={addQuestion} className="gap-1">
              <Plus className="w-4 h-4" /> إضافة سؤال
            </Button>
          </div>

          <AnimatePresence initial={false}>
            {questions.map((q, idx) => (
              <motion.div
                key={q._id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.18 }}
              >
                <Card className={cn("overflow-hidden", expandedQ === q._id && "ring-2 ring-primary/20")}>
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedQ(expandedQ === q._id ? null : q._id)}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {q.questionText || <span className="text-muted-foreground italic">نص السؤال...</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {Q_LABELS[q.questionType]} — {q.points} درجة
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {q.options.some((o) => o.isCorrect) || q.questionType === QType.ShortAnswer ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeQuestion(q._id); }}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {expandedQ === q._id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {expandedQ === q._id && (
                    <div className="border-t border-border p-5 space-y-4 bg-muted/10">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold mb-2">نص السؤال *</label>
                          <textarea
                            value={q.questionText}
                            onChange={(e) => updateQuestion(q._id, { questionText: e.target.value })}
                            rows={2}
                            className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                            placeholder="اكتب نص السؤال هنا..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-bold mb-2">النوع</label>
                            <select
                              value={q.questionType}
                              onChange={(e) => updateQuestion(q._id, { questionType: Number(e.target.value) as QTypeValue })}
                              className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 h-10"
                            >
                              {Object.entries(Q_LABELS).map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold mb-2">الدرجة</label>
                            <Input
                              type="number"
                              min={0.5}
                              step={0.5}
                              value={q.points}
                              onChange={(e) => updateQuestion(q._id, { points: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                      </div>

                      {q.questionType !== QType.ShortAnswer && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-bold">
                              الخيارات
                              {q.questionType === QType.MCQ && (
                                <span className="text-xs font-normal text-muted-foreground mr-2">(انقر على الخيار الصحيح لتحديده)</span>
                              )}
                            </label>
                            {q.questionType === QType.MCQ && (
                              <Button type="button" size="sm" variant="ghost" onClick={() => addOption(q._id)} className="gap-1 h-7 text-xs">
                                <Plus className="w-3 h-3" /> خيار
                              </Button>
                            )}
                          </div>
                          {q.options.map((opt, oi) => (
                            <div key={opt._id} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setCorrectOption(q._id, opt._id)}
                                className={cn(
                                  "w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all",
                                  opt.isCorrect
                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                    : "border-border hover:border-primary",
                                )}
                                title="تحديد كإجابة صحيحة"
                              >
                                {opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                              <Input
                                value={opt.optionText}
                                onChange={(e) => updateOption(q._id, opt._id, { optionText: e.target.value })}
                                disabled={q.questionType === QType.TrueFalse}
                                placeholder={`الخيار ${oi + 1}`}
                                className="flex-1 h-9"
                              />
                              {q.questionType === QType.MCQ && q.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(q._id, opt._id)}
                                  className="p-1 text-destructive hover:bg-destructive/10 rounded shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.questionType === QType.ShortAnswer && (
                        <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800">
                          سيكتب الطالب إجابة نصية حرة. يمكنك مراجعتها يدوياً لاحقاً.
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {questions.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-border rounded-2xl">
              <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">لا توجد أسئلة بعد</p>
              <Button type="button" size="sm" className="mt-3 gap-1" onClick={addQuestion}>
                <Plus className="w-4 h-4" /> إضافة أول سؤال
              </Button>
            </div>
          )}
        </div>

        {serverError && (
          <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{serverError}</p>
          </Card>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Link href={backPath}>
            <Button type="button" variant="ghost">إلغاء</Button>
          </Link>
          <Button type="submit" isLoading={create.isPending} className="gap-2 min-w-[140px]">
            <ClipboardList className="w-4 h-4" />
            إنشاء الامتحان
          </Button>
        </div>
      </form>
    </div>
  );
}
