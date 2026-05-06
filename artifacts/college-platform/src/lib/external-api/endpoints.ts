import { apiClient } from "./client";
import type {
  AdminStatsResponseDto,
  AssessmentResponseDto,
  AttendanceSessionResponseDto,
  AuthResponseDto,
  ConversationResponseDto,
  CourseFileResponseDto,
  CourseResponseDto,
  CourseSummaryDto,
  CoursesQuery,
  CreateAssessmentDto,
  CreateAttendanceSessionDto,
  CreateCourseDto,
  CreateDepartmentDto,
  CreateEnrollmentDto,
  CreateExamDto,
  CreateGradeDto,
  CreateLiveSessionDto,
  CreateScheduleDto,
  CreateStudentDto,
  CreateTeacherDto,
  CreateVideoLectureForm,
  DepartmentResponseDto,
  EnrollmentResponseDto,
  ExamAttemptResponseDto,
  ExamResponseDto,
  FilesQuery,
  GradeResponseDto,
  LiveSessionResponseDto,
  LoginRequestDto,
  MessageResponseDto,
  NotificationResponseDto,
  PagedResult,
  RecordAttendanceDto,
  RegisterRequestDto,
  ScheduleResponseDto,
  SendMessageDto,
  StudentActivityDto,
  SubmitExamAnswersDto,
  UpdateAssessmentDto,
  UpdateCourseDto,
  UpdateCourseFileDto,
  UpdateDepartmentDto,
  UpdateExamDto,
  UpdateGradeDto,
  UpdateProfileDto,
  UpdateScheduleDto,
  UpdateStudentDto,
  UpdateTeacherDto,
  UpdateVideoLectureDto,
  UserResponseDto,
  Uuid,
  VideoLectureResponseDto,
} from "./types";

// ───────── Auth ─────────
export const authApi = {
  login: (body: LoginRequestDto) =>
    apiClient.post<AuthResponseDto>("/api/auth/login", { body, auth: false }),
  register: (body: RegisterRequestDto) =>
    apiClient.post<AuthResponseDto>("/api/auth/register", { body, auth: false }),
  logout: () => apiClient.post<void>("/api/auth/logout"),
  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponseDto>("/api/auth/refresh", {
      rawJsonBody: JSON.stringify(refreshToken),
      auth: false,
    }),
};

// ───────── Users ─────────
export const usersApi = {
  me: () => apiClient.get<UserResponseDto>("/api/users/me"),
  updateMe: (body: UpdateProfileDto) =>
    apiClient.put<UserResponseDto>("/api/users/me", { body }),
  list: () => apiClient.get<UserResponseDto[]>("/api/users"),
  getById: (id: Uuid) => apiClient.get<UserResponseDto>(`/api/users/${id}`),
  rolesOf: (id: Uuid) => apiClient.get<string[]>(`/api/users/${id}/roles`),
  activate: (id: Uuid) => apiClient.put<void>(`/api/users/${id}/activate`),
  deactivate: (id: Uuid) => apiClient.put<void>(`/api/users/${id}/deactivate`),
};

// ───────── Courses ─────────
export const coursesApi = {
  list: (q: CoursesQuery = {}) =>
    apiClient.get<PagedResult<CourseSummaryDto>>("/api/courses", { query: q }),
  my: () => apiClient.get<CourseSummaryDto[]>("/api/courses/my"),
  enrolled: () => apiClient.get<CourseSummaryDto[]>("/api/courses/enrolled"),
  get: (id: Uuid) => apiClient.get<CourseResponseDto>(`/api/courses/${id}`),
  create: (body: CreateCourseDto) =>
    apiClient.post<CourseResponseDto>("/api/courses", { body }),
  update: (id: Uuid, body: UpdateCourseDto) =>
    apiClient.put<CourseResponseDto>(`/api/courses/${id}`, { body }),
  remove: (id: Uuid) => apiClient.del<void>(`/api/courses/${id}`),
};

// ───────── Schedules ─────────
export const schedulesApi = {
  create: (courseId: Uuid, body: CreateScheduleDto) =>
    apiClient.post<ScheduleResponseDto>(`/api/courses/${courseId}/schedules`, { body }),
  update: (courseId: Uuid, sid: number, body: UpdateScheduleDto) =>
    apiClient.put<ScheduleResponseDto>(`/api/courses/${courseId}/schedules/${sid}`, { body }),
  remove: (courseId: Uuid, sid: number) =>
    apiClient.del<void>(`/api/courses/${courseId}/schedules/${sid}`),
};

// ───────── Videos ─────────
export const videosApi = {
  list: (courseId: Uuid) =>
    apiClient.get<VideoLectureResponseDto[]>(`/api/courses/${courseId}/videos`),
  get: (courseId: Uuid, id: number) =>
    apiClient.get<VideoLectureResponseDto>(`/api/courses/${courseId}/videos/${id}`),
  create: (courseId: Uuid, form: CreateVideoLectureForm) => {
    const fd = new FormData();
    fd.append("CourseId", courseId);
    fd.append("Title", form.title);
    if (form.description) fd.append("Description", form.description);
    fd.append("VideoOrder", String(form.videoOrder));
    fd.append("Video", form.video);
    if (form.thumbnail) fd.append("Thumbnail", form.thumbnail);
    return apiClient.post<VideoLectureResponseDto>(`/api/courses/${courseId}/videos`, {
      formData: fd,
    });
  },
  update: (courseId: Uuid, id: number, body: UpdateVideoLectureDto) =>
    apiClient.put<VideoLectureResponseDto>(`/api/courses/${courseId}/videos/${id}`, { body }),
  remove: (courseId: Uuid, id: number) =>
    apiClient.del<void>(`/api/courses/${courseId}/videos/${id}`),
  publish: (courseId: Uuid, id: number) =>
    apiClient.put<void>(`/api/courses/${courseId}/videos/${id}/publish`),
  view: (courseId: Uuid, id: number) =>
    apiClient.post<void>(`/api/courses/${courseId}/videos/${id}/view`),
};

// ───────── Assessments + Grades ─────────
export const assessmentsApi = {
  list: (courseId: Uuid) =>
    apiClient.get<AssessmentResponseDto[]>(`/api/courses/${courseId}/assessments`),
  create: (courseId: Uuid, body: CreateAssessmentDto) =>
    apiClient.post<AssessmentResponseDto>(`/api/courses/${courseId}/assessments`, { body }),
  get: (courseId: Uuid, id: number) =>
    apiClient.get<AssessmentResponseDto>(`/api/courses/${courseId}/assessments/${id}`),
  update: (courseId: Uuid, id: number, body: UpdateAssessmentDto) =>
    apiClient.put<AssessmentResponseDto>(`/api/courses/${courseId}/assessments/${id}`, { body }),
  remove: (courseId: Uuid, id: number) =>
    apiClient.del<void>(`/api/courses/${courseId}/assessments/${id}`),
  grades: (courseId: Uuid, id: number) =>
    apiClient.get<GradeResponseDto[]>(`/api/courses/${courseId}/assessments/${id}/grades`),
  addGrade: (courseId: Uuid, id: number, body: CreateGradeDto) =>
    apiClient.post<GradeResponseDto>(`/api/courses/${courseId}/assessments/${id}/grades`, { body }),
  updateGrade: (courseId: Uuid, id: number, gradeId: number, body: UpdateGradeDto) =>
    apiClient.put<GradeResponseDto>(
      `/api/courses/${courseId}/assessments/${id}/grades/${gradeId}`,
      { body },
    ),
  averageGrades: (courseId: Uuid) =>
    apiClient.get<{ assessmentId: number; assessmentTitle: string; average: number }[]>(
      `/api/courses/${courseId}/assessments/grades/average`,
    ),
  myGrades: (courseId: Uuid) =>
    apiClient.get<GradeResponseDto[]>(`/api/courses/${courseId}/assessments/grades/student`),
};

// ───────── Attendance ─────────
export const attendanceApi = {
  listSessions: (courseId: Uuid) =>
    apiClient.get<AttendanceSessionResponseDto[]>(`/api/courses/${courseId}/attendance`),
  createSession: (courseId: Uuid, body: CreateAttendanceSessionDto) =>
    apiClient.post<AttendanceSessionResponseDto>(`/api/courses/${courseId}/attendance`, { body }),
  getSession: (courseId: Uuid, sessionId: Uuid) =>
    apiClient.get<AttendanceSessionResponseDto>(
      `/api/courses/${courseId}/attendance/${sessionId}`,
    ),
  recordSession: (courseId: Uuid, sessionId: Uuid, body: RecordAttendanceDto) =>
    apiClient.post<AttendanceSessionResponseDto>(
      `/api/courses/${courseId}/attendance/${sessionId}/record`,
      { body },
    ),
  myRate: (courseId: Uuid) =>
    apiClient.get<{ rate: number; total: number; present: number }>(
      `/api/courses/${courseId}/attendance/my-rate`,
    ),
  myRecords: (courseId: Uuid) =>
    apiClient.get<AttendanceSessionResponseDto[]>(
      `/api/courses/${courseId}/attendance/my-records`,
    ),
};

// ───────── Exams ─────────
export const examsApi = {
  list: (courseId: Uuid) =>
    apiClient.get<ExamResponseDto[]>(`/api/courses/${courseId}/exams`),
  create: (courseId: Uuid, body: CreateExamDto) =>
    apiClient.post<ExamResponseDto>(`/api/courses/${courseId}/exams`, { body }),
  get: (courseId: Uuid, id: number) =>
    apiClient.get<ExamResponseDto>(`/api/courses/${courseId}/exams/${id}`),
  update: (courseId: Uuid, id: number, body: UpdateExamDto) =>
    apiClient.put<ExamResponseDto>(`/api/courses/${courseId}/exams/${id}`, { body }),
  remove: (courseId: Uuid, id: number) =>
    apiClient.del<void>(`/api/courses/${courseId}/exams/${id}`),
  publish: (courseId: Uuid, id: number) =>
    apiClient.put<void>(`/api/courses/${courseId}/exams/${id}/publish`),
  startAttempt: (courseId: Uuid, id: number) =>
    apiClient.post<ExamAttemptResponseDto>(`/api/courses/${courseId}/exams/${id}/attempts`),
  listAttempts: (courseId: Uuid, id: number) =>
    apiClient.get<ExamAttemptResponseDto[]>(`/api/courses/${courseId}/exams/${id}/attempts`),
  myAttempts: (courseId: Uuid, id: number) =>
    apiClient.get<ExamAttemptResponseDto[]>(`/api/courses/${courseId}/exams/${id}/attempts/my`),
  submitAttempt: (courseId: Uuid, id: number, body: SubmitExamAnswersDto) =>
    apiClient.put<ExamAttemptResponseDto>(
      `/api/courses/${courseId}/exams/${id}/attempts/submit`,
      { body },
    ),
};

// ───────── Live Sessions ─────────
export const liveSessionsApi = {
  list: (courseId: Uuid) =>
    apiClient.get<LiveSessionResponseDto[]>(`/api/courses/${courseId}/live-sessions`),
  create: (courseId: Uuid, body: CreateLiveSessionDto) =>
    apiClient.post<LiveSessionResponseDto>(`/api/courses/${courseId}/live-sessions`, { body }),
  get: (courseId: Uuid, id: Uuid) =>
    apiClient.get<LiveSessionResponseDto>(`/api/courses/${courseId}/live-sessions/${id}`),
  start: (courseId: Uuid, id: Uuid) =>
    apiClient.put<LiveSessionResponseDto>(`/api/courses/${courseId}/live-sessions/${id}/start`),
  end: (courseId: Uuid, id: Uuid) =>
    apiClient.put<LiveSessionResponseDto>(`/api/courses/${courseId}/live-sessions/${id}/end`),
  join: (courseId: Uuid, id: Uuid) =>
    apiClient.post<LiveSessionResponseDto>(`/api/courses/${courseId}/live-sessions/${id}/join`),
  leave: (courseId: Uuid, id: Uuid) =>
    apiClient.post<void>(`/api/courses/${courseId}/live-sessions/${id}/leave`),
};

// ───────── Enrollments ─────────
export const enrollmentsApi = {
  enroll: (body: CreateEnrollmentDto) =>
    apiClient.post<EnrollmentResponseDto>("/api/enrollments", { body }),
  my: () => apiClient.get<EnrollmentResponseDto[]>("/api/enrollments/my"),
  check: (courseId: Uuid) =>
    apiClient.get<{ isEnrolled: boolean }>(`/api/enrollments/check/${courseId}`),
  forCourse: (courseId: Uuid) =>
    apiClient.get<EnrollmentResponseDto[]>(`/api/enrollments/course/${courseId}`),
  unenroll: (courseId: Uuid) => apiClient.del<void>(`/api/enrollments/${courseId}`),
  unenrollStudent: (courseId: Uuid, studentId: Uuid) =>
    apiClient.del<void>(`/api/enrollments/${courseId}/students/${studentId}`),
};

// ───────── Messaging ─────────
export const messagingApi = {
  conversations: () =>
    apiClient.get<ConversationResponseDto[]>("/api/messaging/conversations"),
  startConversation: (recipientId: Uuid) =>
    apiClient.post<ConversationResponseDto>("/api/messaging/conversations", {
      body: { recipientId },
    }),
  messages: (conversationId: Uuid, page = 1, pageSize = 50) =>
    apiClient.get<PagedResult<MessageResponseDto>>(
      `/api/messaging/conversations/${conversationId}/messages`,
      { query: { page, pageSize } },
    ),
  markRead: (conversationId: Uuid) =>
    apiClient.put<void>(`/api/messaging/conversations/${conversationId}/read`),
  send: (body: SendMessageDto) =>
    apiClient.post<MessageResponseDto>("/api/messaging/messages", { body }),
  unreadCount: () =>
    apiClient.get<{ count: number }>("/api/messaging/unread-count"),
};

// ───────── Notifications ─────────
export const notificationsApi = {
  list: () => apiClient.get<NotificationResponseDto[]>("/api/notifications"),
  unreadCount: () =>
    apiClient.get<{ count: number }>("/api/notifications/unread-count"),
  markRead: (id: number) => apiClient.put<void>(`/api/notifications/${id}/read`),
  markAllRead: () => apiClient.put<void>("/api/notifications/read-all"),
};

// ───────── Files ─────────
export const filesApi = {
  list: (query: FilesQuery = {}) =>
    apiClient.get<PagedResult<CourseFileResponseDto>>("/api/files", { query }),
  my: (query: FilesQuery = {}) =>
    apiClient.get<PagedResult<CourseFileResponseDto>>("/api/files/my", { query }),
  get: (id: number) =>
    apiClient.get<CourseFileResponseDto>(`/api/files/${id}`),
  update: (id: number, body: UpdateCourseFileDto) =>
    apiClient.put<CourseFileResponseDto>(`/api/files/${id}`, { body }),
  delete: (id: number) => apiClient.del<void>(`/api/files/${id}`),
  download: (id: number) =>
    apiClient.get<CourseFileResponseDto>(`/api/files/${id}/download`),
  uploadToCourse: (courseId: Uuid, form: FormData) =>
    apiClient.post<CourseFileResponseDto>(`/api/courses/${courseId}/files`, { formData: form }),
  listByCourse: (courseId: Uuid, query: FilesQuery = {}) =>
    apiClient.get<PagedResult<CourseFileResponseDto>>(`/api/courses/${courseId}/files`, { query }),
};

// ───────── Departments ─────────
export const departmentsApi = {
  list: () => apiClient.get<DepartmentResponseDto[]>("/api/departments"),
  get: (id: Uuid) => apiClient.get<DepartmentResponseDto>(`/api/departments/${id}`),
  create: (body: CreateDepartmentDto) =>
    apiClient.post<DepartmentResponseDto>("/api/departments", { body }),
  update: (id: Uuid, body: UpdateDepartmentDto) =>
    apiClient.put<DepartmentResponseDto>(`/api/departments/${id}`, { body }),
  delete: (id: Uuid) => apiClient.del<void>(`/api/departments/${id}`),
};

// ───────── Admin ─────────
export const adminApi = {
  stats: () => apiClient.get<AdminStatsResponseDto>("/api/admin/stats"),
  createTeacher: (body: CreateTeacherDto) =>
    apiClient.post<UserResponseDto>("/api/admin/teachers", { body }),
  updateTeacher: (id: Uuid, body: UpdateTeacherDto) =>
    apiClient.put<UserResponseDto>(`/api/admin/teachers/${id}`, { body }),
  deleteTeacher: (id: Uuid) => apiClient.del<void>(`/api/admin/teachers/${id}`),
  createStudent: (body: CreateStudentDto) =>
    apiClient.post<UserResponseDto>("/api/admin/students", { body }),
  updateStudent: (id: Uuid, body: UpdateStudentDto) =>
    apiClient.put<UserResponseDto>(`/api/admin/students/${id}`, { body }),
  deleteStudent: (id: Uuid) => apiClient.del<void>(`/api/admin/students/${id}`),
  studentActivity: (id: Uuid) =>
    apiClient.get<StudentActivityDto>(`/api/admin/students/${id}/activity`),
};
