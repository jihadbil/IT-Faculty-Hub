import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses";
import { relations } from "drizzle-orm";

export const scheduleTable = pgTable("schedule", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location"),
  year: integer("year").notNull(),
  semester: text("semester").notNull(),
  type: text("type").notNull().$type<"lecture" | "lab" | "tutorial">(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scheduleRelations = relations(scheduleTable, ({ one }) => ({
  course: one(coursesTable, {
    fields: [scheduleTable.courseId],
    references: [coursesTable.id],
  }),
}));

export const insertScheduleSchema = createInsertSchema(scheduleTable).omit({ id: true, createdAt: true });
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type ScheduleEntry = typeof scheduleTable.$inferSelect;
