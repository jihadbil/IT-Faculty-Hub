import { apiClient } from "./client";
import type {
  AuthResponseDto,
  CourseResponseDto,
  CourseSummaryDto,
  CoursesQuery,
  CreateCourseDto,
  CreateScheduleDto,
  CreateVideoLectureForm,
  LoginRequestDto,
  PagedResult,
  RegisterRequestDto,
  ScheduleResponseDto,
  UpdateCourseDto,
  UpdateProfileDto,
  UpdateScheduleDto,
  UpdateVideoLectureDto,
  UserResponseDto,
  Uuid,
  VideoLectureResponseDto,
} from "./types";

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

export const usersApi = {
  me: () => apiClient.get<UserResponseDto>("/api/users/me"),
  updateMe: (body: UpdateProfileDto) =>
    apiClient.put<UserResponseDto>("/api/users/me", { body }),
  list: () => apiClient.get<UserResponseDto[]>("/api/users"),
  getById: (id: Uuid) => apiClient.get<UserResponseDto>(`/api/users/${id}`),
  rolesOf: (id: Uuid) => apiClient.get<string[]>(`/api/users/${id}/roles`),
  activate: (id: Uuid) => apiClient.post<void>(`/api/users/${id}/activate`),
  deactivate: (id: Uuid) => apiClient.post<void>(`/api/users/${id}/deactivate`),
};

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

export const schedulesApi = {
  create: (courseId: Uuid, body: CreateScheduleDto) =>
    apiClient.post<ScheduleResponseDto>(`/api/courses/${courseId}/schedules`, { body }),
  update: (courseId: Uuid, sid: number, body: UpdateScheduleDto) =>
    apiClient.put<ScheduleResponseDto>(`/api/courses/${courseId}/schedules/${sid}`, { body }),
  remove: (courseId: Uuid, sid: number) =>
    apiClient.del<void>(`/api/courses/${courseId}/schedules/${sid}`),
};

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
