import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Search, Download, ScrollText, Eye, Clock, User, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const actionLabels: Record<string, string> = {
  create: "إنشاء", update: "تعديل", delete: "حذف", login: "تسجيل دخول", logout: "تسجيل خروج",
  status_change: "تغيير حالة", export: "تصدير", upload: "رفع ملف", settings_change: "تغيير إعدادات",
};
const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-700 border-green-200", update: "bg-blue-100 text-blue-700 border-blue-200",
  delete: "bg-red-100 text-red-700 border-red-200", login: "bg-purple-100 text-purple-700 border-purple-200",
  logout: "bg-gray-100 text-gray-700 border-gray-200", status_change: "bg-amber-100 text-amber-700 border-amber-200",
  export: "bg-indigo-100 text-indigo-700 border-indigo-200", upload: "bg-teal-100 text-teal-700 border-teal-200",
  settings_change: "bg-orange-100 text-orange-700 border-orange-200",
};
const entityLabels: Record<string, string> = {
  property: "عقار", project: "مشروع", inquiry: "طلب", user: "مستخدم", page: "صفحة",
  media: "وسائط", setting: "إعداد", section: "قسم", permission: "صلاحية", notification: "تنبيه",
};
const actionIcons: Record<string, string> = {
  create: "➕", update: "✏️", delete: "🗑️", login: "🔑", logout: "🚪",
  status_change: "🔄", export: "📤", upload: "📁", settings_change: "⚙️",
};

export default function AdminAuditLog() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

  const { data: logs } = trpc.admin.getAuditLogs.useQuery({ search, action: actionFilter, entityType: entityFilter });
  const exportCSV = trpc.admin.exportAuditLogCSV.useMutation({
    onSuccess: (data: any) => {
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success("تم تصدير السجل بنجاح");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const totalLogs = (logs ?? []).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f1b33]">سجل النشاطات</h1>
            <p className="text-muted-foreground text-sm mt-1">تتبع جميع العمليات في النظام • {totalLogs} سجل</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border rounded-lg p-0.5">
              <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" className={viewMode === "table" ? "bg-[#0f1b33] text-white h-7" : "h-7"} onClick={() => setViewMode("table")}>جدول</Button>
              <Button variant={viewMode === "timeline" ? "default" : "ghost"} size="sm" className={viewMode === "timeline" ? "bg-[#0f1b33] text-white h-7" : "h-7"} onClick={() => setViewMode("timeline")}>خط زمني</Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => exportCSV.mutate()} disabled={exportCSV.isPending}>
              <Download className="w-4 h-4 ml-2" /> تصدير CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "إجمالي السجلات", value: totalLogs, icon: Activity, color: "text-blue-600 bg-blue-50" },
            { label: "عمليات الإنشاء", value: (logs ?? []).filter((l: any) => l.action === "create").length, icon: Activity, color: "text-green-600 bg-green-50" },
            { label: "عمليات التعديل", value: (logs ?? []).filter((l: any) => l.action === "update").length, icon: Activity, color: "text-amber-600 bg-amber-50" },
            { label: "عمليات الحذف", value: (logs ?? []).filter((l: any) => l.action === "delete").length, icon: Activity, color: "text-red-600 bg-red-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[#0f1b33]">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="بحث بالمستخدم..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="كل العمليات" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل العمليات</SelectItem>
                  {Object.entries(actionLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="كل الكيانات" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الكيانات</SelectItem>
                  {Object.entries(entityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {viewMode === "table" ? (
          /* Table View */
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-[#f8f6f3]">
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">المستخدم</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">العملية</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">الكيان</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">التفاصيل</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">التاريخ</th>
                      <th className="text-center py-3 px-4 text-muted-foreground font-medium">عرض</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(logs ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-muted-foreground">
                          <ScrollText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                          <p>لا توجد سجلات بعد</p>
                        </td>
                      </tr>
                    ) : (
                      (logs ?? []).map((log: any) => (
                        <tr key={log.id} className="border-b hover:bg-[#f8f6f3] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#0f1b33]/10 flex items-center justify-center">
                                <User className="h-3.5 w-3.5 text-[#0f1b33]" />
                              </div>
                              <span className="text-[#0f1b33] font-medium text-xs">{log.userName || "نظام"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={`text-[10px] ${actionColors[log.action] || "bg-gray-100 text-gray-700"}`}>
                              {actionIcons[log.action] || "📋"} {actionLabels[log.action] || log.action}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">{entityLabels[log.entityType] || log.entityType} {log.entityId ? `#${log.entityId}` : ""}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                            {typeof log.details === "string" ? log.details : log.details ? JSON.stringify(log.details).slice(0, 60) : "-"}
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedLog(log)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Timeline View */
          <div className="space-y-0">
            {(logs ?? []).length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <ScrollText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">لا توجد سجلات بعد</p>
                </CardContent>
              </Card>
            ) : (
              (logs ?? []).map((log: any, i: number) => (
                <div key={log.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      log.action === "create" ? "bg-green-100 text-green-600" :
                      log.action === "delete" ? "bg-red-100 text-red-600" :
                      log.action === "update" ? "bg-blue-100 text-blue-600" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {actionIcons[log.action] || "📋"}
                    </div>
                    {i < (logs ?? []).length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                  </div>
                  <Card className="border-0 shadow-sm flex-1 mb-3 hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#0f1b33] text-sm">{log.userName || "نظام"}</span>
                          <Badge variant="outline" className={`text-[10px] ${actionColors[log.action] || ""}`}>
                            {actionLabels[log.action] || log.action}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{entityLabels[log.entityType] || log.entityType}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {log.createdAt ? new Date(log.createdAt).toLocaleString("ar-SA", { timeStyle: "short", dateStyle: "short" }) : "-"}
                        </div>
                      </div>
                      {log.details && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {typeof log.details === "string" ? log.details : JSON.stringify(log.details).slice(0, 100)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent dir="rtl" className="max-w-lg">
            <DialogHeader>
              <DialogTitle>تفاصيل السجل</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">المستخدم:</span> <span className="font-medium text-[#0f1b33]">{selectedLog.userName || "نظام"}</span></div>
                  <div><span className="text-muted-foreground">العملية:</span> <Badge variant="outline" className={`text-[10px] mr-1 ${actionColors[selectedLog.action] || ""}`}>{actionLabels[selectedLog.action] || selectedLog.action}</Badge></div>
                  <div><span className="text-muted-foreground">الكيان:</span> <span className="font-medium">{entityLabels[selectedLog.entityType] || selectedLog.entityType}</span></div>
                  <div><span className="text-muted-foreground">رقم الكيان:</span> <span className="font-medium">{selectedLog.entityId || "-"}</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">التاريخ:</span> <span className="font-medium">{selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString("ar-SA") : "-"}</span></div>
                </div>
                {selectedLog.details && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">التفاصيل:</p>
                    <pre className="bg-[#f8f6f3] p-3 rounded-lg text-xs overflow-auto max-h-40 text-[#0f1b33]" dir="ltr">
                      {typeof selectedLog.details === "string" ? selectedLog.details : JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.oldValues && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">القيم السابقة:</p>
                    <pre className="bg-red-50 p-3 rounded-lg text-xs overflow-auto max-h-32 text-red-800" dir="ltr">
                      {typeof selectedLog.oldValues === "string" ? selectedLog.oldValues : JSON.stringify(selectedLog.oldValues, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.newValues && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">القيم الجديدة:</p>
                    <pre className="bg-green-50 p-3 rounded-lg text-xs overflow-auto max-h-32 text-green-800" dir="ltr">
                      {typeof selectedLog.newValues === "string" ? selectedLog.newValues : JSON.stringify(selectedLog.newValues, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
