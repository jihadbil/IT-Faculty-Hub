# متطلبات الـ API الناقصة لإكمال الموقع

> هذه القائمة تحدّد كل نقاط النهاية الناقصة من ملف `EducationalPlatformAPI` الحالي والتي يحتاجها موقع `college-platform` لتفعيل الصفحات الست المتبقية.
> الـ DTOs مكتوبة بنمط C# / .NET متوافق مع باقي الـ API. الترميز: `application/json` بـ `camelCase`.

---

## 1) مكتبة الملفات (Files) — للأستاذ والطالب

تخصّ الصفحات: `/files`, `/student/files`, وتبويب الملفات داخل صفحة المادة.

### الـ Endpoints

| Method | Path | الصلاحية | الوصف |
|---|---|---|---|
| `GET` | `/api/files` | Admin / Teacher | كل الملفات في النظام (مع Paging + فلاتر) |
| `GET` | `/api/courses/{courseId}/files` | كل الأدوار (إذا مسجّل أو يدرّس) | ملفات مادة واحدة |
| `POST` | `/api/courses/{courseId}/files` | Teacher / Admin | رفع ملف جديد (multipart/form-data) |
| `GET` | `/api/files/{id}` | حسب الصلاحية | تفاصيل ملف واحد |
| `PUT` | `/api/files/{id}` | Teacher (المالك) / Admin | تعديل العنوان/الوصف/الفئة |
| `DELETE` | `/api/files/{id}` | Teacher (المالك) / Admin | حذف ملف |
| `GET` | `/api/files/{id}/download` | حسب الصلاحية | تنزيل الملف (يعيد الملف مباشرةً أو رابط مؤقت) |
| `GET` | `/api/files/my` | Student | كل الملفات في موادي المسجّل بها |

### Query Parameters لـ `GET /api/files` و `GET /api/files/my`

```
courseId   : Guid?     (فلترة بالمادة)
category   : string?   (Lecture | Assignment | Reference | Syllabus | Other)
search     : string?   (بحث في العنوان/اسم الملف)
page       : int = 1
pageSize   : int = 20
```

### DTOs

```csharp
// Response
public class FileResponseDto {
    public int Id { get; set; }
    public Guid CourseId { get; set; }
    public string CourseName { get; set; }      // للراحة في القوائم العامة
    public string Title { get; set; }
    public string? Description { get; set; }
    public string FileName { get; set; }        // الاسم الأصلي
    public long FileSize { get; set; }          // بالبايت
    public string ContentType { get; set; }     // MIME (application/pdf, ...)
    public string Category { get; set; }        // enum أعلاه
    public string DownloadUrl { get; set; }     // رابط مباشر أو مُوقَّع
    public int Downloads { get; set; }          // عدد التنزيلات
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

// Response لـ GET /api/files (عام)
PagedResult<FileResponseDto>
```

---

## 2) الأقسام (Departments)

تخصّ الصفحة: `/admin/departments`.

### الـ Endpoints

| Method | Path | الصلاحية |
|---|---|---|
| `GET` | `/api/departments` | الكل (مصادق) |
| `GET` | `/api/departments/{id}` | الكل |
| `POST` | `/api/departments` | Admin |
| `PUT` | `/api/departments/{id}` | Admin |
| `DELETE` | `/api/departments/{id}` | Admin |

### DTOs

```csharp
public class DepartmentResponseDto {
    public int Id { get; set; }
    public string Name { get; set; }            // "هندسة البرمجيات"
    public string Code { get; set; }            // "SE"
    public string? Description { get; set; }
    public int CoursesCount { get; set; }       // محسوب
    public int TeachersCount { get; set; }      // محسوب
    public int StudentsCount { get; set; }      // محسوب
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

> **ملاحظة:** يفضّل لاحقاً تحديث `CourseResponseDto` و `CreateCourseDto` و `UpdateCourseDto` ليصبح حقل `Department` مرجعاً (`DepartmentId: int` + `Department: DepartmentResponseDto`) بدلاً من نص حر. يمكن البقاء مع النص الحر في البداية لتفادي كسر التوافق.

---

## 3) إدارة حسابات الأساتذة والطلاب (Admin)

تخصّ الصفحات: `/admin/teachers`, `/admin/students`.

### الـ Endpoints

| Method | Path | الصلاحية | الوصف |
|---|---|---|---|
| `POST` | `/api/admin/teachers` | Admin | إنشاء حساب أستاذ مع تعيين القسم |
| `PUT` | `/api/admin/teachers/{id}` | Admin | تعديل بيانات أستاذ + القسم |
| `DELETE` | `/api/admin/teachers/{id}` | Admin | حذف أستاذ |
| `POST` | `/api/admin/students` | Admin | إنشاء حساب طالب |
| `PUT` | `/api/admin/students/{id}` | Admin | تعديل طالب |
| `DELETE` | `/api/admin/students/{id}` | Admin | حذف طالب |
| `GET` | `/api/admin/students/{id}/activity` | Admin | سجلّ نشاط طالب |

### DTOs

```csharp
public class CreateTeacherDto {
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }        // initial password
    public string? PhoneNumber { get; set; }
    public int? DepartmentId { get; set; }      // أو string Department
    public string? Title { get; set; }          // أستاذ مساعد، أستاذ دكتور...
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
    public string? StudentNumber { get; set; }  // الرقم الجامعي
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
    public string Description { get; set; }     // "شاهد محاضرة مقدمة الخوارزميات"
    public Guid? CourseId { get; set; }
    public string? CourseName { get; set; }
    public DateTime At { get; set; }
}
```

> الـ **Response** لـ POST/PUT يجب أن يعيد `UserResponseDto` نفسها المستعملة في باقي الـ API.

---

## 4) إحصائيات لوحة المدير

تخصّ الصفحة: `/admin`.

### الـ Endpoint

| Method | Path | الصلاحية |
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

    // اختياري لكنه يجمّل اللوحة:
    public List<TopCourseStatDto> TopCoursesByEnrollment { get; set; }   // أعلى 5
    public List<TopCourseStatDto> TopCoursesByViews { get; set; }
    public List<DailyStatDto> EnrollmentsLast30Days { get; set; }
    public List<DailyStatDto> VideoViewsLast30Days { get; set; }
}

public class TopCourseStatDto {
    public Guid CourseId { get; set; }
    public string CourseName { get; set; }
    public string CourseCode { get; set; }
    public int Value { get; set; }              // العدد (تسجيلات أو مشاهدات)
}

public class DailyStatDto {
    public DateOnly Date { get; set; }          // YYYY-MM-DD
    public int Count { get; set; }
}
```

---

## 5) تحسينات اختيارية (تجميل تجربة المستخدم)

### 5.1 حقل نوع الجلسة في الجدول
أضف للـ `ScheduleResponseDto` و `CreateScheduleDto`:

```csharp
public string Type { get; set; }   // Lecture | Lab | Tutorial | Exam
```

### 5.2 لون / بانر للمادة
أضف للـ `CourseResponseDto` و `Update/CreateCourseDto`:

```csharp
public string? ColorHex { get; set; }      // مثال: "#1e40af"
public string? BannerImageUrl { get; set; }
```

---

## ملاحظات تطبيقية للتنفيذ

1. **الترميز:** `application/json` فقط، الإجابة بـ camelCase (الواجهة الحالية تتعامل بـ camelCase).
2. **Paging:** استعمل نفس قالب `PagedResult<T>` الموجود في الـ API الحالي.
3. **Auth:** كلها تتطلب JWT Bearer (نفس Middleware الحالي). أضف `[Authorize(Roles = "Admin")]` للـ admin endpoints.
4. **رفع الملفات:** خزّن في `wwwroot/uploads/files/{courseId}/{guid}.{ext}` وأعد `DownloadUrl` كمسار نسبي أو مطلق — مثلما تفعل الفيديوهات حالياً.
5. **الحذف:** يفضّل soft-delete (علم `IsDeleted`) لجداول حسّاسة (Files, Departments) بدل الحذف الفعلي.
6. **Validation Errors:** استعمل ProblemDetails (RFC 7807) كما تفعل بقية الـ API.
7. **التواريخ:** ISO 8601 UTC.

---

## ترتيب التنفيذ المقترح (من الأسهل للأعقد)

1. ✅ **Departments** — أبسط CRUD، يفك صفحة `/admin/departments`.
2. ✅ **Admin Stats** — Endpoint واحد فقط، يحسّن لوحة المدير مباشرةً.
3. ✅ **Files** — أهم ميزة ناقصة وظيفياً، تفك صفحتين كاملتين.
4. ✅ **Admin Teachers/Students CRUD** — يكمل تجربة الإدارة.
5. ✅ **Student Activity** — اختياري ويعتمد على وجود سجلّ نشاط.
6. 🔧 الحقول الاختيارية (Schedule.Type, Course.ColorHex/BannerImageUrl).

---

> عند جهوزية أي مجموعة، أرسل ملف الـ OpenAPI المحدّث فقط، وسأربط الصفحات بالـ endpoints الجديدة في الواجهة دون كسر أي صفحة موجودة.
