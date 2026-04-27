import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { UserRound, Mail, Phone, Image as ImageIcon, Languages, CheckCircle2, AlertCircle, Crown, GraduationCap } from "lucide-react";
import { Button, Card, Input, Select } from "@/components/ui/shared";
import { useAuth } from "@/lib/auth";
import { usersApi } from "@/lib/external-api";

const profileSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().min(1, "الاسم الأخير مطلوب"),
  phoneNumber: z.string().optional(),
  profileImageUrl: z.string().url("رابط غير صالح").optional().or(z.literal("")),
  preferredLanguage: z.string().min(2, "اختر لغة"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, refresh } = useAuth();
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phoneNumber: "",
      profileImageUrl: user?.profileImageUrl ?? "",
      preferredLanguage: "ar",
    },
  });

  const updateMe = useMutation({
    mutationFn: (data: ProfileFormValues) =>
      usersApi.updateMe({
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || null,
        profileImageUrl: data.profileImageUrl || null,
        preferredLanguage: data.preferredLanguage,
      }),
    onSuccess: async () => {
      setOkMsg("تم حفظ التغييرات بنجاح");
      await refresh();
      setTimeout(() => setOkMsg(null), 3000);
    },
  });

  const roleLabel = user?.role === "admin" ? "مدير عام" : user?.role === "teacher" ? "أستاذ" : "طالب";
  const RoleIcon = user?.role === "admin" ? Crown : user?.role === "teacher" ? GraduationCap : UserRound;

  return (
    <div className="space-y-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold overflow-hidden shrink-0">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              user?.fullName?.[0] ?? "?"
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-display font-bold text-foreground break-words">{user?.fullName}</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4" />
              <span dir="ltr" className="break-all">{user?.email}</span>
            </p>
            <div className="mt-2 inline-flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full text-xs font-bold text-foreground">
              <RoleIcon className="w-3.5 h-3.5" /> {roleLabel}
            </div>
          </div>
        </div>
      </motion.div>

      <Card className="p-6 lg:p-8">
        <h2 className="text-xl font-display font-bold text-foreground mb-6">تعديل الملف الشخصي</h2>

        <form onSubmit={handleSubmit((d) => updateMe.mutate(d))} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">الاسم الأول</label>
              <Input {...register("firstName")} />
              {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">الاسم الأخير</label>
              <Input {...register("lastName")} />
              {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" /> رقم الهاتف
            </label>
            <Input {...register("phoneNumber")} placeholder="+962…" dir="ltr" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> رابط الصورة الشخصية
            </label>
            <Input {...register("profileImageUrl")} placeholder="https://…" dir="ltr" />
            {errors.profileImageUrl && <p className="text-xs text-destructive mt-1">{errors.profileImageUrl.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
              <Languages className="w-4 h-4" /> اللغة المفضّلة
            </label>
            <Select {...register("preferredLanguage")}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </Select>
          </div>

          {updateMe.isError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="break-words">{(updateMe.error as Error).message}</p>
            </div>
          )}

          {okMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <p>{okMsg}</p>
            </div>
          )}

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" isLoading={updateMe.isPending} disabled={!isDirty}>
              حفظ التغييرات
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
