import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, Send, Users, AlertCircle, Plus } from "lucide-react";
import { Badge, Button, Card, Input, Modal, Select } from "@/components/ui/shared";
import { useConversations, useMessages, useUsers } from "@/lib/queries";
import { messagingApi, asNumber, type Uuid } from "@/lib/external-api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function MessagingPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: conversations = [], isLoading, error } = useConversations();
  const [activeId, setActiveId] = useState<Uuid | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const active = conversations.find((c) => c.id === activeId);
  const { data: messagesPaged } = useMessages(activeId);
  const messages = messagesPaged?.items ?? [];

  const markRead = useMutation({
    mutationFn: (id: Uuid) => messagingApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["external", "messaging"] });
    },
  });

  // Mark conversation read when opened
  useEffect(() => {
    if (activeId) markRead.mutate(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const [draft, setDraft] = useState("");
  const send = useMutation({
    mutationFn: () =>
      messagingApi.send({
        recipientId: active!.otherUser.id,
        content: draft.trim(),
      }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["external", "messaging"] });
    },
  });

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            المراسلات
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">المحادثات بين الطلاب والأساتذة والإدارة</p>
        </div>
        <Button onClick={() => setComposeOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> محادثة جديدة
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive break-words">{(error as Error).message}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[600px]">
        {/* Conversations list */}
        <Card className="lg:col-span-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-bold flex items-center gap-2">
              <Users className="w-4 h-4" /> المحادثات
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
            ) : conversations.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">لا توجد محادثات بعد.</p>
            ) : (
              conversations.map((c) => {
                const isActive = c.id === activeId;
                const unread = asNumber(c.unreadCount);
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      "w-full text-right p-4 border-b border-border/50 hover:bg-muted/40 transition-colors flex items-start gap-3",
                      isActive && "bg-primary/5",
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 overflow-hidden">
                      {c.otherUser.profileImageUrl ? (
                        <img src={c.otherUser.profileImageUrl} alt={c.otherUser.fullName} className="w-full h-full object-cover" />
                      ) : (
                        c.otherUser.fullName?.[0] ?? "?"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm truncate">{c.otherUser.fullName}</p>
                        {unread > 0 && (
                          <Badge variant="default" className="bg-primary text-white">{unread}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">{c.lastMessage}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(c.lastMessageAt).toLocaleString("ar")}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Message thread */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col min-h-[600px]">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              اختر محادثة لعرض الرسائل.
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold overflow-hidden">
                  {active.otherUser.profileImageUrl ? (
                    <img src={active.otherUser.profileImageUrl} alt={active.otherUser.fullName} className="w-full h-full object-cover" />
                  ) : (
                    active.otherUser.fullName?.[0] ?? "?"
                  )}
                </div>
                <div>
                  <p className="font-bold">{active.otherUser.fullName}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">{active.otherUser.email}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {[...messages].reverse().map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[75%] rounded-2xl p-3 break-words",
                      m.isOwnMessage
                        ? "bg-primary text-primary-foreground ms-auto"
                        : "bg-white border border-border me-auto",
                    )}
                  >
                    <p className="text-sm">{m.content}</p>
                    <p className={cn("text-[10px] mt-1", m.isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {new Date(m.sentAt).toLocaleString("ar")}
                    </p>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <div className="p-4 border-t border-border">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (draft.trim()) send.mutate();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="اكتب رسالة…"
                  />
                  <Button type="submit" isLoading={send.isPending} disabled={!draft.trim()} className="gap-1 shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
                {send.isError && <p className="text-xs text-destructive mt-2">{(send.error as Error).message}</p>}
              </div>
            </>
          )}
        </Card>
      </div>

      {composeOpen && (
        <NewConversationModal
          onClose={() => setComposeOpen(false)}
          onStarted={(id) => {
            setActiveId(id);
            setComposeOpen(false);
            qc.invalidateQueries({ queryKey: ["external", "messaging"] });
          }}
        />
      )}
    </div>
  );
}

function NewConversationModal({
  onClose,
  onStarted,
}: {
  onClose: () => void;
  onStarted: (id: Uuid) => void;
}) {
  const { user } = useAuth();
  const { data: users = [], isLoading } = useUsers();
  const [recipientId, setRecipientId] = useState<string>("");
  const [first, setFirst] = useState("");

  const candidates = useMemo(
    () => users.filter((u) => u.id !== user?.id && u.isActive),
    [users, user?.id],
  );

  const start = useMutation({
    mutationFn: async () => {
      const conv = await messagingApi.startConversation(recipientId);
      if (first.trim()) {
        await messagingApi.send({ recipientId, content: first.trim() });
      }
      return conv;
    },
    onSuccess: (conv) => onStarted(conv.id),
  });

  return (
    <Modal isOpen onClose={onClose} title="بدء محادثة جديدة">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (recipientId) start.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-bold mb-2">المستلم</label>
          <Select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} required>
            <option value="">— اختر مستخدماً —</option>
            {isLoading ? (
              <option disabled>جاري التحميل…</option>
            ) : (
              candidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))
            )}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">رسالة افتتاحية (اختياري)</label>
          <Input value={first} onChange={(e) => setFirst(e.target.value)} placeholder="مرحباً…" />
        </div>
        {start.isError && <p className="text-sm text-destructive break-words">{(start.error as Error).message}</p>}
        <div className="pt-3 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button type="submit" isLoading={start.isPending} disabled={!recipientId}>بدء</Button>
        </div>
      </form>
    </Modal>
  );
}
