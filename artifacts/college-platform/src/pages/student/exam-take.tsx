import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowLeft,
  ClipboardList,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  PlayCircle,
  RotateCcw,
  Trophy,
  Lock,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui/shared";
import { useExam, useMyExamAttempts } from "@/lib/queries";
import {
  examsApi,
  asNumber,
  type ExamAnswerItemDto,
  type ExamAttemptResponseDto,
  type Uuid,
} from "@/lib/external-api";
import { cn } from "@/lib/utils";

type Phase = "info" | "taking" | "result";

function formatTime(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function StudentExamTake() {
  const [, params] = useRoute("/student/courses/:courseId/exams/:examId");
  const courseId = params?.courseId as Uuid | undefined;
  const examId = params?.examId ? Number(params.examId) : null;

  const qc = useQueryClient();
  const { data: exam, isLoading, error } = useExam(courseId, examId);
  const { data: myAttempts = [], refetch: refetchAttempts } = useMyExamAttempts(courseId, examId);

  const [phase, setPhase] = useState<Phase>("info");
  const [currentAttempt, setCurrentAttempt] = useState<ExamAttemptResponseDto | null>(null);
  const [answers, setAnswers] = useState<Record<number, ExamAnswerItemDto>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitResult, setSubmitResult] = useState<ExamAttemptResponseDto | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAttempt = useMutation({
    mutationFn: () => examsApi.startAttempt(courseId!, examId!),
    onSuccess: (attempt) => {
      setCurrentAttempt(attempt);
      setAnswers({});
      setCurrentQ(0);
      setTimeLeft(asNumber(exam!.durationMinutes) * 60);
      setPhase("taking");
    },
  });

  const submitAttempt = useMutation({
    mutationFn: () =>
      examsApi.submitAttempt(courseId!, examId!, {
        attemptId: currentAttempt!.id,
        answers: Object.values(answers),
      }),
    onSuccess: (result) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setSubmitResult(result);
      setPhase("result");
      qc.invalidateQueries({ queryKey: ["external", "course", courseId, "exam", examId, "my-attempts"] });
      refetchAttempts();
    },
  });

  useEffect(() => {
    if (phase !== "taking" || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          submitAttempt.mutate();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, timeLeft > 0 && phase === "taking"]);

  const setAnswer = useCallback((questionId: number, patch: Partial<ExamAnswerItemDto>) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], questionId, ...patch },
    }));
  }, []);

  if (isLoading) return <div className="h-96 bg-muted/30 rounded-3xl animate-pulse" />;
  if (error || !exam)
    return (
      <Card className="p-6 border-destructive/40 bg-destructive/5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm text-destructive">{error ? (error as Error).message : "الامتحان غير موجود"}</p>
      </Card>
    );

  const now = new Date();
  const isActive = now >= new Date(exam.startDate) && now <= new Date(exam.endDate);
  const isPast = now > new Date(exam.endDate);
  const attemptsUsed = myAttempts.filter((a) => a.status !== "InProgress").length;
  const maxAttempts = asNumber(exam.maxAttempts);
  const canStart = isActive && attemptsUsed < maxAttempts;
  const questions = exam.questions ?? [];
  const totalScore = asNumber(exam.maxScore);
  const passScore = asNumber(exam.passScore);

  const answeredCount = Object.keys(answers).length;
  const progressPct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const timeWarning = timeLeft < 60;

  if (phase === "result" && submitResult) {
    const score = asNumber(submitResult.score);
    const passed = submitResult.isPassed;
    return (
      <div className="max-w-2xl mx-auto space-y-8 pb-16">
        <Link href={`/student/courses/${courseId}`}>
          <span className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary cursor-pointer text-sm font-bold transition-colors">
            <ArrowRight className="w-4 h-4" />
            العودة إلى المادة
          </span>
        </Link>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn("rounded-3xl p-10 text-center text-white", passed ? "bg-gradient-to-br from-emerald-500 to-emerald-700" : "bg-gradient-to-br from-red-500 to-red-700")}
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
            {passed ? (
              <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-300" />
            ) : (
              <XCircle className="w-20 h-20 mx-auto mb-4 text-white/70" />
            )}
          </motion.div>
          <h1 className="text-3xl font-display font-bold mb-2">
            {passed ? "أحسنت! اجتزت الامتحان 🎉" : "لم تنجح هذه المرة"}
          </h1>
          <p className="text-white/80 mb-6">{exam.title}</p>
          <div className="text-6xl font-bold mb-2" dir="ltr">{score} / {totalScore}</div>
          <p className="text-white/80 text-sm">
            درجة النجاح: {passScore} — {passed ? "ناجح" : "راسب"}
          </p>
        </motion.div>

        {exam.showResultAfterSubmit && submitResult.answers && submitResult.answers.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">مراجعة الإجاباتك</h2>
            {submitResult.answers.map((ans, i) => (
              <Card key={ans.id} className={cn("p-4", ans.isCorrect === true && "border-emerald-200 bg-emerald-50/30", ans.isCorrect === false && "border-red-200 bg-red-50/30")}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {ans.isCorrect === true ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : ans.isCorrect === false ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm mb-1">
                      <span className="text-muted-foreground ml-1">س{i + 1}.</span>
                      {ans.questionText}
                    </p>
                    {ans.selectedOptionText && (
                      <p className="text-xs text-muted-foreground">إجابتك: <span className="font-bold text-foreground">{ans.selectedOptionText}</span></p>
                    )}
                    {ans.textAnswer && (
                      <p className="text-xs text-muted-foreground">إجابتك: <span className="font-bold text-foreground">{ans.textAnswer}</span></p>
                    )}
                    {ans.pointsEarned != null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        الدرجة: <span className="font-bold">{asNumber(ans.pointsEarned)}</span>
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {canStart && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setPhase("info");
                setSubmitResult(null);
              }}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              محاولة مجدداً ({attemptsUsed + 1} / {maxAttempts})
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (phase === "taking") {
    const q = questions[currentQ];
    if (!q) return null;
    const isLast = currentQ === questions.length - 1;
    const myAnswer = answers[q.id];

    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-16">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg truncate">{exam.title}</h2>
            <p className="text-xs text-muted-foreground">سؤال {currentQ + 1} من {questions.length}</p>
          </div>
          <div className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg tabular-nums", timeWarning ? "bg-red-100 text-red-700 animate-pulse" : "bg-muted")}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                i === currentQ ? "bg-primary text-white" : answers[questions[i].id] ? "bg-emerald-100 text-emerald-700 border border-emerald-300" : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
          >
            <Card className="p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {currentQ + 1}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-base leading-relaxed">{q.questionText}</p>
                  <p className="text-xs text-muted-foreground mt-1">{asNumber(q.points)} درجة</p>
                </div>
              </div>

              {(q.questionType === 0 || q.questionType === 1) && q.options && (
                <div className="space-y-2 pr-11">
                  {q.options.map((opt) => {
                    const selected = myAnswer?.selectedOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAnswer(q.id, { selectedOptionId: opt.id, textAnswer: undefined })}
                        className={cn(
                          "w-full text-right px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium",
                          selected
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border hover:border-primary/40 hover:bg-muted/30",
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span className={cn("w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center", selected ? "border-primary" : "border-muted-foreground/40")}>
                            {selected && <span className="w-2.5 h-2.5 rounded-full bg-primary block" />}
                          </span>
                          {opt.optionText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {q.questionType === 2 && (
                <div className="pr-11">
                  <textarea
                    value={myAnswer?.textAnswer ?? ""}
                    onChange={(e) => setAnswer(q.id, { textAnswer: e.target.value, selectedOptionId: undefined })}
                    rows={4}
                    placeholder="اكتب إجابتك هنا..."
                    className="w-full border-2 border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none transition-colors"
                  />
                </div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={currentQ === 0}
            onClick={() => setCurrentQ((q) => q - 1)}
            className="gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            السابق
          </Button>

          <span className="text-sm text-muted-foreground font-bold">
            {answeredCount} / {questions.length} مُجاب
          </span>

          {isLast ? (
            <Button
              size="sm"
              isLoading={submitAttempt.isPending}
              onClick={() => {
                if (confirm(`تسليم الامتحان؟\nأجبت على ${answeredCount} من ${questions.length} سؤال.`)) {
                  submitAttempt.mutate();
                }
              }}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="w-4 h-4" />
              تسليم الامتحان
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setCurrentQ((q) => q + 1)}
              className="gap-2"
            >
              التالي
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
        </div>

        {submitAttempt.isError && (
          <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{(submitAttempt.error as Error).message}</p>
          </Card>
        )}
      </div>
    );
  }

  const bestAttempt = myAttempts.filter((a) => a.status !== "InProgress").sort((a, b) => asNumber(b.score) - asNumber(a.score))[0];

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      <Link href={`/student/courses/${courseId}`}>
        <span className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary cursor-pointer text-sm font-bold transition-colors">
          <ArrowRight className="w-4 h-4" />
          العودة إلى المادة
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-8 text-white"
        style={{ background: "linear-gradient(135deg, #1e40af 0%, #4338ca 100%)" }}
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {!exam.isPublished && <Badge className="bg-white/10 text-white/70 border-white/20">مسودة</Badge>}
          {isActive && <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30">● متاح الآن</Badge>}
          {isPast && <Badge className="bg-white/10 text-white/70 border-white/20">انتهى</Badge>}
          {!isActive && !isPast && <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30">قادم</Badge>}
        </div>
        <h1 className="text-3xl font-display font-bold mb-2">{exam.title}</h1>
        {exam.description && <p className="text-white/70 mb-4">{exam.description}</p>}
        <div className="flex flex-wrap gap-5 text-sm text-white/80">
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{asNumber(exam.durationMinutes)} دقيقة</span>
          <span className="flex items-center gap-1.5"><Target className="w-4 h-4" />النجاح: {passScore} / {totalScore}</span>
          <span className="flex items-center gap-1.5"><ClipboardList className="w-4 h-4" />{questions.length} سؤال</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{attemptsUsed}</div>
          <div className="text-xs text-muted-foreground mt-1">محاولات سابقة</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{maxAttempts}</div>
          <div className="text-xs text-muted-foreground mt-1">الحد الأقصى</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{bestAttempt ? asNumber(bestAttempt.score) : "—"}</div>
          <div className="text-xs text-muted-foreground mt-1">أفضل درجة</div>
        </Card>
      </div>

      {myAttempts.filter((a) => a.status !== "InProgress").length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold">محاولاتي السابقة</h3>
          {myAttempts.filter((a) => a.status !== "InProgress").map((a) => (
            <Card key={a.id} className="p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", a.isPassed ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
                {a.isPassed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">محاولة #{asNumber(a.attemptNumber)}</p>
                <p className="text-xs text-muted-foreground">{a.submittedAt ? new Date(a.submittedAt).toLocaleString("ar") : "—"}</p>
              </div>
              <div className="text-left shrink-0">
                <p className="font-bold" dir="ltr">{asNumber(a.score)} / {asNumber(a.maxScore)}</p>
                <Badge variant={a.isPassed ? "success" : "warning"} className="text-xs">
                  {a.isPassed ? "ناجح" : "راسب"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isActive && !isPast && (
        <Card className="p-6 text-center border-amber-200 bg-amber-50/50">
          <Clock className="w-10 h-10 mx-auto text-amber-500 mb-3" />
          <h3 className="font-bold text-amber-800 mb-1">الامتحان لم يبدأ بعد</h3>
          <p className="text-sm text-amber-700">يبدأ في {new Date(exam.startDate).toLocaleString("ar")}</p>
        </Card>
      )}

      {isPast && !canStart && (
        <Card className="p-6 text-center border-muted">
          <Lock className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-bold mb-1">انتهى وقت الامتحان</h3>
          <p className="text-sm text-muted-foreground">انتهت الفترة المحددة لهذا الامتحان</p>
        </Card>
      )}

      {attemptsUsed >= maxAttempts && isActive && (
        <Card className="p-6 text-center border-muted">
          <Lock className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-bold mb-1">استنفدت محاولاتك</h3>
          <p className="text-sm text-muted-foreground">لقد استخدمت جميع المحاولات المتاحة لهذا الامتحان</p>
        </Card>
      )}

      {canStart && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sm text-sky-800 space-y-1">
            <p className="font-bold">قبل البدء:</p>
            <ul className="list-disc list-inside space-y-1 text-sky-700">
              <li>المدة: {asNumber(exam.durationMinutes)} دقيقة من لحظة البدء</li>
              <li>يمكنك التنقل بين الأسئلة بحرية</li>
              <li>سيُسلَّم تلقائياً عند انتهاء الوقت</li>
              {exam.shuffleQuestions && <li>ترتيب الأسئلة عشوائي</li>}
            </ul>
          </div>
          <Button
            className="w-full gap-2 h-12 text-base"
            isLoading={startAttempt.isPending}
            onClick={() => startAttempt.mutate()}
          >
            <PlayCircle className="w-5 h-5" />
            بدء الامتحان
            {attemptsUsed > 0 && ` (محاولة ${attemptsUsed + 1})`}
          </Button>
          {startAttempt.isError && (
            <p className="text-sm text-destructive text-center">{(startAttempt.error as Error).message}</p>
          )}
        </div>
      )}
    </div>
  );
}
