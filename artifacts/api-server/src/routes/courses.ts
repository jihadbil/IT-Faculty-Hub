import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { coursesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  CreateCourseBody,
  GetCoursesQueryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/courses", async (req, res) => {
  try {
    const query = GetCoursesQueryParams.safeParse(req.query);
    let courses = await db.select().from(coursesTable).orderBy(coursesTable.createdAt);
    if (query.success && query.data.year) {
      courses = courses.filter((c) => c.year === query.data.year);
    }
    if (query.success && query.data.semester) {
      courses = courses.filter((c) => c.semester === query.data.semester);
    }
    if (req.query.mine === "true" && req.user?.role === "teacher") {
      courses = courses.filter((c) => c.teacherId === req.user!.id);
    }
    res.json(courses);
  } catch (err) {
    req.log.error({ err }, "Failed to get courses");
    res.status(500).json({ message: "Internal server error" });
  }
});

function pickNumberOrNull(body: unknown, key: string): number | null {
  if (!body || typeof body !== "object") return null;
  const v = (body as Record<string, unknown>)[key];
  if (v === null || v === "" || v === undefined) return null;
  const n = typeof v === "number" ? v : parseInt(String(v));
  return Number.isFinite(n) ? n : null;
}

router.post("/courses", requireAdmin, async (req, res) => {
  try {
    const parsed = CreateCourseBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid request body" });
    }
    const departmentId = pickNumberOrNull(req.body, "departmentId");
    const teacherId = pickNumberOrNull(req.body, "teacherId");
    const [course] = await db.insert(coursesTable).values({ ...parsed.data, departmentId, teacherId }).returning();
    res.status(201).json(course);
  } catch (err) {
    req.log.error({ err }, "Failed to create course");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/courses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    req.log.error({ err }, "Failed to get course");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/courses/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const parsed = CreateCourseBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid request body" });
    const departmentId = pickNumberOrNull(req.body, "departmentId");
    const teacherId = pickNumberOrNull(req.body, "teacherId");
    const [course] = await db.update(coursesTable).set({ ...parsed.data, departmentId, teacherId }).where(eq(coursesTable.id, id)).returning();
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    req.log.error({ err }, "Failed to update course");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/courses/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await db.delete(coursesTable).where(eq(coursesTable.id, id));
    res.json({ message: "Course deleted", success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete course");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
