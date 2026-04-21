import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { db, pool, usersTable, type User } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "express";

const PgStore = connectPgSimple(session);

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

export const sessionMiddleware = session({
  store: new PgStore({
    pool,
    createTableIfMissing: true,
    tableName: "user_sessions",
  }),
  name: "cp.sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  },
});

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}

export async function loadUser(userId: number): Promise<User | null> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user ?? null;
}

export const attachUser: RequestHandler = async (req, _res, next) => {
  if (req.session?.userId) {
    const user = await loadUser(req.session.userId);
    if (user) req.user = user;
  }
  next();
};

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "يجب تسجيل الدخول" });
  }
  next();
};

export const requireTeacher: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "يجب تسجيل الدخول" });
  }
  if (req.user.role !== "teacher") {
    return res.status(403).json({ message: "هذه الصفحة متاحة للأستاذ فقط" });
  }
  next();
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function ensureDefaultTeacher(): Promise<void> {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, "admin"));
  if (existing) return;

  const passwordHash = await hashPassword("admin123");
  await db.insert(usersTable).values({
    username: "admin",
    passwordHash,
    role: "teacher",
    fullName: "المشرف الرئيسي",
  });
}

export function publicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
  };
}
