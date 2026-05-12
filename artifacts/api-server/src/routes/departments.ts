import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { departmentsTable, coursesTable, usersTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

// Public: list departments (with counts) — visible to anyone authenticated or not for read-only.
router.get("/departments", async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: departmentsTable.id,
        name: departmentsTable.name,
        description: departmentsTable.description,
        color: departmentsTable.color,
        createdAt: departmentsTable.createdAt,
        coursesCount: sql<number>`(SELECT COUNT(*)::int FROM ${coursesTable} WHERE ${coursesTable.departmentId} = ${departmentsTable.id})`,
        teachersCount: sql<number>`(SELECT COUNT(*)::int FROM ${usersTable} WHERE ${usersTable.departmentId} = ${departmentsTable.id} AND ${usersTable.role} = 'teacher')`,
      })
      .from(departmentsTable)
      .orderBy(departmentsTable.name);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.post("/departments", requireAdmin, async (req, res) => {
  try {
    const name = asString(req.body?.name);
    const description = asString(req.body?.description);
    const color = asString(req.body?.color) ?? "#6366F1";
    if (!name) return res.status(400).json({ message: "اسم القسم مطلوب" });
    const [existing] = await db.select().from(departmentsTable).where(eq(departmentsTable.name, name));
    if (existing) return res.status(409).json({ message: "اسم القسم موجود مسبقاً" });
    const [dept] = await db.insert(departmentsTable).values({ name, description, color }).returning();
    res.status(201).json(dept);
  } catch (err) {
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.put("/departments/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ message: "معرف غير صالح" });
    const name = asString(req.body?.name);
    const description = asString(req.body?.description);
    const color = asString(req.body?.color);
    if (!name) return res.status(400).json({ message: "اسم القسم مطلوب" });
    const [dept] = await db
      .update(departmentsTable)
      .set({ name, description, color: color ?? "#6366F1" })
      .where(eq(departmentsTable.id, id))
      .returning();
    if (!dept) return res.status(404).json({ message: "القسم غير موجود" });
    res.json(dept);
  } catch (err) {
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.delete("/departments/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ message: "معرف غير صالح" });
    await db.delete(departmentsTable).where(eq(departmentsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

export default router;
