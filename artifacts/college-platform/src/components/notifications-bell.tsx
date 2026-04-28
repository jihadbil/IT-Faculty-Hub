import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNotifications, useUnreadNotificationCount } from "@/lib/queries";
import { notificationsApi, asNumber } from "@/lib/external-api";
import { cn } from "@/lib/utils";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: unread } = useUnreadNotificationCount();
  const { data: items = [], isLoading } = useNotifications();

  const unreadCount = asNumber(unread?.count, 0);

  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["external", "notifications"] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["external", "notifications"] });
    },
  });

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="الإشعارات"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-border z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-display font-bold text-foreground">الإشعارات</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                تعليم الكل مقروءة
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                لا توجد إشعارات
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.isRead && markRead.mutate(n.id)}
                  className={cn(
                    "w-full text-right p-4 border-b border-border/50 hover:bg-muted/50 transition-colors block",
                    !n.isRead && "bg-primary/5",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-2 shrink-0",
                        n.isRead ? "bg-transparent" : "bg-primary",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground break-words">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 break-words line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {new Date(n.createdAt).toLocaleString("ar")}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
