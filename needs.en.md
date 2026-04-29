# Missing API Requirements to Complete the Platform

> This document lists all backend endpoints missing from the current `EducationalPlatformAPI` that the `college-platform` frontend needs in order to fully enable the six remaining stubbed pages.
> DTOs are written in C# / .NET style consistent with the rest of the API. Encoding: `application/json` with `camelCase`.

---

## 1) File Library (Files) — for Teacher and Student

Used by: `/files`, `/student/files`, and the Files tab inside the course page.

### Endpoints

| Method | Path | Authorization | Description |
|---|---|---|---|
| `GET` | `/api/files` | Admin / Teacher | All files in the system (with paging + filters) |
| `GET` | `/api/courses/{courseId}/files` | Any role (if enrolled or teaching) | Files of a single course |
| `POST` | `/api/courses/{courseId}/files` | Teacher / Admin | Upload a new file (multipart/form-data) |
| `GET` | `/api/files/{id}` | Per role | Single file details |
| `PUT` | `/api/files/{id}` | Teacher (owner) / Admin | Update title / description / category |
| `DELETE` | `/api/files/{id}` | Teacher (owner) / Admin | Delete file |
| `GET` | `/api/files/{id}/download` | Per role | Download file (returns the file directly or a signed URL) |
| `GET` | `/api/files/my` | Student | All files in courses the student is enrolled in |

### Query Parameters for `GET /api/files` and `GET /api/files/my`

```
courseId   : Guid?     (filter by course)
category   : string?   (Lecture | Assignment | Reference | Syllabus | Other)
search     : string?   (search in title / file name)
page       : int = 1
pageSize   : int = 20
```

### DTOs

```csharp
// Response
public class FileResponseDto {
    public int Id { get; set; }
    public Guid CourseId { get; set; }
    public string CourseName { get; set; }      // convenience for global lists
    public string Title { get; set; }
    public string? Description { get; set; }
    public string FileName { get; set; }        // original name
    public long FileSize { get; set; }          // bytes
    public string ContentType { get; set; }     // MIME (application/pdf, ...)
    public string Category { get; set; }        // see enum above
    public string DownloadUrl { get; set; }     // direct or signed URL
    public int Downloads { get; set; }          // download counter
    public DateTime UploadedAt { get; set; }
    public UserSummaryDto UploadedBy { get; set; }
}

// Request - POST (multipart/form-data)
public class CreateFileForm {
    public IFormFile File { get; set; }
    public string Title { get; set; }
    public string? Description { get; set; }
    public string Category { get; set; }
}

// Request - PUT
public class UpdateFileDto {
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
}

// Response for GET /api/files (global)
PagedResult<FileResponseDto>
```

---

## 2) Departments

Used by: `/admin/departments`.

### Endpoints

| Method | Path | Authorization |
|---|---|---|
| `GET` | `/api/departments` | Any (authenticated) |
| `GET` | `/api/departments/{id}` | Any |
| `POST` | `/api/departments` | Admin |
| `PUT` | `/api/departments/{id}` | Admin |
| `DELETE` | `/api/departments/{id}` | Admin |

### DTOs

```csharp
public class DepartmentResponseDto {
    public int Id { get; set; }
    public string Name { get; set; }            // "Software Engineering"
    public string Code { get; set; }            // "SE"
    public string? Description { get; set; }
    public int CoursesCount { get; set; }       // computed
    public int TeachersCount { get; set; }      // computed
    public int StudentsCount { get; set; }      // computed
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateDepartmentDto {
    public string Name { get; set; }
    public string Code { get; set; }
    public string? Description { get; set; }
}

public class UpdateDepartmentDto {
    public string? Name { get; set; }
    public string? Code { get; set; }
    public string? Description { get; set; }
}
```

> **Note:** It is preferable to later update `CourseResponseDto`, `CreateCourseDto`, and `UpdateCourseDto` so that the `Department` field becomes a reference (`DepartmentId: int` + `Department: DepartmentResponseDto`) instead of a free-text string. You may keep the free-text field initially to avoid breaking compatibility.

---

## 3) Teacher and Student Account Management (Admin)

Used by: `/admin/teachers`, `/admin/students`.

### Endpoints

| Method | Path | Authorization | Description |
|---|---|---|---|
| `POST` | `/api/admin/teachers` | Admin | Create a teacher account and assign a department |
| `PUT` | `/api/admin/teachers/{id}` | Admin | Update teacher info + department |
| `DELETE` | `/api/admin/teachers/{id}` | Admin | Delete a teacher |
| `POST` | `/api/admin/students` | Admin | Create a student account |
| `PUT` | `/api/admin/students/{id}` | Admin | Update a student |
| `DELETE` | `/api/admin/students/{id}` | Admin | Delete a student |
| `GET` | `/api/admin/students/{id}/activity` | Admin | Student activity log |

### DTOs

```csharp
public class CreateTeacherDto {
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }        // initial password
    public string? PhoneNumber { get; set; }
    public int? DepartmentId { get; set; }      // or string Department
    public string? Title { get; set; }          // Assistant Professor, Professor, ...
    public string? Bio { get; set; }
}

public class UpdateTeacherDto {
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public int? DepartmentId { get; set; }
    public string? Title { get; set; }
    public string? Bio { get; set; }
}

public class CreateStudentDto {
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    public string? PhoneNumber { get; set; }
    public string? StudentNumber { get; set; }  // university ID
    public int? DepartmentId { get; set; }
    public int? EnrollmentYear { get; set; }
}

public class UpdateStudentDto {
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? StudentNumber { get; set; }
    public int? DepartmentId { get; set; }
}

public class StudentActivityDto {
    public Guid StudentId { get; set; }
    public string FullName { get; set; }
    public int EnrolledCoursesCount { get; set; }
    public int VideosWatched { get; set; }
    public int FilesDownloaded { get; set; }
    public int ExamsTaken { get; set; }
    public double AverageGrade { get; set; }
    public double AverageAttendanceRate { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public List<RecentActivityItemDto> RecentActivity { get; set; }
}

public class RecentActivityItemDto {
    public string Type { get; set; }            // VideoView | FileDownload | ExamSubmit | Login | ...
    public string Description { get; set; }     // "Watched lecture: Intro to Algorithms"
    public Guid? CourseId { get; set; }
    public string? CourseName { get; set; }
    public DateTime At { get; set; }
}
```

> POST/PUT **responses** must return the same `UserResponseDto` used elsewhere in the API.

---

## 4) Admin Dashboard Statistics

Used by: `/admin`.

### Endpoint

| Method | Path | Authorization |
|---|---|---|
| `GET` | `/api/admin/stats` | Admin |

### DTOs

```csharp
public class AdminStatsResponseDto {
    public int TotalDepartments { get; set; }
    public int TotalTeachers { get; set; }
    public int TotalStudents { get; set; }
    public int ActiveStudents { get; set; }
    public int TotalCourses { get; set; }
    public int ActiveCourses { get; set; }
    public int TotalEnrollments { get; set; }
    public int TotalVideoLectures { get; set; }
    public int TotalVideoViews { get; set; }
    public int TotalFiles { get; set; }
    public int TotalExams { get; set; }
    public int TotalLiveSessions { get; set; }
    public int UnreadAdminNotifications { get; set; }

    // Optional but improves the dashboard:
    public List<TopCourseStatDto> TopCoursesByEnrollment { get; set; }   // top 5
    public List<TopCourseStatDto> TopCoursesByViews { get; set; }
    public List<DailyStatDto> EnrollmentsLast30Days { get; set; }
    public List<DailyStatDto> VideoViewsLast30Days { get; set; }
}

public class TopCourseStatDto {
    public Guid CourseId { get; set; }
    public string CourseName { get; set; }
    public string CourseCode { get; set; }
    public int Value { get; set; }              // count (enrollments or views)
}

public class DailyStatDto {
    public DateOnly Date { get; set; }          // YYYY-MM-DD
    public int Count { get; set; }
}
```

---

## 5) Optional Improvements (Better UX)

### 5.1 Session type field on the schedule
Add to `ScheduleResponseDto` and `CreateScheduleDto`:

```csharp
public string Type { get; set; }   // Lecture | Lab | Tutorial | Exam
```

### 5.2 Course color / banner
Add to `CourseResponseDto`, `UpdateCourseDto`, and `CreateCourseDto`:

```csharp
public string? ColorHex { get; set; }      // e.g. "#1e40af"
public string? BannerImageUrl { get; set; }
```

---

## Implementation Notes

1. **Encoding:** `application/json` only, responses in camelCase (the frontend already consumes camelCase).
2. **Paging:** Reuse the existing `PagedResult<T>` envelope already used by the API.
3. **Auth:** All endpoints require JWT Bearer (same middleware). Add `[Authorize(Roles = "Admin")]` to admin endpoints.
4. **File Uploads:** Store under `wwwroot/uploads/files/{courseId}/{guid}.{ext}` and return `DownloadUrl` as a relative or absolute path — same pattern used today for video lectures.
5. **Deletion:** Prefer soft-delete (an `IsDeleted` flag) for sensitive tables (Files, Departments) instead of physical deletion.
6. **Validation Errors:** Use ProblemDetails (RFC 7807), as the rest of the API does.
7. **Dates:** ISO 8601 UTC.

---

## Suggested Implementation Order (easiest → hardest)

1. ✅ **Departments** — simplest CRUD; unlocks `/admin/departments`.
2. ✅ **Admin Stats** — single endpoint; instantly improves the admin dashboard.
3. ✅ **Files** — most impactful missing feature; unlocks two full pages.
4. ✅ **Admin Teachers/Students CRUD** — completes the admin experience.
5. ✅ **Student Activity** — optional; depends on having an activity log.
6. 🔧 Optional fields (Schedule.Type, Course.ColorHex / BannerImageUrl).

---

> Once any group is ready, just send the updated OpenAPI file (or even just the names), and the frontend pages will be wired to the new endpoints in the same session, without breaking any existing page.
