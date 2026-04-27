import { useQuery } from "@tanstack/react-query";
import { coursesApi, usersApi, videosApi, type CourseSummaryDto, type CoursesQuery, type Uuid } from "@/lib/external-api";
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

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const COURSE_PALETTE = [
  "#1e40af",
  "#0f766e",
  "#b45309",
  "#be123c",
  "#6d28d9",
  "#4338ca",
  "#0891b2",
  "#15803d",
  "#9d174d",
];

export function colorForCourse(id: string): string {
  return COURSE_PALETTE[hashStr(id) % COURSE_PALETTE.length];
}
