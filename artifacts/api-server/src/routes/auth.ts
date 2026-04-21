import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  publicUser,
  requireAuth,
} from "../lib/auth";

const router: IRouter = Router();

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

router.post("/auth/register", async (req, res) => {
  try {
    const username = asString(req.body?.username)?.toLowerCase();
    const password = asString(req.body?.password);
    const fullName = asString(req.body?.fullName);

    if (!username || username.length < 3 || username.length > 40) {
      return res.status(400).json({ message: "اسم المستخدم يجب أن يكون بين 3 و40 حرفاً" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    }
    if (!fullName || fullName.length < 2) {
      return res.status(400).json({ message: "الاسم الكامل مطلوب" });
    }

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));

    if (existing) {
      return res.status(409).json({ message: "اسم المستخدم محجوز" });
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(usersTable)
      .values({
        username,
        passwordHash,
        fullName,
        role: "student",
      })
      .returning();

    req.session.userId = user.id;
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    req.log.error({ err }, "Failed to register");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const username = asString(req.body?.username)?.toLowerCase();
    const password = asString(req.body?.password);

    if (!username || !password) {
      return res.status(400).json({ message: "اسم المستخدم وكلمة المرور مطلوبان" });
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));

    if (!user) {
      return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
    }

    req.session.userId = user.id;
    res.json({ user: publicUser(user) });
  } catch (err) {
    req.log.error({ err }, "Failed to login");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      req.log.error({ err }, "Failed to destroy session");
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
    res.clearCookie("cp.sid");
    res.json({ success: true });
  });
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user!) });
});

export default router;
