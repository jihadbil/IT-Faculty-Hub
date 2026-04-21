import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  BookOpen,
  FileVideo,
  CalendarDays,
  Menu,
  X,
  GraduationCap,
  Home,
  Library,
  LogOut,
  ShieldCheck,
  UserRound,
  Building2,
  Users,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const TEACHER_NAV: NavItem[] = [
  { href: "/", label: "لوحة القيادة", icon: LayoutDashboard },
  { href: "/courses", label: "المواد الدراسية", icon: BookOpen },
  { href: "/files", label: "مكتبة الملفات", icon: FileVideo },
  { href: "/schedule", label: "جدول المحاضرات", icon: CalendarDays },
];

const STUDENT_NAV: NavItem[] = [
  { href: "/student", label: "الرئيسية", icon: Home },
  { href: "/student/courses", label: "موادي", icon: BookOpen },
  { href: "/student/files", label: "المكتبة", icon: Library },
  { href: "/student/schedule", label: "جدولي", icon: CalendarDays },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "لوحة المدير", icon: LayoutDashboard },
  { href: "/admin/departments", label: "الأقسام", icon: Building2 },
  { href: "/admin/teachers", label: "الأساتذة", icon: Users },
  { href: "/admin/students", label: "الطلاب", icon: UserRound },
];

function isActiveLink(location: string, href: string, allHrefs: string[]) {
  if (location === href) return true;
  if (href === "/" || href === "/student" || href === "/admin") return false;
  const moreSpecific = allHrefs.some(h => h !== href && h.startsWith(href + "/") && location.startsWith(h));
  if (moreSpecific) return false;
  return location.startsWith(href);
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const role = user?.role ?? "student";
  const navItems = role === "admin" ? ADMIN_NAV : role === "teacher" ? TEACHER_NAV : STUDENT_NAV;
  const allHrefs = navItems.map(i => i.href);

  // Distinct theming per portal
  const theme =
    role === "admin"
      ? {
          sidebarBg: "bg-purple-800",
          activeText: "text-purple-800",
          portalLabel: "بوابة المدير العام",
          roleLabel: "مدير عام",
          roleIcon: <Crown className="w-4 h-4" />,
          subTitle: "إدارة الكلية",
        }
      : role === "teacher"
      ? {
          sidebarBg: "bg-primary",
          activeText: "text-primary",
          portalLabel: "بوابة الإدارة",
          roleLabel: "أستاذ",
          roleIcon: <ShieldCheck className="w-4 h-4" />,
          subTitle: "لوحة الإدارة",
        }
      : {
          sidebarBg: "bg-emerald-700",
          activeText: "text-emerald-700",
          portalLabel: "بوابة الطالب",
          roleLabel: "طالب",
          roleIcon: <UserRound className="w-4 h-4" />,
          subTitle: "بوابة الطالب",
        };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
  };

  const renderNav = (onClick?: () => void) => (
    <div className="space-y-2">
      {navItems.map(item => {
        const isActive = isActiveLink(location, item.href, allHrefs);
        const activeTextClass = theme.activeText;
        return (
          <Link key={item.href} href={item.href}>
            <span
              onClick={onClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group cursor-pointer",
                isActive
                  ? `bg-white ${activeTextClass} shadow-lg shadow-black/10 scale-[1.02]`
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
              <span className="font-display font-bold text-base">{item.label}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );

  const userPanel = (
    <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold shrink-0">
          {user?.fullName?.[0] || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white truncate">{user?.fullName}</p>
          <p className="text-xs text-white/70 flex items-center gap-1">
            {theme.roleIcon}
            {theme.roleLabel}
          </p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors"
      >
        <LogOut className="w-4 h-4" />
        تسجيل الخروج
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Sidebar Desktop */}
      <aside className={cn("hidden md:flex w-72 flex-col fixed inset-y-0 end-0 z-40 shadow-2xl text-white overflow-hidden", theme.sidebarBg)}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        <div className="relative p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md shrink-0">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-lg leading-tight truncate">كلية تقنية المعلومات</h1>
            <p className="text-white/70 text-xs">{theme.subTitle}</p>
          </div>
        </div>

        <div className="relative px-6 pt-4">
          <div className="bg-white/15 rounded-xl px-3 py-2 text-xs text-center font-bold text-white flex items-center justify-center gap-2">
            {theme.roleIcon}
            {theme.portalLabel}
          </div>
        </div>

        <nav className="relative flex-1 p-4 overflow-y-auto">
          {renderNav()}
        </nav>

        <div className="relative p-4 border-t border-white/10">
          {userPanel}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className={cn("md:hidden fixed top-0 inset-x-0 h-20 text-white z-50 flex items-center justify-between px-6 shadow-xl", theme.sidebarBg)}>
        <div className="flex items-center gap-3">
          <GraduationCap className="w-8 h-8" />
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">تقنية المعلومات</h1>
            <p className="text-xs text-white/70">{theme.portalLabel}</p>
          </div>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-xl bg-white/20">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={cn("md:hidden fixed inset-0 z-40 backdrop-blur-lg pt-24 px-6 pb-6 flex flex-col overflow-y-auto", theme.sidebarBg, "bg-opacity-95")}>
          <div className="flex-1">
            {renderNav(() => setIsMobileMenuOpen(false))}
          </div>
          <div className="mt-6">{userPanel}</div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:me-72 pt-20 md:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
