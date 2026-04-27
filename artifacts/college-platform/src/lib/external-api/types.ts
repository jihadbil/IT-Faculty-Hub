export type Uuid = string;

export interface UserSummaryDto {
  id: Uuid;
  fullName: string;
  email: string;
  profileImageUrl?: string | null;
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
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  profileImageUrl?: string | null;
  preferredLanguage?: string;
}

export interface ScheduleResponseDto {
  id: number;
  courseId: Uuid;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string | null;
  building?: string | null;
}

export interface CreateScheduleDto {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  building?: string;
}

export interface UpdateScheduleDto extends CreateScheduleDto {}

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

export interface CreateCourseDto {
  courseCode: string;
  courseName: string;
  description?: string;
  department: string;
  credits?: number;
  semester?: string;
  academicYear: string;
  professorId?: Uuid;
}

export interface UpdateCourseDto extends Partial<CreateCourseDto> {}

export interface PagedResult<T> {
  items: T[];
  totalCount: number | string;
  page: number | string;
  pageSize: number | string;
  totalPages: number | string;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface VideoLectureResponseDto {
  id: number;
  courseId: Uuid;
  title: string;
  description?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  videoOrder: number | string;
  durationSeconds?: number | string | null;
  viewCount?: number | string;
  isPublished: boolean;
  createdAtUtc: string;
}

export interface UpdateVideoLectureDto {
  title?: string;
  description?: string;
  videoOrder?: number;
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

export function asNumber(v: number | string | null | undefined, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}
