# دليل مطور الواجهة الأمامية (Frontend Integration Guide)

تم تحديث هيكلية المواد (Courses) لتعتمد على معرف القسم (`DepartmentId` من نوع `Guid`) بدلاً من الاسم النصي للقسم. إليك التغييرات اللازمة لتحديث الواجهة الأمامية:

---

## 1. نموذج المادة في الواجهة (Course Entity Models)

يجب تحديث تعريف كائن المادة (Course Model/Interface) في الكود (TypeScript أو Dart إلخ):

### الهيكل القديم (Legacy Model):
```typescript
interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  description?: string;
  department: string; // نص حر
  credits: number;
  semester: string;
  academicYear: string;
  isActive: boolean;
  professorName: string;
}
```

### الهيكل الجديد (Updated Model):
```typescript
interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  description?: string;
  departmentId: string;   // معرّف القسم الأكاديمي (Guid) 🌟 جديد
  departmentName: string; // اسم القسم المقابل (مثال: "Computer Science") 🌟 جديد
  departmentCode: string; // كود القسم المقابل (مثال: "CS") 🌟 جديد
  credits: number;
  semester: string;
  academicYear: string;
  isActive: boolean;
  professorName: string;
}
```

---

## 2. تحديث طلبات الإرسال (POST / PUT)

### أ. إنشاء مادة (`POST /api/courses`)
يجب إرسال معرّف القسم `departmentId` كـ `Guid` حقيقي (يتم اختياره عادةً من قائمة منسدلة Dropdown) بدلاً من الاسم النصي.

* **جسم الطلب القديم (Payload):**
  ```json
  {
    "courseCode": "CS101",
    "courseName": "Introduction to Programming",
    "department": "Computer Science", // ❌ نصي
    "credits": 3,
    "semester": 1,
    "academicYear": "2024-2025"
  }
  ```

* **جسم الطلب الجديد (Payload):**
  ```json
  {
    "courseCode": "CS101",
    "courseName": "Introduction to Programming",
    "departmentId": "4a7f05b7-7b89-4b10-8d5f-4a378d3ef778", //  Guid القسم الأكاديمي
    "credits": 3,
    "semester": 1,
    "academicYear": "2024-2025"
  }
  ```

### ب. تحديث مادة (`PUT /api/courses/{id}`)
عند تحديث المادة، يتم إرسال `departmentId` كحقل اختياري.

* **جسم الطلب الجديد (Payload):**
  ```json
  {
    "courseName": "Advanced Programming",
    "departmentId": "4a7f05b7-7b89-4b10-8d5f-4a378d3ef778" //  تحديث القسم عبر المعرف
  }
  ```

---

## 3. الفلترة وجلب البيانات (GET Queries)

### أ. فلترة المواد بقسم معيّن (`GET /api/courses`)
تمت إضافة معامل تصفية جديد باسم `deptId` لتصفية المواد بدقة.

* **الطلب القديم:** `GET /api/courses?dept=Computer Science`
* **الطلب الجديد (الموصى به للـ IDs):** `GET /api/courses?deptId=4a7f05b7-7b89-4b10-8d5f-4a378d3ef778`
* **ملاحظة:** ما زال خيار الاستعلام القديم `dept` يعمل كـ Fallback للبحث النصي بـ Code أو Name للقسم (مثال: `GET /api/courses?dept=CS`).

### ب. الـ Endpoint الجديد لجلب مواد قسم محدد مباشرةً
تم توفير مسارين جديدين لجلب قائمة مواد قسم معين بشكل مباشر وسريع:
1. `GET /api/departments/{deptId}/courses`
2. `GET /api/courses/departments/{deptId}/courses` (عبر Courses API)

* **الاستجابة المتوقعة (Array of CourseSummaryDto):**
  ```json
  [
    {
      "id": "c1f7a059-e932-472d-88f1-fa1234567890",
      "courseCode": "CRS-1-1",
      "courseName": "Course 1 by Teacher 1",
      "departmentId": "4a7f05b7-7b89-4b10-8d5f-4a378d3ef778",
      "departmentName": "Computer Science",
      "departmentCode": "CS",
      "credits": 3,
      "semester": "First",
      "academicYear": "2024-2025",
      "isActive": true,
      "professorName": "Teacher 1"
    }
  ]
  ```

---

## 4. إحصائيات الأقسام (`GET /api/departments`)
استجابة جلب الأقسام أصبحت دقيقة وسريعة وتعتمد على الربط المرجعي الداخلي لحساب الإحصائيات (عدد المواد، الأساتذة، والطلاب المسجلين). لا تعديل في بنية بيانات الاستجابة الخاصة بهذا الـ Endpoint، ولكن البيانات ستصبح دقيقة وتلقائية التحديث بالكامل.
