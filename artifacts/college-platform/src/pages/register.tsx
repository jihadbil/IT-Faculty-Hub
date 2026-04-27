import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { GraduationCap, UserPlus, Loader2, AlertCircle } from "lucide-react";
import { Input, Button } from "@/components/ui/shared";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    setLoading(true);
    try {
      const user = await register({ firstName, lastName, email, password, confirmPassword });
      setLocation(user.role === "admin" ? "/admin" : user.role === "teacher" ? "/" : "/student");
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
          <h1 className="text-3xl font-display font-bold text-foreground">حساب جديد</h1>
          <p className="text-muted-foreground mt-2">سجّل بياناتك للوصول إلى المنصة التعليمية</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-border p-8">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">الاسم الأول</label>
                <Input
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="أحمد"
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">اسم العائلة</label>
                <Input
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="محمد"
                  required
                  maxLength={100}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">البريد الإلكتروني</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
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
                placeholder="8 أحرف على الأقل"
                required
                minLength={8}
                dir="ltr"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">تأكيد كلمة المرور</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                dir="ltr"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="break-words">{error}</span>
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
