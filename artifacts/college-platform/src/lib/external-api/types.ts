export type Uuid = string;

// ───────── Users ─────────
export interface UserSummaryDto {
  id: Uuid;
  fullName: string;
  email: string;
  profileImageUrl?: string | null;
  roles?: string[];
}

export interface UserResponseDto {
  id: Uuid;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  profileImageUrl?: string | null;
  preferredLanguage: string;
  isActive: boolean;
  createdAtUtc: string;
  roles: string[];
}

// ───────── Auth ─────────
export interface AuthResponseDto {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: UserSummaryDto;
  roles: string[];
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RegisterRequestDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfileDto {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  profileImageUrl?: string | null;
  preferredLanguage?: string | null;
}

// ───────── Schedules ─────────
// Request uses integer enum DayOfWeekAr (0..6). Response returns the localized Arabic string.
export const DayOfWeekAr = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
} as const;
export type DayOfWeekArValue = (typeof DayOfWeekAr)[keyof typeof DayOfWeekAr];

export interface ScheduleResponseDto {
  id: number;
  courseId: Uuid;
  courseName?: string;
  dayOfWeek: string; // localized string
  startTime: string;
  endTime: string;
  roomNumber: string;
  building?: string | null;
  isActive?: boolean;
}

export interface CreateScheduleDto {
  dayOfWeek: DayOfWeekArValue | number;
  startTime: string;
  endTime: string;
  roomNumber: string;
  building?: string | null;
}

export interface UpdateScheduleDto {
  dayOfWeek?: DayOfWeekArValue | number | null;
  startTime?: string | null;
  endTime?: string | null;
  roomNumber?: string | null;
  building?: string | null;
  isActive?: boolean | null;
}

// ───────── Courses ─────────
export interface CourseSummaryDto {
  id: Uuid;
  courseCode: string;
  courseName: string;
  department: string;
  credits: number | string;
  semester: string;
  academicYear: string;
  isActive: boolean;
  professorName: string;
}

export interface CourseResponseDto {
  id: Uuid;
  courseCode: string;
  courseName: string;
  description?: string | null;
  department: string;
  credits: number | string;
  semester: string;
  academicYear: string;
  isActive: boolean;
  createdAtUtc: string;
  professor: UserSummaryDto;
  enrolledStudentsCount: number | string;
  filesCount: number | string;
  videoLecturesCount: number | string;
  schedules: ScheduleResponseDto[];
}

export const Semester = {
  Fall: 0,
  Spring: 1,
  Summer: 2,
} as const;
export type SemesterValue = (typeof Semester)[keyof typeof Semester];

export interface CreateCourseDto {
  courseCode: string;
  courseName: string;
  description?: string | null;
  department: string;
  credits: number;
  semester: SemesterValue | number;
  academicYear: string;
}

export interface UpdateCourseDto {
  courseName?: string | null;
  description?: string | null;
  department?: string | null;
  credits?: number | null;
  semester?: SemesterValue | number | null;
  academicYear?: string | null;
  isActive?: boolean | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number | string;
  page: number | string;
  pageSize: number | string;
  totalPages: number | string;
  hasPrevious: boolean;
  hasNext: boolean;
}

// ───────── Videos ─────────
export interface VideoLectureResponseDto {
  id: number;
  courseId: Uuid;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  fileName: string;
  fileSize: number | string;
  durationSeconds: number | string;
  videoOrder: number | string;
  processingStatus: string;
  isPublished: boolean;
  views: number | string;
  uploadedAt: string;
  publishedAt?: string | null;
  uploadedBy: UserSummaryDto;
  streamUrl: string;
}

export interface UpdateVideoLectureDto {
  title?: string | null;
  description?: string | null;
  videoOrder?: number | null;
  isPublished?: boolean | null;
}

export interface CreateVideoLectureForm {
  title: string;
  description?: string;
  videoOrder: number;
  video: File;
  thumbnail?: File;
}

export type CoursesQuery = {
  page?: number;
  pageSize?: number;
  dept?: string;
  keyword?: string;
};

// ───────── Assessments / Grades ─────────
// AssessmentType: 0=Quiz, 1=Assignment, 2=Project, 3=Midterm, 4=Final, 5=Participation (best guess; rendered via labels)
export const AssessmentType = {
  Quiz: 0,
  Assignment: 1,
  Project: 2,
  Midterm: 3,
  Final: 4,
  Participation: 5,
} as const;
export type AssessmentTypeValue = number;

export const ASSESSMENT_TYPE_LABEL_AR: Record<number, string> = {
  0: "اختبار قصير",
  1: "واجب",
  2: "مشروع",
  3: "نصفي",
  4: "نهائي",
  5: "مشاركة",
};

export interface AssessmentResponseDto {
  id: number;
  courseId: Uuid;
  courseName: string;
  title: string;
  assessmentType: string | number; // some backends return label, some integer
  maxScore: number | string;
  weight: number | string;
  assessmentDate: string;
  createdAt: string;
  gradedStudentsCount: number | string;
}

export interface CreateAssessmentDto {
  courseId: Uuid;
  title: string;
  assessmentType: AssessmentTypeValue;
  maxScore: number;
  weight: number;
  assessmentDate: string;
}

export interface UpdateAssessmentDto {
  title?: string | null;
  assessmentType?: AssessmentTypeValue | null;
  maxScore?: number | null;
  weight?: number | null;
  assessmentDate?: string | null;
}

export interface GradeResponseDto {
  id: number;
  assessmentId: number;
  assessmentTitle: string;
  studentId: Uuid;
  studentName: string;
  score: number | string;
  maxScore: number | string;
  percentage: number | string;
  gradedAt: string;
  notes?: string | null;
}

export interface CreateGradeDto {
  assessmentId: number;
  studentId: Uuid;
  score: number;
  notes?: string | null;
}

export interface UpdateGradeDto {
  score?: number | null;
  notes?: string | null;
}

// ───────── Attendance ─────────
export const AttendanceStatus = {
  Present: 0,
  Absent: 1,
  Late: 2,
  Excused: 3,
} as const;
export type AttendanceStatusValue = number;

export const ATTENDANCE_STATUS_LABEL_AR: Record<number, string> = {
  0: "حاضر",
  1: "غائب",
  2: "متأخر",
  3: "بعذر",
};
export const ATTENDANCE_STATUS_FROM_LABEL: Record<string, number> = {
  Present: 0,
  Absent: 1,
  Late: 2,
  Excused: 3,
  حاضر: 0,
  غائب: 1,
  متأخر: 2,
  بعذر: 3,
};

export interface AttendanceRecordResponseDto {
  id: Uuid;
  studentId: Uuid;
  studentName: string;
  status: string | number;
  markedAtUtc: string;
  notes?: string | null;
}

export interface AttendanceSessionResponseDto {
  id: Uuid;
  courseId: Uuid;
  courseName: string;
  sessionDate: string;
  title: string;
  notes?: string | null;
  createdBy: UserSummaryDto;
  records: AttendanceRecordResponseDto[];
}

export interface CreateAttendanceSessionDto {
  courseId: Uuid;
  sessionDate: string;
  title: string;
  notes?: string | null;
  scheduleId?: number | null;
}

export interface AttendanceRecordItemDto {
  studentId: Uuid;
  status: AttendanceStatusValue;
  notes?: string | null;
}

export interface RecordAttendanceDto {
  attendanceSessionId: Uuid;
  records: AttendanceRecordItemDto[];
}

// ───────── Exams ─────────
export const QuestionType = {
  MultipleChoice: 0,
  TrueFalse: 1,
  ShortAnswer: 2,
  Essay: 3,
} as const;
export type QuestionTypeValue = number;

export const QUESTION_TYPE_LABEL_AR: Record<number, string> = {
  0: "اختيار من متعدد",
  1: "صح/خطأ",
  2: "إجابة قصيرة",
  3: "مقالي",
};

export interface ExamOptionResponseDto {
  id: number;
  questionId: number;
  optionText: string;
  optionOrder: number | string;
  isCorrect: boolean;
}

export interface ExamQuestionResponseDto {
  id: number;
  examId: number;
  questionText: string;
  questionType: string | number;
  points: number | string;
  questionOrder: number | string;
  imagePath?: string | null;
  options: ExamOptionResponseDto[];
}

export interface ExamResponseDto {
  id: number;
  courseId: Uuid;
  courseName: string;
  title: string;
  description?: string | null;
  durationMinutes: number | string;
  maxScore: number | string;
  passScore: number | string;
  startDate: string;
  endDate: string;
  maxAttempts: number | string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultAfterSubmit: boolean;
  isPublished: boolean;
  createdAt: string;
  createdBy: UserSummaryDto;
  questions: ExamQuestionResponseDto[];
}

export interface CreateExamOptionDto {
  optionText: string;
  isCorrect: boolean;
  optionOrder: number;
}

export interface CreateExamQuestionDto {
  questionText: string;
  questionType: QuestionTypeValue;
  points: number;
  questionOrder: number;
  imagePath?: string | null;
  options: CreateExamOptionDto[];
}

export interface CreateExamDto {
  courseId: Uuid;
  title: string;
  description?: string | null;
  durationMinutes: number;
  passScore: number;
  startDate: string;
  endDate: string;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultAfterSubmit: boolean;
  questions: CreateExamQuestionDto[];
}

export interface UpdateExamDto {
  title?: string | null;
  description?: string | null;
  durationMinutes?: number | null;
  passScore?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  maxAttempts?: number | null;
  isPublished?: boolean | null;
}

export interface ExamAnswerResponseDto {
  id: number;
  questionId: number;
  questionText: string;
  selectedOptionId?: number | null;
  selectedOptionText?: string | null;
  textAnswer?: string | null;
  isCorrect?: boolean | null;
  pointsEarned?: number | string | null;
  answeredAt: string;
}

export interface ExamAttemptResponseDto {
  id: number;
  examId: number;
  examTitle: string;
  studentId: Uuid;
  studentName: string;
  attemptNumber: number | string;
  startedAt: string;
  submittedAt?: string | null;
  score: number | string;
  maxScore: number | string;
  isPassed: boolean;
  status: string;
  answers?: ExamAnswerResponseDto[] | null;
}

export interface ExamAnswerItemDto {
  questionId: number;
  selectedOptionId?: number | null;
  textAnswer?: string | null;
}

export interface SubmitExamAnswersDto {
  attemptId: number;
  answers: ExamAnswerItemDto[];
}

// ───────── Live Sessions ─────────
export interface LiveSessionResponseDto {
  id: Uuid;
  courseId: Uuid;
  courseName: string;
  title: string;
  streamKey: string;
  status: string;
  scheduledAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
  viewerCount: number | string;
  recordedVideoId?: number | null;
  hostProfessor: UserSummaryDto;
}

export interface CreateLiveSessionDto {
  courseId: Uuid;
  title: string;
  scheduledAt: string;
}

// ───────── Enrollments ─────────
export interface EnrollmentResponseDto {
  id: number;
  studentId: Uuid;
  courseId: Uuid;
  student: UserSummaryDto;
  course: CourseSummaryDto;
  enrolledAt: string;
  isActive: boolean;
}

export interface CreateEnrollmentDto {
  courseId: Uuid;
}

// ───────── Messaging ─────────
export interface ConversationResponseDto {
  id: Uuid;
  lastMessageAt: string;
  otherUser: UserSummaryDto;
  lastMessage: string;
  unreadCount: number | string;
}

export interface MessageResponseDto {
  id: Uuid;
  conversationId: Uuid;
  content: string;
  attachmentPath?: string | null;
  isRead: boolean;
  readAt?: string | null;
  sentAt: string;
  sender: UserSummaryDto;
  isOwnMessage: boolean;
}

export interface SendMessageDto {
  recipientId: Uuid;
  content: string;
  attachmentPath?: string | null;
}

// ───────── Notifications ─────────
export interface NotificationResponseDto {
  id: number;
  title: string;
  message: string;
  notificationType: string;
  isRead: boolean;
  relatedEntityId?: number | null;
  createdAt: string;
  readAt?: string | null;
}

// ───────── helpers ─────────
export function asNumber(v: number | string | null | undefined, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] as const;

export function dayLabelToIndex(label: string): DayOfWeekArValue {
  if (!label) return 0 as DayOfWeekArValue;
  const idx = (ARABIC_DAYS as readonly string[]).indexOf(label);
  if (idx !== -1) return idx as DayOfWeekArValue;
  const map: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  };
  const k = label.toLowerCase().trim();
  return ((map[k] ?? Number(label) ?? 0) as number) as DayOfWeekArValue;
}

export function dayIndexToArabic(value: number | string): string {
  const i = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(i) && i >= 0 && i < 7) return ARABIC_DAYS[i];
  if (typeof value === "string" && (ARABIC_DAYS as readonly string[]).includes(value)) return value;
  return String(value || "—");
}
