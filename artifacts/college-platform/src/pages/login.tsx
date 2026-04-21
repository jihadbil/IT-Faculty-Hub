import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { GraduationCap, LogIn, Loader2, AlertCircle } from "lucide-react";
import { Input, Button } from "@/components/ui/shared";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(username, password);
      setLocation(user.role === "teacher" ? "/" : "/student");
    } catch (err: any) {
      setError(err?.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary text-white shadow-xl mb-4">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">كلية تقنية المعلومات</h1>
          <p className="text-muted-foreground mt-2">سجّل الدخول للمتابعة إلى منصتك التعليمية</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-border p-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6">تسجيل الدخول</h2>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">اسم المستخدم</label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="username"
                autoComplete="username"
                required
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">كلمة المرور</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                dir="ltr"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-5 h-5 ms-2" /> دخول</>}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center text-sm">
            <span className="text-muted-foreground">لست مسجلاً؟ </span>
            <Link href="/register">
              <span className="text-primary font-bold hover:underline cursor-pointer">أنشئ حساب طالب</span>
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          الحساب الافتراضي للأستاذ: <span className="font-mono" dir="ltr">admin</span> / <span className="font-mono" dir="ltr">admin123</span>
        </p>
      </motion.div>
    </div>
  );
}
