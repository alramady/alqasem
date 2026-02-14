import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Mail, Send, Star, Archive, Search, ArrowRight, Paperclip, MoreVertical, MessageSquare } from "lucide-react";

export default function AdminMessages() {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({ recipientId: "", subject: "", message: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: threads, refetch: refetchThreads } = trpc.admin.listThreads.useQuery({ filter: filter === "all" ? undefined : filter });
  const { data: threadMessages, refetch: refetchMessages } = trpc.admin.getThread.useQuery(
    { threadId: selectedThread! },
    { enabled: !!selectedThread, refetchInterval: 10000 }
  );
  const { data: adminUsers } = trpc.admin.listAdminUsers.useQuery();
  const sendMsg = trpc.admin.sendMessage.useMutation({
    onSuccess: () => { refetchMessages(); refetchThreads(); setNewMessage(""); },
    onError: (err: any) => toast.error(err.message),
  });
  const toggleStar = trpc.admin.toggleMessageStar.useMutation({ onSuccess: () => refetchThreads() });
  const archiveThread = trpc.admin.archiveThread.useMutation({ onSuccess: () => { refetchThreads(); setSelectedThread(null); toast.success("تم أرشفة المحادثة"); } });
  const markRead = trpc.admin.markThreadRead.useMutation({ onSuccess: () => refetchThreads() });

  useEffect(() => {
    if (selectedThread) {
      markRead.mutate({ threadId: selectedThread });
    }
  }, [selectedThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  const filteredThreads = (threads ?? []).filter((t: any) => !search || t.subject?.includes(search));

  const handleSend = () => {
    if (!newMessage.trim() || !selectedThread) return;
    sendMsg.mutate({ threadId: selectedThread, recipientId: 0, body: newMessage });
  };

  const handleCompose = () => {
    if (!composeForm.recipientId || !composeForm.subject || !composeForm.message) {
      toast.error("يرجى تعبئة جميع الحقول"); return;
    }
    const threadId = `thread_${Date.now()}`;
    sendMsg.mutate({
      threadId,
      recipientId: parseInt(composeForm.recipientId),
      subject: composeForm.subject,
      body: composeForm.message,
    });
    setShowCompose(false);
    setComposeForm({ recipientId: "", subject: "", message: "" });
    setSelectedThread(threadId);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0f1b33]">مركز المراسلات</h1>
            <p className="text-muted-foreground text-sm mt-1">إدارة المحادثات والرسائل الداخلية</p>
          </div>
          <Button onClick={() => setShowCompose(true)} className="bg-[#0f1b33] hover:bg-[#1a2b4a]">
            <Mail className="h-4 w-4 ml-2" /> رسالة جديدة
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
          {/* Thread List */}
          <Card className="border-0 shadow-sm lg:col-span-1 flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="unread">غير مقروء</SelectItem>
                    <SelectItem value="starred">مميز</SelectItem>
                    <SelectItem value="archived">مؤرشف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {filteredThreads.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">لا توجد محادثات</p>
                </div>
              ) : (
                filteredThreads.map((thread: any) => (
                  <button
                    key={thread.threadId}
                    onClick={() => setSelectedThread(thread.threadId)}
                    className={`w-full text-right p-3 border-b hover:bg-[#f8f6f3] transition-colors ${
                      selectedThread === thread.threadId ? "bg-[#c8a45e]/10 border-r-2 border-r-[#c8a45e]" : ""
                    } ${thread.unreadCount > 0 ? "bg-blue-50/50" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="text-xs bg-[#0f1b33]/10 text-[#0f1b33]">
                          {thread.otherUserName?.charAt(0) || "م"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm truncate ${thread.unreadCount > 0 ? "font-bold text-[#0f1b33]" : "text-[#0f1b33]"}`}>
                            {thread.otherUserName || "مستخدم"}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleDateString("ar-SA") : ""}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{thread.subject || "بدون عنوان"}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{thread.lastMessage || ""}</p>
                      </div>
                      {thread.unreadCount > 0 && (
                        <Badge className="bg-[#c8a45e] text-white text-[10px] px-1.5 hover:bg-[#c8a45e]">{thread.unreadCount}</Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Message View */}
          <Card className="border-0 shadow-sm lg:col-span-2 flex flex-col">
            {!selectedThread ? (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Mail className="h-16 w-16 mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-muted-foreground">اختر محادثة لعرض الرسائل</p>
                </div>
              </CardContent>
            ) : (
              <>
                {/* Thread Header */}
                <CardHeader className="pb-3 border-b shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSelectedThread(null)}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <div>
                        <h3 className="font-semibold text-[#0f1b33] text-sm">
                          {(threadMessages as any)?.[0]?.subject || "محادثة"}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => archiveThread.mutate({ threadId: selectedThread })}>
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {((threadMessages as any) ?? []).map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.isMine ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[75%] rounded-2xl p-3 ${
                        msg.isMine
                          ? "bg-[#0f1b33] text-white rounded-br-sm"
                          : "bg-[#f0ece5] text-[#0f1b33] rounded-bl-sm"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.isMine ? "text-white/60" : "text-muted-foreground"}`}>
                          {new Date(msg.createdAt).toLocaleString("ar-SA", { timeStyle: "short" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Input */}
                <div className="p-3 border-t shrink-0">
                  <div className="flex items-center gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="اكتب رسالتك..."
                      className="flex-1"
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    />
                    <Button onClick={handleSend} disabled={!newMessage.trim() || sendMsg.isPending} className="bg-[#c8a45e] hover:bg-[#b8943e] text-white">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Compose Dialog */}
        {showCompose && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowCompose(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4" dir="rtl" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-[#0f1b33] mb-4">رسالة جديدة</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">المستلم</label>
                  <Select value={composeForm.recipientId} onValueChange={(v) => setComposeForm({ ...composeForm, recipientId: v })}>
                    <SelectTrigger><SelectValue placeholder="اختر المستلم" /></SelectTrigger>
                    <SelectContent>
                      {(adminUsers ?? []).map((u: any) => (
                        <SelectItem key={u.id} value={u.id.toString()}>{u.name || u.email || `مستخدم #${u.id}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">الموضوع</label>
                  <Input value={composeForm.subject} onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })} placeholder="موضوع الرسالة" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">الرسالة</label>
                  <Textarea value={composeForm.message} onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })} rows={5} placeholder="اكتب رسالتك هنا..." />
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowCompose(false)}>إلغاء</Button>
                  <Button onClick={handleCompose} className="bg-[#0f1b33] hover:bg-[#1a2b4a]">
                    <Send className="h-4 w-4 ml-2" /> إرسال
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
