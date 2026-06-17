import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  AlertCircle,
  CalendarCheck,
  ChevronLeft,
  ClipboardCheck,
  ClipboardList,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  PenLine,
  Play,
  Plus,
  Power,
  RadioTower,
  Save,
  Target,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { Badge, Button, Card, Input, Modal, Select } from "@/components/ui/shared";
import {
  ASSESSMENT_TYPE_LABEL_AR,
  ATTENDANCE_STATUS_LABEL_AR,
  ATTENDANCE_STATUS_FROM_LABEL,
  asNumber,
  assessmentsApi,
  attendanceApi,
  examsApi,
  liveSessionsApi,
  type AssessmentResponseDto,
  type AttendanceRecordItemDto,
  type AttendanceSessionResponseDto,
  type ExamAttemptResponseDto,
  type ExamResponseDto,
  type GradeResponseDto,
  type LiveSessionResponseDto,
  type UserResponseDto,
  type Uuid,
} from "@/lib/external-api";
import {
  useAssessmentGrades,
  useAssessments,
  useAttendanceSessions,
  useEnrollmentsForCourse,
  useExams,
  useLiveSessions,
  useMyAttendanceRate,
  useMyExamAttempts,
  useMyGrades,
  useUsers,
} from "@/lib/queries";

interface TabProps {
  courseId: Uuid;
  canEdit: boolean;
  studentMode?: boolean;
}

// ────────────────────────────────────────────────────────────
// ASSESSMENTS / GRADES TAB
// ────────────────────────────────────────────────────────────
export function AssessmentsTab({ courseId, canEdit, studentMode }: TabProps) {
  const qc = useQueryClient();
  const { data: items = [], isLoading, error } = useAssessments(courseId);
  const { data: myGrades = [] } = useMyGrades(studentMode ? courseId : undefined);

  const [createOpen, setCreateOpen] = useState(false);
  const [gradesFor, setGradesFor] = useState<AssessmentResponseDto | null>(null);

  const remove = useMutation({
    mutationFn: (id: number) => assessmentsApi.remove(courseId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["external", "course", courseId, "assessments"] }),
  });

  if (isLoading) return <LoadingPlaceholder />;
  if (error) return <ErrorPlaceholder error={error as Error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-primary" /> التقييمات والدرجات
        </h2>
        {canEdit && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2" size="sm">
            <Plus className="w-4 h-4" /> تقييم جديد
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyPlaceholder icon={ClipboardCheck} text="لا توجد تقييمات حتى الآن." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((a) => {
            const myGrade = myGrades.find((g) => g.assessmentId === a.id);
            return (
              <Card key={a.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">{labelOfAssessmentType(a.assessmentType)}</Badge>
                    <Badge variant="outline">{asNumber(a.weight)}%</Badge>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => {
                        if (confirm("حذف هذا التقييم؟")) remove.mutate(a.id);
                      }}
                      className="text-destructive hover:bg-destructive/10 p-1 rounded-md"
                      aria-label="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <h3 className="font-bold text-lg break-words">{a.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  من {asNumber(a.maxScore)} درجة • {new Date(a.assessmentDate).toLocaleDateString("ar")}
                </p>

                {studentMode && myGrade && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-sm">
                      <span className="font-bold text-emerald-700">درجتي: </span>
                      <span dir="ltr">{asNumber(myGrade.score)} / {asNumber(myGrade.maxScore)}</span>
                      <span className="text-emerald-600"> ({asNumber(myGrade.percentage).toFixed(1)}%)</span>
                    </p>
                    {myGrade.notes && <p className="text-xs text-muted-foreground mt-1">{myGrade.notes}</p>}
                  </div>
                )}

                {canEdit && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {asNumber(a.gradedStudentsCount)} طالب مُقيَّم
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setGradesFor(a)}
                    >
                      <TrendingUp className="w-4 h-4" /> رصد الدرجات
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {createOpen && (
        <CreateAssessmentModal
          courseId={courseId}
          onClose={() => setCreateOpen(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ["external", "course", courseId, "assessments"] })}
        />
      )}

      {gradesFor && (
        <GradesModal
          courseId={courseId}
          assessment={gradesFor}
          onClose={() => setGradesFor(null)}
        />
      )}
    </div>
  );
}

function CreateAssessmentModal({
  courseId,
  onClose,
  onCreated,
}: {
  courseId: Uuid;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<number>(1);
  const [maxScore, setMaxScore] = useState(100);
  const [weight, setWeight] = useState(10);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));

  const create = useMutation({
    mutationFn: () =>
      assessmentsApi.create(courseId, {
        courseId,
        title,
        assessmentType: type,
        maxScore,
        weight,
        assessmentDate: new Date(date).toISOString(),
      }),
    onSuccess: () => {
      onCreated();
      onClose();
    },
  });

  return (
    <Modal isOpen onClose={onClose} title="إضافة تقييم جديد">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-bold mb-2">العنوان</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">النوع</label>
          <Select value={type} onChange={(e) => setType(Number(e.target.value))}>
            {Object.entries(ASSESSMENT_TYPE_LABEL_AR).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold mb-2">الدرجة الكلية</label>
            <Input type="number" min={1} value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} required />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">الوزن (%)</label>
            <Input type="number" min={0} max={100} value={weight} onChange={(e) => setWeight(Number(e.target.value))} required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">التاريخ</label>
          <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        {create.isError && <ErrorBox error={create.error as Error} />}
        <div className="pt-3 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button type="submit" isLoading={create.isPending}>حفظ</Button>
        </div>
      </form>
    </Modal>
  );
}

function GradesModal({
  courseId,
  assessment,
  onClose,
}: {
  courseId: Uuid;
  assessment: AssessmentResponseDto;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: students = [] } = useEnrollmentsForCourse(courseId);
  const { data: grades = [], isLoading } = useAssessmentGrades(courseId, assessment.id);

  const [edits, setEdits] = useState<Record<string, { score: string; notes: string }>>({});

  const upsert = useMutation({
    mutationFn: async ({ studentId, existing }: { studentId: Uuid; existing: GradeResponseDto | undefined }) => {
      const e = edits[studentId];
      const score = Number(e.score);
      if (existing) {
        return assessmentsApi.updateGrade(courseId, assessment.id, existing.id, {
          score,
          notes: e.notes || null,
        });
      }
      return assessmentsApi.addGrade(courseId, assessment.id, {
        assessmentId: assessment.id,
        studentId,
        score,
        notes: e.notes || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["external", "course", courseId, "assessment", assessment.id, "grades"] });
      qc.invalidateQueries({ queryKey: ["external", "course", courseId, "assessments"] });
    },
  });

  return (
    <Modal isOpen onClose={onClose} title={`رصد درجات: ${assessment.title}`}>
      {isLoading ? (
        <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      ) : students.length === 0 ? (
        <p className="text-center text-muted-foreground py-6">لا يوجد طلاب مسجّلون.</p>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {students.map((e) => {
            const existing = grades.find((g) => g.studentId === e.studentId);
            const draft = edits[e.studentId];
            const value = draft?.score ?? (existing ? String(asNumber(existing.score)) : "");
            const notes = draft?.notes ?? (existing?.notes ?? "");
            const dirty = !!draft;
            return (
              <div key={e.studentId} className="p-3 rounded-xl border border-border flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm break-words">{e.student.fullName}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">{e.student.email}</p>
                </div>
                <Input
                  type="number"
                  step="0.5"
                  min={0}
                  max={asNumber(assessment.maxScore)}
                  value={value}
                  onChange={(ev) =>
                    setEdits((prev) => ({
                      ...prev,
                      [e.studentId]: { score: ev.target.value, notes },
                    }))
                  }
                  className="w-24 h-9 text-center"
                  placeholder="—"
                />
                <span className="text-xs text-muted-foreground">/ {asNumber(assessment.maxScore)}</span>
                <Button
                  type="button"
                  size="sm"
                  isLoading={upsert.isPending && upsert.variables?.studentId === e.studentId}
                  disabled={!dirty || value === ""}
                  onClick={() => upsert.mutate({ studentId: e.studentId, existing })}
                  className="gap-1"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      <div className="pt-4 flex justify-end">
        <Button type="button" variant="ghost" onClick={onClose}>إغلاق</Button>
      </div>
    </Modal>
  );
}

function labelOfAssessmentType(t: string | number): string {
  if (typeof t === "number") return ASSESSMENT_TYPE_LABEL_AR[t] ?? `النوع ${t}`;
  const n = Number(t);
  if (Number.isFinite(n)) return ASSESSMENT_TYPE_LABEL_AR[n] ?? t;
  return t;
}

// ────────────────────────────────────────────────────────────
// ATTENDANCE TAB
// ────────────────────────────────────────────────────────────
export function AttendanceTab({ courseId, canEdit, studentMode }: TabProps) {
  const qc = useQueryClient();
  const { data: sessions = [], isLoading, error } = useAttendanceSessions(courseId);
  const { data: rate } = useMyAttendanceRate(studentMode ? courseId : undefined);

  const [createOpen, setCreateOpen] = useState(false);
  const [recordingFor, setRecordingFor] = useState<AttendanceSessionResponseDto | null>(null);

  if (isLoading) return <LoadingPlaceholder />;
  if (error) return <ErrorPlaceholder error={error as Error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-primary" /> الحضور والغياب
        </h2>
        {canEdit && (
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> جلسة جديدة
          </Button>
        )}
      </div>

      {studentMode && rate && (
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-800">نسبة حضوري في هذه المادة</span>
            <span className="text-2xl font-bold text-emerald-700">{(asNumber(rate.rate) * 100).toFixed(0)}%</span>
          </div>
          <p className="text-xs text-emerald-700 mt-1">
            {asNumber(rate.present)} حضور من {asNumber(rate.total)} جلسة
          </p>
        </Card>
      )}

      {sessions.length === 0 ? (
        <EmptyPlaceholder icon={CalendarCheck} text="لا توجد جلسات حضور بعد." />
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Card key={s.id} className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold break-words">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.sessionDate).toLocaleDateString("ar")} • {s.records?.length ?? 0} مسجَّل
                </p>
              </div>
              {canEdit ? (
                <Button size="sm" variant="outline" onClick={() => setRecordingFor(s)} className="gap-1">
                  <PenLine className="w-4 h-4" /> رصد
                </Button>
              ) : (
                <RecordsBadge session={s} studentMode={!!studentMode} />
              )}
            </Card>
          ))}
        </div>
      )}

      {createOpen && (
        <CreateAttendanceModal
          courseId={courseId}
          onClose={() => setCreateOpen(false)}
          onCreated={(session) => {
            qc.invalidateQueries({ queryKey: ["external", "course", courseId, "attendance"] });
            setCreateOpen(false);
            setRecordingFor(session);
          }}
        />
      )}

      {recordingFor && (
        <RecordAttendanceModal
          courseId={courseId}
          session={recordingFor}
          onClose={() => setRecordingFor(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["external", "course", courseId, "attendance"] });
            setRecordingFor(null);
          }}
        />
      )}
    </div>
  );
}

function RecordsBadge({ session, studentMode }: { session: AttendanceSessionResponseDto; studentMode: boolean }) {
  if (!studentMode) return <Badge variant="outline">{session.records?.length ?? 0} طالب</Badge>;
  return null;
}

function CreateAttendanceModal({
  courseId,
  onClose,
  onCreated,
}: {
  courseId: Uuid;
  onClose: () => void;
  onCreated: (s: AttendanceSessionResponseDto) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const create = useMutation({
    mutationFn: () =>
      attendanceApi.createSession(courseId, {
        courseId,
        sessionDate: date,
        title,
        notes: notes || null,
      }),
    onSuccess: (s) => onCreated(s),
  });

  return (
    <Modal isOpen onClose={onClose} title="جلسة حضور جديدة">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-bold mb-2">العنوان</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="محاضرة الأسبوع 5" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">التاريخ</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">ملاحظات</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اختياري" />
        </div>
        {create.isError && <ErrorBox error={create.error as Error} />}
        <div className="pt-3 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button type="submit" isLoading={create.isPending}>إنشاء</Button>
        </div>
      </form>
    </Modal>
  );
}

function RecordAttendanceModal({
  courseId,
  session,
  onClose,
  onSaved,
}: {
  courseId: Uuid;
  session: AttendanceSessionResponseDto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data: students = [], isLoading } = useEnrollmentsForCourse(courseId);
  const initial: Record<string, number> = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of session.records ?? []) {
      m[r.studentId] = statusToNumber(r.status);
    }
    return m;
  }, [session]);

  const [marks, setMarks] = useState<Record<string, number>>(initial);

  const save = useMutation({
    mutationFn: () => {
      const records: AttendanceRecordItemDto[] = students.map((e) => ({
        studentId: e.studentId,
        status: marks[e.studentId] ?? 1, // default Absent
      }));
      return attendanceApi.recordSession(courseId, session.id, {
        attendanceSessionId: session.id,
        records,
      });
    },
    onSuccess: onSaved,
  });

  return (
    <Modal isOpen onClose={onClose} title={`رصد الحضور: ${session.title}`}>
      {isLoading ? (
        <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      ) : students.length === 0 ? (
        <p className="text-center text-muted-foreground py-6">لا يوجد طلاب مسجّلون.</p>
      ) : (
        <div className="space-y-2 max-h-[55vh] overflow-y-auto">
          {students.map((e) => (
            <div key={e.studentId} className="p-3 rounded-xl border border-border flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm break-words">{e.student.fullName}</p>
              </div>
              <Select
                value={marks[e.studentId] ?? 1}
                onChange={(ev) =>
                  setMarks((prev) => ({ ...prev, [e.studentId]: Number(ev.target.value) }))
                }
                className="w-32 h-9"
              >
                {Object.entries(ATTENDANCE_STATUS_LABEL_AR).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </div>
          ))}
        </div>
      )}
      {save.isError && <ErrorBox error={save.error as Error} />}
      <div className="pt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
        <Button type="button" isLoading={save.isPending} onClick={() => save.mutate()}>حفظ</Button>
      </div>
    </Modal>
  );
}

function statusToNumber(s: string | number): number {
  if (typeof s === "number") return s;
  const n = Number(s);
  if (Number.isFinite(n)) return n;
  return ATTENDANCE_STATUS_FROM_LABEL[s] ?? 1;
}

// ────────────────────────────────────────────────────────────
// EXAMS TAB
// ────────────────────────────────────────────────────────────
export function ExamsTab({ courseId, canEdit, studentMode }: TabProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: items = [], isLoading, error } = useExams(courseId);

  const remove = useMutation({
    mutationFn: (id: number) => examsApi.remove(courseId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["external", "course", courseId, "exams"] }),
  });

  const publish = useMutation({
    mutationFn: (id: number) => examsApi.publish(courseId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["external", "course", courseId, "exams"] }),
  });

  if (isLoading) return <LoadingPlaceholder />;
  if (error) return <ErrorPlaceholder error={error as Error} />;

  const visible = studentMode ? items.filter((e) => e.isPublished) : items;
  const isAdmin = user?.role === "admin";
  const prefix = isAdmin ? "/admin" : "";
  const builderPath = `${prefix}/courses/${courseId}/exams/new`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" /> الامتحانات
        </h2>
        {canEdit && (
          <Link href={builderPath}>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> امتحان جديد
            </Button>
          </Link>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyPlaceholder icon={ClipboardList} text={canEdit ? "لا توجد امتحانات بعد. أنشئ امتحاناً جديداً مع أسئلة كاملة." : "لا توجد امتحانات منشورة."} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((ex) => (
            <ExamCard
              key={ex.id}
              exam={ex}
              courseId={courseId}
              canEdit={canEdit}
              studentMode={!!studentMode}
              prefix={prefix}
              onDelete={(id) => { if (confirm("حذف الامتحان؟")) remove.mutate(id); }}
              onPublish={(id) => publish.mutate(id)}
              isPublishing={publish.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExamCard({
  exam,
  courseId,
  canEdit,
  studentMode,
  prefix,
  onDelete,
  onPublish,
  isPublishing,
}: {
  exam: ExamResponseDto;
  courseId: Uuid;
  canEdit: boolean;
  studentMode: boolean;
  prefix: string;
  onDelete: (id: number) => void;
  onPublish: (id: number) => void;
  isPublishing: boolean;
}) {
  const { data: myAttempts = [] } = useMyExamAttempts(studentMode ? courseId : undefined, studentMode ? exam.id : null);
  const submittedAttempts = myAttempts.filter((a) => a.status !== "InProgress");
  const bestAttempt = submittedAttempts.sort((a, b) => asNumber(b.score) - asNumber(a.score))[0];
  const now = Date.now();
  const startsAt = new Date(exam.startDate).getTime();
  const endsAt = new Date(exam.endDate).getTime();
  const isOpen = now >= startsAt && now <= endsAt;
  const detailPath = studentMode
    ? `/student/courses/${courseId}/exams/${exam.id}`
    : `${prefix}/courses/${courseId}/exams/${exam.id}`;

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {exam.isPublished ? (
            <Badge variant="success">منشور</Badge>
          ) : (
            <Badge variant="warning">مسودة</Badge>
          )}
          {isOpen && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">● متاح الآن</Badge>}
        </div>
        {canEdit && (
          <button onClick={() => onDelete(exam.id)} className="text-destructive hover:bg-destructive/10 p-1 rounded-md shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div>
        <h3 className="font-bold text-base break-words">{exam.title}</h3>
        {exam.description && <p className="text-sm text-muted-foreground mt-0.5 break-words line-clamp-2">{exam.description}</p>}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{asNumber(exam.durationMinutes)} دقيقة</span>
        <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" />النجاح: {asNumber(exam.passScore)}</span>
        <span className="flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" />{exam.questions?.length ?? 0} سؤال</span>
      </div>

      <div className="flex gap-2 flex-wrap mt-auto pt-1">
        {canEdit && !exam.isPublished && (
          <Button size="sm" variant="outline" onClick={() => onPublish(exam.id)} disabled={isPublishing} className="gap-1">
            <Globe className="w-3.5 h-3.5" /> نشر
          </Button>
        )}
        {canEdit && (
          <Link href={detailPath}>
            <Button size="sm" variant="outline" className="gap-1">
              <ExternalLink className="w-3.5 h-3.5" /> التفاصيل والأسئلة
            </Button>
          </Link>
        )}
        {studentMode && exam.isPublished && (
          <>
            {bestAttempt ? (
              <div className="flex items-center gap-2 flex-1">
                <Badge variant={bestAttempt.isPassed ? "success" : "warning"} className="text-xs">
                  {bestAttempt.isPassed ? "ناجح" : "راسب"} — {asNumber(bestAttempt.score)} / {asNumber(bestAttempt.maxScore)}
                </Badge>
                <Link href={detailPath} className="mr-auto">
                  <span className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
                    عرض <ChevronLeft className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            ) : isOpen ? (
              <Link href={detailPath}>
                <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                  <Play className="w-3.5 h-3.5" /> ابدأ الامتحان
                </Button>
              </Link>
            ) : (
              <Badge variant="outline" className="text-xs">
                {now < startsAt ? "لم يبدأ بعد" : "انتهى الوقت"}
              </Badge>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────
// LIVE SESSIONS TAB
// ────────────────────────────────────────────────────────────
export function LiveSessionsTab({ courseId, canEdit, studentMode }: TabProps) {
  const qc = useQueryClient();
  const { data: items = [], isLoading, error } = useLiveSessions(courseId);
  const [createOpen, setCreateOpen] = useState(false);

  const start = useMutation({
    mutationFn: (id: Uuid) => liveSessionsApi.start(courseId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["external", "course", courseId, "live-sessions"] }),
  });
  const end = useMutation({
    mutationFn: (id: Uuid) => liveSessionsApi.end(courseId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["external", "course", courseId, "live-sessions"] }),
  });
  const join = useMutation({
    mutationFn: (id: Uuid) => liveSessionsApi.join(courseId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["external", "course", courseId, "live-sessions"] }),
  });
  const leave = useMutation({
    mutationFn: (id: Uuid) => liveSessionsApi.leave(courseId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["external", "course", courseId, "live-sessions"] }),
  });

  if (isLoading) return <LoadingPlaceholder />;
  if (error) return <ErrorPlaceholder error={error as Error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <RadioTower className="w-6 h-6 text-primary" /> المحاضرات الحيّة
        </h2>
        {canEdit && (
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> جدولة جلسة
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyPlaceholder icon={RadioTower} text="لا توجد جلسات بث مباشر." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((s) => (
            <LiveSessionCard
              key={s.id}
              session={s}
              canEdit={canEdit}
              studentMode={!!studentMode}
              onStart={(id) => start.mutate(id)}
              onEnd={(id) => end.mutate(id)}
              onJoin={(id) => join.mutate(id)}
              onLeave={(id) => leave.mutate(id)}
              busy={start.isPending || end.isPending || join.isPending || leave.isPending}
            />
          ))}
        </div>
      )}

      {createOpen && (
        <CreateLiveSessionModal
          courseId={courseId}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ["external", "course", courseId, "live-sessions"] });
            setCreateOpen(false);
          }}
        />
      )}
    </div>
  );
}

function LiveSessionCard({
  session,
  canEdit,
  studentMode,
  onStart,
  onEnd,
  onJoin,
  onLeave,
  busy,
}: {
  session: LiveSessionResponseDto;
  canEdit: boolean;
  studentMode: boolean;
  onStart: (id: Uuid) => void;
  onEnd: (id: Uuid) => void;
  onJoin: (id: Uuid) => void;
  onLeave: (id: Uuid) => void;
  busy: boolean;
}) {
  const isLive = session.status?.toLowerCase().includes("live") || !!session.startedAt && !session.endedAt;
  const isEnded = !!session.endedAt;

  return (
    <Card className={`p-5 ${isLive ? "ring-2 ring-rose-500/30 bg-rose-50/30" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-2">
          {isLive && <Badge variant="default" className="bg-rose-500/10 text-rose-700">● مباشر الآن</Badge>}
          {isEnded && <Badge variant="outline">انتهى</Badge>}
          {!isLive && !isEnded && <Badge variant="warning">مجدول</Badge>}
          <Badge variant="outline">{asNumber(session.viewerCount)} مشاهد</Badge>
        </div>
      </div>
      <h3 className="font-bold text-lg break-words">{session.title}</h3>
      <p className="text-xs text-muted-foreground mt-1" dir="ltr">
        {new Date(session.scheduledAt).toLocaleString("ar")}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        المحاضر: {session.hostProfessor?.fullName}
      </p>

      <div className="mt-4 flex gap-2 flex-wrap">
        {canEdit && !isLive && !isEnded && (
          <Button size="sm" onClick={() => onStart(session.id)} disabled={busy} className="gap-1">
            <Play className="w-4 h-4" /> بدء البث
          </Button>
        )}
        {canEdit && isLive && (
          <Button size="sm" variant="destructive" onClick={() => onEnd(session.id)} disabled={busy} className="gap-1">
            <Power className="w-4 h-4" /> إنهاء
          </Button>
        )}
        {studentMode && isLive && (
          <>
            <Button size="sm" onClick={() => onJoin(session.id)} disabled={busy} className="gap-1">
              <Play className="w-4 h-4" /> الانضمام
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onLeave(session.id)} disabled={busy}>
              مغادرة
            </Button>
          </>
        )}
        {canEdit && session.streamKey && (
          <code className="text-[10px] bg-muted px-2 py-1 rounded ms-auto" dir="ltr">
            {session.streamKey.slice(0, 16)}…
          </code>
        )}
      </div>
    </Card>
  );
}

function CreateLiveSessionModal({
  courseId,
  onClose,
  onCreated,
}: {
  courseId: Uuid;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState(() => new Date(Date.now() + 3600000).toISOString().slice(0, 16));

  const create = useMutation({
    mutationFn: () =>
      liveSessionsApi.create(courseId, {
        courseId,
        title,
        scheduledAt: new Date(when).toISOString(),
      }),
    onSuccess: () => onCreated(),
  });

  return (
    <Modal isOpen onClose={onClose} title="جدولة جلسة بث مباشر">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-bold mb-2">عنوان الجلسة</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">موعد البدء</label>
          <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
        </div>
        {create.isError && <ErrorBox error={create.error as Error} />}
        <div className="pt-3 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button type="submit" isLoading={create.isPending}>جدولة</Button>
        </div>
      </form>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────
// STUDENTS / ENROLLMENTS TAB (teacher view of enrolled students)
// ────────────────────────────────────────────────────────────
export function StudentsTab({ courseId, canEdit }: TabProps) {
  const qc = useQueryClient();
  const { data: enrollments = [], isLoading, error } = useEnrollmentsForCourse(courseId);
  const { data: allUsers = [] } = useUsers();
  const [pickerOpen, setPickerOpen] = useState(false);

  const remove = useMutation({
    mutationFn: (studentId: Uuid) => import("@/lib/external-api").then((m) => m.enrollmentsApi.unenrollStudent(courseId, studentId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["external", "course", courseId, "enrollments"] }),
  });

  if (isLoading) return <LoadingPlaceholder />;
  if (error) return <ErrorPlaceholder error={error as Error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">الطلاب المسجّلون ({enrollments.length})</h2>
      </div>

      {enrollments.length === 0 ? (
        <EmptyPlaceholder icon={ClipboardList} text="لا يوجد طلاب مسجّلون بعد." />
      ) : (
        <div className="space-y-2">
          {enrollments.map((e) => (
            <Card key={e.id} className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                {e.student?.fullName?.[0] ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold break-words">{e.student?.fullName}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">{e.student?.email}</p>
              </div>
              <Badge variant="outline">
                {new Date(e.enrolledAt).toLocaleDateString("ar")}
              </Badge>
              {canEdit && (
                <button
                  onClick={() => {
                    if (confirm(`إلغاء تسجيل ${e.student?.fullName}؟`)) remove.mutate(e.studentId);
                  }}
                  className="text-destructive hover:bg-destructive/10 p-1.5 rounded-md"
                  aria-label="إلغاء التسجيل"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
function LoadingPlaceholder() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-muted/40 rounded-2xl animate-pulse" />)}
    </div>
  );
}

function ErrorPlaceholder({ error }: { error: Error }) {
  return (
    <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
      <p className="text-sm text-destructive break-words">{error.message}</p>
    </Card>
  );
}

function ErrorBox({ error }: { error: Error }) {
  return <p className="text-sm text-destructive break-words">{error.message}</p>;
}

function EmptyPlaceholder({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-border">
      <Icon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}
