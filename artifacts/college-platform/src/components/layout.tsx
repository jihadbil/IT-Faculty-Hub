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
  UserCog,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

function isActiveLink(location: string, href: string, allHrefs: string[]) {
  if (location === href) return true;
  if (href === "/" || href === "/student") return false;
  // Make sure parent links don't match child links from another section
  const moreSpecific = allHrefs.some(h => h !== href && h.startsWith(href + "/") && location.startsWith(h));
  if (moreSpecific) return false;
  return location.startsWith(href);
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isStudentSection = location.startsWith("/student");
  const allHrefs = [...TEACHER_NAV, ...STUDENT_NAV].map(n => n.href);

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    items: NavItem[],
    onClick?: () => void,
  ) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-4 pt-2 pb-1">
        <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white/90">
          {icon}
        </div>
        <h3 className="text-xs font-display font-bold text-white/60 uppercase tracking-wider">{title}</h3>
      </div>
      {items.map(item => {
        const isActive = isActiveLink(location, item.href, allHrefs);
        return (
          <Link key={item.href} href={item.href}>
            <span
              onClick={onClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group cursor-pointer",
                isActive
                  ? "bg-white text-primary shadow-lg shadow-black/10 scale-[1.02]"
                  : "text-primary-foreground/80 hover:bg-white/10 hover:text-white"
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

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 end-0 z-40 bg-primary shadow-2xl text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        <div className="relative p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md shrink-0">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-lg leading-tight truncate">كلية تقنية المعلومات</h1>
            <p className="text-primary-foreground/70 text-xs">المنصة التعليمية</p>
          </div>
        </div>

        {/* Section badge */}
        <div className="relative px-6 pt-4">
          <div className="bg-white/10 rounded-xl px-3 py-2 text-xs text-center font-bold text-white/90">
            {isStudentSection ? "وضع الطالب" : "وضع الإدارة"}
          </div>
        </div>

        <nav className="relative flex-1 p-4 space-y-5 overflow-y-auto">
          {renderSection("بوابة الإدارة", <UserCog className="w-4 h-4" />, TEACHER_NAV)}
          {renderSection("بوابة الطالب", <Users className="w-4 h-4" />, STUDENT_NAV)}
        </nav>

        <div className="relative p-4 border-t border-white/10">
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md">
            <p className="text-xs text-center text-white/80 font-medium">العام الدراسي 2024-2025</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 inset-x-0 h-20 bg-primary text-white z-50 flex items-center justify-between px-6 shadow-xl">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-8 h-8" />
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">تقنية المعلومات</h1>
            <p className="text-xs text-white/70">{isStudentSection ? "وضع الطالب" : "وضع الإدارة"}</p>
          </div>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-xl bg-white/20">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-primary/95 backdrop-blur-lg pt-24 px-6 pb-6 flex flex-col overflow-y-auto">
          <div className="space-y-6 flex-1">
            {renderSection("بوابة الإدارة", <UserCog className="w-4 h-4" />, TEACHER_NAV, () => setIsMobileMenuOpen(false))}
            {renderSection("بوابة الطالب", <Users className="w-4 h-4" />, STUDENT_NAV, () => setIsMobileMenuOpen(false))}
          </div>
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
