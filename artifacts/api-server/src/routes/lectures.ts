import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { lecturesTable, coursesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateLectureBody, GetLecturesQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/lectures", async (req, res) => {
  try {
    const query = GetLecturesQueryParams.safeParse(req.query);
    const lectures = await db
      .select({
        id: lecturesTable.id,
        courseId: lecturesTable.courseId,
        title: lecturesTable.title,
        description: lecturesTable.description,
        lectureNumber: lecturesTable.lectureNumber,
        duration: lecturesTable.duration,
        createdAt: lecturesTable.createdAt,
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
      .from(lecturesTable)
      .leftJoin(coursesTable, eq(lecturesTable.courseId, coursesTable.id))
      .orderBy(lecturesTable.courseId, lecturesTable.lectureNumber)
      .then((rows) => {
        if (query.success && query.data.courseId) {
          return rows.filter((r) => r.courseId === query.data.courseId);
        }
        return rows;
      });
    res.json(lectures);
  } catch (err) {
    req.log.error({ err }, "Failed to get lectures");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/lectures", async (req, res) => {
  try {
    const parsed = CreateLectureBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid request body" });
    const [lecture] = await db.insert(lecturesTable).values(parsed.data).returning();
    res.status(201).json(lecture);
  } catch (err) {
    req.log.error({ err }, "Failed to create lecture");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/lectures/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const [lecture] = await db
      .select({
        id: lecturesTable.id,
        courseId: lecturesTable.courseId,
        title: lecturesTable.title,
        description: lecturesTable.description,
        lectureNumber: lecturesTable.lectureNumber,
        duration: lecturesTable.duration,
        createdAt: lecturesTable.createdAt,
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
      .from(lecturesTable)
      .leftJoin(coursesTable, eq(lecturesTable.courseId, coursesTable.id))
      .where(eq(lecturesTable.id, id));
    if (!lecture) return res.status(404).json({ message: "Lecture not found" });
    res.json(lecture);
  } catch (err) {
    req.log.error({ err }, "Failed to get lecture");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/lectures/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const parsed = CreateLectureBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid request body" });
    const [lecture] = await db.update(lecturesTable).set(parsed.data).where(eq(lecturesTable.id, id)).returning();
    if (!lecture) return res.status(404).json({ message: "Lecture not found" });
    res.json(lecture);
  } catch (err) {
    req.log.error({ err }, "Failed to update lecture");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/lectures/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await db.delete(lecturesTable).where(eq(lecturesTable.id, id));
    res.json({ message: "Lecture deleted", success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete lecture");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
