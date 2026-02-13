import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Bell, Plus, Check, CheckCheck, Trash2, Info, AlertTriangle, AlertCircle, CheckCircle, Filter } from "lucide-react";

const typeIcons: Record<string, any> = {
  info: Info, warning: AlertTriangle, error: AlertCircle, success: CheckCircle,
};
const typeColors: Record<string, string> = {
  info: "bg-blue-100 text-blue-600", warning: "bg-amber-100 text-amber-600",
  error: "bg-red-100 text-red-600", success: "bg-green-100 text-green-600",
};
const typeLabels: Record<string, string> = {
  info: "معلومات", warning: "تحذير", error: "خطأ", success: "نجاح",
};

export default function AdminNotifications() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [form, setForm] = useState({ title: "", message: "", type: "info" as string, targetUserId: "" });

  const { data: notifications, refetch } = trpc.admin.listNotifications.useQuery({});
  // Note: createNotification is a server-side helper, not a tRPC procedure
  // For admin, we use notifyAdmins through a custom procedure
  const markRead = trpc.admin.markNotificationRead.useMutation({ onSuccess: () => { refetch(); } });
  const markAllRead = trpc.admin.markAllNotificationsRead.useMutation({ onSuccess: () => { refetch(); toast.success("تم تحديد الكل كمقروء"); } });
  

  const filtered = (notifications ?? []).filter((n: any) => filterType === "all" || n.type === filterType);
  const unreadCount = (notifications ?? []).filter((n: any) => !n.isRead).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0f1b33]">مركز التنبيهات</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {unreadCount > 0 ? `لديك ${unreadCount} تنبيه غير مقروء` : "جميع التنبيهات مقروءة"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
                <CheckCheck className="h-4 w-4 ml-2" /> تحديد الكل كمقروء
              </Button>
            )}
            <Button onClick={() => { setForm({ title: "", message: "", type: "info", targetUserId: "" }); setShowCreateDialog(true); }} className="bg-[#0f1b33] hover:bg-[#1a2b4a]">
              <Plus className="h-4 w-4 ml-2" /> تنبيه جديد
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="info">معلومات</SelectItem>
              <SelectItem value="warning">تحذير</SelectItem>
              <SelectItem value="error">خطأ</SelectItem>
              <SelectItem value="success">نجاح</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">لا توجد تنبيهات</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((notif: any) => {
              const Icon = typeIcons[notif.type] || Info;
              return (
                <Card key={notif.id} className={`border-0 shadow-sm transition-all ${!notif.isRead ? "bg-[#c8a45e]/5 border-r-4 border-r-[#c8a45e]" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${typeColors[notif.type] || "bg-gray-100 text-gray-600"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold text-[#0f1b33] text-sm ${!notif.isRead ? "" : "font-normal"}`}>{notif.title}</h3>
                          <Badge variant="outline" className="text-[10px]">{typeLabels[notif.type]}</Badge>
                          {!notif.isRead && <Badge className="bg-[#c8a45e] text-white text-[10px] hover:bg-[#c8a45e]">جديد</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notif.createdAt).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notif.isRead && (
                          <Button variant="ghost" size="sm" onClick={() => markRead.mutate({ id: notif.id })} title="تحديد كمقروء">
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Create Notification Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إرسال تنبيه جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>العنوان *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="عنوان التنبيه" />
              </div>
              <div>
                <Label>الرسالة *</Label>
                <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} placeholder="نص التنبيه" />
              </div>
              <div>
                <Label>النوع</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">معلومات</SelectItem>
                    <SelectItem value="warning">تحذير</SelectItem>
                    <SelectItem value="error">خطأ</SelectItem>
                    <SelectItem value="success">نجاح</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>إلغاء</Button>
              <Button onClick={() => { if (!form.title || !form.message) { toast.error("يرجى تعبئة الحقول المطلوبة"); return; } toast.info("ميزة إرسال التنبيهات المخصصة قادمة قريباً"); setShowCreateDialog(false); }} className="bg-[#0f1b33] hover:bg-[#1a2b4a]" >
                إرسال التنبيه
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
