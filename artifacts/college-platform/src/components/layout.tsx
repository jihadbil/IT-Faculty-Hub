import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  BookOpen, 
  FileVideo, 
  CalendarDays, 
  Menu,
  X,
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "لوحة القيادة", icon: LayoutDashboard },
  { href: "/courses", label: "المواد الدراسية", icon: BookOpen },
  { href: "/files", label: "مكتبة الملفات", icon: FileVideo },
  { href: "/schedule", label: "جدول المحاضرات", icon: CalendarDays },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 end-0 z-40 bg-primary shadow-2xl text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        <div className="relative p-8 flex items-center gap-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl leading-tight">كلية تقنية المعلومات</h1>
            <p className="text-primary-foreground/70 text-sm">المنصة التعليمية</p>
          </div>
        </div>

        <nav className="relative flex-1 p-6 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <span className={cn(
                  "flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group cursor-pointer",
                  isActive 
                    ? "bg-white text-primary shadow-lg shadow-black/10 scale-[1.02]" 
                    : "text-primary-foreground/80 hover:bg-white/10 hover:text-white"
                )}>
                  <item.icon className={cn("w-6 h-6 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                  <span className="font-display font-bold text-lg">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>
        
        <div className="relative p-6 border-t border-white/10">
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md">
            <p className="text-sm text-center text-white/80 font-medium">العام الدراسي 2024-2025</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 inset-x-0 h-20 bg-primary text-white z-50 flex items-center justify-between px-6 shadow-xl">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-8 h-8" />
          <h1 className="font-display font-bold text-lg">تقنية المعلومات</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-xl bg-white/20">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-primary/95 backdrop-blur-lg pt-24 px-6 pb-6 flex flex-col">
          <nav className="space-y-3 flex-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <span 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                    "flex items-center gap-4 px-6 py-5 rounded-2xl transition-all",
                    isActive ? "bg-white text-primary" : "text-white/80 hover:bg-white/10"
                  )}>
                    <item.icon className="w-7 h-7" />
                    <span className="font-display font-bold text-xl">{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
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
