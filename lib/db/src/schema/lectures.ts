import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses";
import { relations } from "drizzle-orm";

export const lecturesTable = pgTable("lectures", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  lectureNumber: integer("lecture_number").notNull(),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lecturesRelations = relations(lecturesTable, ({ one }) => ({
  course: one(coursesTable, {
    fields: [lecturesTable.courseId],
    references: [coursesTable.id],
  }),
}));

export const insertLectureSchema = createInsertSchema(lecturesTable).omit({ id: true, createdAt: true });
export type InsertLecture = z.infer<typeof insertLectureSchema>;
export type Lecture = typeof lecturesTable.$inferSelect;
