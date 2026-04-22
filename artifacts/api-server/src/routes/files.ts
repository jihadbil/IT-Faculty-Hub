import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "@workspace/db";
import { filesTable, lecturesTable, coursesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { GetFilesQueryParams } from "@workspace/api-zod";
import { requireTeacher, userOwnsCourse } from "../lib/auth";

const router: IRouter = Router();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/mkv",
      "video/webm",
    ];
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and video files are allowed"));
    }
  },
});

router.get("/files", async (req, res) => {
  try {
    const query = GetFilesQueryParams.safeParse(req.query);
    let results = await db
      .select({
        id: filesTable.id,
        lectureId: filesTable.lectureId,
        courseId: filesTable.courseId,
        title: filesTable.title,
        filename: filesTable.filename,
        url: filesTable.url,
        type: filesTable.type,
        size: filesTable.size,
        createdAt: filesTable.createdAt,
        lecture: {
          id: lecturesTable.id,
          courseId: lecturesTable.courseId,
          title: lecturesTable.title,
          description: lecturesTable.description,
          lectureNumber: lecturesTable.lectureNumber,
          duration: lecturesTable.duration,
          createdAt: lecturesTable.createdAt,
        },
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
      .from(filesTable)
      .leftJoin(lecturesTable, eq(filesTable.lectureId, lecturesTable.id))
      .leftJoin(coursesTable, eq(filesTable.courseId, coursesTable.id))
      .orderBy(filesTable.createdAt);

    if (query.success) {
      if (query.data.lectureId) {
        results = results.filter((r) => r.lectureId === query.data.lectureId);
      }
      if (query.data.courseId) {
        results = results.filter((r) => r.courseId === query.data.courseId);
      }
      if (query.data.type) {
        results = results.filter((r) => r.type === query.data.type);
      }
    }
    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Failed to get files");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/files/upload", requireTeacher, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const { title, type, lectureId, courseId } = req.body;
    if (!title || !type) {
      return res.status(400).json({ message: "Title and type are required" });
    }
    let resolvedCourseId: number | null = courseId ? parseInt(courseId) : null;
    if (!resolvedCourseId && lectureId) {
      const [lec] = await db.select().from(lecturesTable).where(eq(lecturesTable.id, parseInt(lectureId)));
      if (lec) resolvedCourseId = lec.courseId;
    }
    if (!resolvedCourseId || !(await userOwnsCourse(req.user!, resolvedCourseId))) {
      return res.status(403).json({ message: "لا يمكنك الرفع إلا للمواد المسندة إليك" });
    }
    const url = `/api/uploads/${req.file.filename}`;
    const [fileRecord] = await db
      .insert(filesTable)
      .values({
        lectureId: lectureId ? parseInt(lectureId) : null,
        courseId: courseId ? parseInt(courseId) : null,
        title,
        filename: req.file.originalname,
        url,
        type: type as "pdf" | "video",
        size: req.file.size,
      })
      .returning();
    res.status(201).json(fileRecord);
  } catch (err) {
    req.log.error({ err }, "Failed to upload file");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/files/:id", requireTeacher, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const [file] = await db.select().from(filesTable).where(eq(filesTable.id, id));
    if (!file) return res.status(404).json({ message: "File not found" });
    const ownerCourseId = file.courseId ?? (file.lectureId ? (await db.select().from(lecturesTable).where(eq(lecturesTable.id, file.lectureId)))[0]?.courseId ?? null : null);
    if (!ownerCourseId || !(await userOwnsCourse(req.user!, ownerCourseId))) {
      return res.status(403).json({ message: "لا يمكنك الحذف إلا من المواد المسندة إليك" });
    }
    {
      const storedFilename = file.url.replace("/api/uploads/", "");
      const filePath = path.join(uploadsDir, storedFilename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await db.delete(filesTable).where(eq(filesTable.id, id));
    res.json({ message: "File deleted", success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete file");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
