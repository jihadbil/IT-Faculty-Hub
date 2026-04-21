import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { GraduationCap, UserPlus, Loader2, AlertCircle } from "lucide-react";
import { Input, Button } from "@/components/ui/shared";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(username, password, fullName);
      setLocation("/student");
    } catch (err: any) {
      setError(err?.message || "فشل إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-accent/10 via-background to-primary/10" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary text-white shadow-xl mb-4">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">حساب طالب جديد</h1>
          <p className="text-muted-foreground mt-2">سجّل بياناتك للوصول إلى موادك ومحاضراتك</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-border p-8">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">الاسم الكامل</label>
              <Input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">اسم المستخدم</label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="student123"
                required
                dir="ltr"
                minLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">كلمة المرور</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="6 أحرف على الأقل"
                required
                dir="ltr"
                minLength={6}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5 ms-2" /> إنشاء الحساب</>}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center text-sm">
            <span className="text-muted-foreground">لديك حساب؟ </span>
            <Link href="/login">
              <span className="text-primary font-bold hover:underline cursor-pointer">سجّل الدخول</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
