import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { departmentsTable } from "./departments";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["teacher", "student", "admin"] }).notNull().default("student"),
  fullName: text("full_name").notNull(),
  departmentId: integer("department_id").references(() => departmentsTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
