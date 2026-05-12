import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { scheduleTable, coursesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateScheduleEntryBody, GetScheduleQueryParams } from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/schedule", async (req, res) => {
  try {
    const query = GetScheduleQueryParams.safeParse(req.query);
    let results = await db
      .select({
        id: scheduleTable.id,
        courseId: scheduleTable.courseId,
        dayOfWeek: scheduleTable.dayOfWeek,
        startTime: scheduleTable.startTime,
        endTime: scheduleTable.endTime,
        location: scheduleTable.location,
        year: scheduleTable.year,
        semester: scheduleTable.semester,
        type: scheduleTable.type,
        createdAt: scheduleTable.createdAt,
        course: {
          id: coursesTable.id,
          name: coursesTable.name,
          code: coursesTable.code,
          description: coursesTable.description,
          year: coursesTable.year,
          semester: coursesTable.semester,
          credits: coursesTable.credits,
          instructor: coursesTable.instructor,
          color: coursesTable.color,
          createdAt: coursesTable.createdAt,
        },
      })
      .from(scheduleTable)
      .leftJoin(coursesTable, eq(scheduleTable.courseId, coursesTable.id))
      .orderBy(scheduleTable.dayOfWeek, scheduleTable.startTime);

    if (query.success) {
      if (query.data.year) {
        results = results.filter((r) => r.year === query.data.year);
      }
      if (query.data.semester) {
        results = results.filter((r) => r.semester === query.data.semester);
      }
    }
    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Failed to get schedule");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/schedule", requireAdmin, async (req, res) => {
  try {
    const parsed = CreateScheduleEntryBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid request body" });
    const [entry] = await db.insert(scheduleTable).values(parsed.data).returning();
    res.status(201).json(entry);
  } catch (err) {
    req.log.error({ err }, "Failed to create schedule entry");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/schedule/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const parsed = CreateScheduleEntryBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid request body" });
    const [entry] = await db.update(scheduleTable).set(parsed.data).where(eq(scheduleTable.id, id)).returning();
    if (!entry) return res.status(404).json({ message: "Schedule entry not found" });
    res.json(entry);
  } catch (err) {
    req.log.error({ err }, "Failed to update schedule entry");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/schedule/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await db.delete(scheduleTable).where(eq(scheduleTable.id, id));
    res.json({ message: "Schedule entry deleted", success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete schedule entry");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
