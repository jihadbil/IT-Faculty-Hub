import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, departmentsTable, coursesTable, lecturesTable, filesTable } from "@workspace/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import { requireAdmin, hashPassword, publicUser } from "../lib/auth";

const router: IRouter = Router();

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}
function asInt(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseInt(String(v));
  return Number.isFinite(n) ? n : null;
}

// Stats overview for admin dashboard
router.get("/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const [{ teachers }] = await db
      .select({ teachers: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(eq(usersTable.role, "teacher"));
    const [{ students }] = await db
      .select({ students: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(eq(usersTable.role, "student"));
    const [{ departments }] = await db.select({ departments: sql<number>`count(*)::int` }).from(departmentsTable);
    const [{ courses }] = await db.select({ courses: sql<number>`count(*)::int` }).from(coursesTable);
    const [{ lectures }] = await db.select({ lectures: sql<number>`count(*)::int` }).from(lecturesTable);
    const [{ files }] = await db.select({ files: sql<number>`count(*)::int` }).from(filesTable);
    res.json({ teachers, students, departments, courses, lectures, files });
  } catch (err) {
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

// List all teachers (with department name)
router.get("/admin/teachers", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        fullName: usersTable.fullName,
        role: usersTable.role,
        departmentId: usersTable.departmentId,
        departmentName: departmentsTable.name,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .leftJoin(departmentsTable, eq(usersTable.departmentId, departmentsTable.id))
      .where(eq(usersTable.role, "teacher"))
      .orderBy(usersTable.createdAt);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

// Create teacher
router.post("/admin/teachers", requireAdmin, async (req, res) => {
  try {
    const username = asString(req.body?.username)?.toLowerCase();
    const password = asString(req.body?.password);
    const fullName = asString(req.body?.fullName);
    const departmentId = asInt(req.body?.departmentId);

    if (!username || username.length < 3) return res.status(400).json({ message: "اسم المستخدم مطلوب (3 أحرف على الأقل)" });
    if (!password || password.length < 6) return res.status(400).json({ message: "كلمة المرور 6 أحرف على الأقل" });
    if (!fullName) return res.status(400).json({ message: "الاسم الكامل مطلوب" });

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (existing) return res.status(409).json({ message: "اسم المستخدم محجوز" });

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(usersTable)
      .values({ username, passwordHash, fullName, role: "teacher", departmentId })
      .returning();
    res.status(201).json(publicUser(user));
  } catch (err) {
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

// Update teacher (name, department, optional new password)
router.put("/admin/teachers/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "معرف غير صالح" });
    const fullName = asString(req.body?.fullName);
    const departmentId = asInt(req.body?.departmentId);
    const newPassword = asString(req.body?.password);

    const updates: Record<string, unknown> = {};
    if (fullName) updates.fullName = fullName;
    updates.departmentId = departmentId; // explicit (allow null)
    if (newPassword) {
      if (newPassword.length < 6) return res.status(400).json({ message: "كلمة المرور 6 أحرف على الأقل" });
      updates.passwordHash = await hashPassword(newPassword);
    }

    const [user] = await db
      .update(usersTable)
      .set(updates)
      .where(and(eq(usersTable.id, id), eq(usersTable.role, "teacher")))
      .returning();
    if (!user) return res.status(404).json({ message: "الأستاذ غير موجود" });
    res.json(publicUser(user));
  } catch (err) {
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.delete("/admin/teachers/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "معرف غير صالح" });
    if (req.user!.id === id) return res.status(400).json({ message: "لا يمكن حذف حسابك" });
    const result = await db
      .delete(usersTable)
      .where(and(eq(usersTable.id, id), eq(usersTable.role, "teacher"), ne(usersTable.id, req.user!.id)))
      .returning();
    if (result.length === 0) return res.status(404).json({ message: "الأستاذ غير موجود" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

// List students (read-only)
router.get("/admin/students", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        fullName: usersTable.fullName,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.role, "student"))
      .orderBy(usersTable.createdAt);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

export default router;
