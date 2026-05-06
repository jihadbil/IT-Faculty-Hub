import { useQuery } from "@tanstack/react-query";
import {
  adminApi,
  assessmentsApi,
  attendanceApi,
  coursesApi,
  departmentsApi,
  enrollmentsApi,
  examsApi,
  filesApi,
  liveSessionsApi,
  messagingApi,
  notificationsApi,
  usersApi,
  videosApi,
  type CourseSummaryDto,
  type CoursesQuery,
  type FilesQuery,
  type Uuid,
} from "@/lib/external-api";
import { useAuth } from "@/lib/auth";

export function useCoursesForRole(query: CoursesQuery = {}) {
  const { user } = useAuth();
  const role = user?.role ?? "student";

  return useQuery<CourseSummaryDto[]>({
    queryKey: ["external", "courses", role, query],
    queryFn: async () => {
      if (role === "teacher") return coursesApi.my();
      if (role === "student") return coursesApi.enrolled();
      const res = await coursesApi.list({ pageSize: 200, ...query });
      return res.items;
    },
    enabled: !!user,
  });
}

export function useAllCourses(query: CoursesQuery = {}) {
  return useQuery({
    queryKey: ["external", "courses", "all", query],
    queryFn: async () => {
      const res = await coursesApi.list({ pageSize: 200, ...query });
      return res.items;
    },
  });
}

export function useCourse(id: Uuid | undefined) {
  return useQuery({
    queryKey: ["external", "course", id],
    queryFn: () => coursesApi.get(id!),
    enabled: !!id,
  });
}

export function useCourseVideos(courseId: Uuid | undefined) {
  return useQuery({
    queryKey: ["external", "course", courseId, "videos"],
    queryFn: () => videosApi.list(courseId!),
    enabled: !!courseId,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["external", "users"],
    queryFn: () => usersApi.list(),
  });
}

// ───── New hooks for Phase 2 ─────

export function useAssessments(courseId: Uuid | undefined) {
  return useQuery({
    queryKey: ["external", "course", courseId, "assessments"],
    queryFn: () => assessmentsApi.list(courseId!),
    enabled: !!courseId,
  });
}

export function useAssessmentGrades(courseId: Uuid | undefined, assessmentId: number | null) {
  return useQuery({
    queryKey: ["external", "course", courseId, "assessment", assessmentId, "grades"],
    queryFn: () => assessmentsApi.grades(courseId!, assessmentId!),
    enabled: !!courseId && !!assessmentId,
  });
}

export function useMyGrades(courseId: Uuid | undefined) {
  return useQuery({
    queryKey: ["external", "course", courseId, "my-grades"],
    queryFn: () => assessmentsApi.myGrades(courseId!),
    enabled: !!courseId,
  });
}

export function useAttendanceSessions(courseId: Uuid | undefined) {
  return useQuery({
    queryKey: ["external", "course", courseId, "attendance"],
    queryFn: () => attendanceApi.listSessions(courseId!),
    enabled: !!courseId,
  });
}

export function useMyAttendanceRate(courseId: Uuid | undefined) {
  return useQuery({
    queryKey: ["external", "course", courseId, "my-attendance-rate"],
    queryFn: () => attendanceApi.myRate(courseId!),
    enabled: !!courseId,
  });
}

export function useExams(courseId: Uuid | undefined) {
  return useQuery({
    queryKey: ["external", "course", courseId, "exams"],
    queryFn: () => examsApi.list(courseId!),
    enabled: !!courseId,
  });
}

export function useMyExamAttempts(courseId: Uuid | undefined, examId: number | null) {
  return useQuery({
    queryKey: ["external", "course", courseId, "exam", examId, "my-attempts"],
    queryFn: () => examsApi.myAttempts(courseId!, examId!),
    enabled: !!courseId && !!examId,
  });
}

export function useLiveSessions(courseId: Uuid | undefined) {
  return useQuery({
    queryKey: ["external", "course", courseId, "live-sessions"],
    queryFn: () => liveSessionsApi.list(courseId!),
    enabled: !!courseId,
    refetchInterval: 15000,
  });
}

export function useEnrollmentsForCourse(courseId: Uuid | undefined) {
  return useQuery({
    queryKey: ["external", "course", courseId, "enrollments"],
    queryFn: () => enrollmentsApi.forCourse(courseId!),
    enabled: !!courseId,
  });
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: ["external", "enrollments", "my"],
    queryFn: () => enrollmentsApi.my(),
  });
}

export function useConversations() {
  return useQuery({
    queryKey: ["external", "messaging", "conversations"],
    queryFn: () => messagingApi.conversations(),
    refetchInterval: 30000,
  });
}

export function useMessages(conversationId: Uuid | null) {
  return useQuery({
    queryKey: ["external", "messaging", "conversation", conversationId, "messages"],
    queryFn: () => messagingApi.messages(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 5000,
  });
}

export function useUnreadMessageCount() {
  return useQuery({
    queryKey: ["external", "messaging", "unread-count"],
    queryFn: () => messagingApi.unreadCount(),
    refetchInterval: 30000,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["external", "notifications"],
    queryFn: () => notificationsApi.list(),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["external", "notifications", "unread-count"],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30000,
  });
}

// ───────── Files ─────────
export function useFiles(query: FilesQuery = {}) {
  return useQuery({
    queryKey: ["external", "files", query],
    queryFn: () => filesApi.list(query),
  });
}

export function useMyFiles(query: FilesQuery = {}) {
  return useQuery({
    queryKey: ["external", "files", "my", query],
    queryFn: () => filesApi.my(query),
  });
}

export function useCourseFiles(courseId: Uuid | undefined, query: FilesQuery = {}) {
  return useQuery({
    queryKey: ["external", "course", courseId, "files", query],
    queryFn: () => filesApi.listByCourse(courseId!, query),
    enabled: !!courseId,
  });
}

// ───────── Departments ─────────
export function useDepartments() {
  return useQuery({
    queryKey: ["external", "departments"],
    queryFn: () => departmentsApi.list(),
  });
}

// ───────── Admin ─────────
export function useAdminStats() {
  return useQuery({
    queryKey: ["external", "admin", "stats"],
    queryFn: () => adminApi.stats(),
  });
}

export function useStudentActivity(studentId: Uuid | undefined) {
  return useQuery({
    queryKey: ["external", "admin", "students", studentId, "activity"],
    queryFn: () => adminApi.studentActivity(studentId!),
    enabled: !!studentId,
  });
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const COURSE_PALETTE = [
  "#1e40af", "#0f766e", "#b45309", "#be123c", "#6d28d9",
  "#4338ca", "#0891b2", "#15803d", "#9d174d",
];

export function colorForCourse(id: string): string {
  return COURSE_PALETTE[hashStr(id) % COURSE_PALETTE.length];
}
