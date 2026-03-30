import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses";
import { lecturesTable } from "./lectures";
import { relations } from "drizzle-orm";

export const filesTable = pgTable("files", {
  id: serial("id").primaryKey(),
  lectureId: integer("lecture_id").references(() => lecturesTable.id, { onDelete: "set null" }),
  courseId: integer("course_id").references(() => coursesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull().$type<"pdf" | "video">(),
  size: integer("size"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const filesRelations = relations(filesTable, ({ one }) => ({
  lecture: one(lecturesTable, {
    fields: [filesTable.lectureId],
    references: [lecturesTable.id],
  }),
  course: one(coursesTable, {
    fields: [filesTable.courseId],
    references: [coursesTable.id],
  }),
}));

export const insertFileSchema = createInsertSchema(filesTable).omit({ id: true, createdAt: true });
export type InsertFile = z.infer<typeof insertFileSchema>;
export type FileRecord = typeof filesTable.$inferSelect;
