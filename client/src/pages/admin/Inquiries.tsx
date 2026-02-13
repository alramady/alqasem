import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Search, Eye, Download, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = { new: "جديد", in_progress: "قيد المتابعة", completed: "مكتمل", closed: "مغلق" };
const typeLabels: Record<string, string> = { buy: "شراء", rent: "إيجار", sell: "بيع", general: "استفسار عام", management: "إدارة أملاك" };

export default function AdminInquiries() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [note, setNote] = useState("");

  const { data: inquiries, refetch } = trpc.admin.listInquiries.useQuery({ search, status: statusFilter });
  const updateStatus = trpc.admin.updateInquiryStatus.useMutation({
    onSuccess: () => { toast.success("تم تحديث الحالة"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const addNote = trpc.admin.addInquiryNote.useMutation({
    onSuccess: () => { toast.success("تم إضافة الملاحظة"); setNote(""); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const exportCSV = trpc.admin.exportInquiriesCSV.useMutation({
    onSuccess: (data: any) => {
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "inquiries.csv";
      link.click();
      toast.success("تم تصدير البيانات");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">إدارة الطلبات</h1>
            <p className="text-slate-400 text-sm mt-0.5">متابعة وإدارة طلبات العملاء</p>
          </div>
          <Button variant="outline" onClick={() => exportCSV.mutate()} disabled={exportCSV.isPending} className="border-slate-200 text-slate-600 hover:bg-slate-50">
            <Download className="w-4 h-4 ml-2" />تصدير CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="بحث بالاسم أو الجوال..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 border-slate-200" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 border-slate-200"><SelectValue placeholder="كل الحالات" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Inquiries Table */}
        <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الاسم</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الجوال</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">النوع</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الحالة</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">التاريخ</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {(inquiries ?? []).length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                      لا توجد طلبات
                    </td></tr>
                  ) : (
                    (inquiries ?? []).map((inq: any) => (
                      <tr key={inq.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-slate-700 font-medium">{inq.name}</td>
                        <td className="py-3 px-4 text-slate-500" dir="ltr">{inq.phone}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-lg font-medium">{typeLabels[inq.inquiryType] || inq.inquiryType}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Select value={inq.status} onValueChange={(v) => updateStatus.mutate({ id: inq.id, status: v })}>
                            <SelectTrigger className={`h-7 text-xs w-28 border rounded-lg font-medium ${
                              inq.status === "new" ? "bg-amber-50 text-amber-600 border-amber-200" :
                              inq.status === "in_progress" ? "bg-blue-50 text-blue-600 border-blue-200" :
                              inq.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                              "bg-slate-50 text-slate-500 border-slate-200"
                            }`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{new Date(inq.createdAt).toLocaleDateString("ar-SA")}</td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-indigo-50" onClick={() => setSelectedInquiry(inq)}>
                            <Eye className="w-4 h-4 text-indigo-500" />
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

        {/* Detail Dialog */}
        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent dir="rtl" className="max-w-lg">
            <DialogHeader><DialogTitle className="text-slate-800">تفاصيل الطلب</DialogTitle></DialogHeader>
            {selectedInquiry && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-400">الاسم:</span> <span className="text-slate-700 font-medium">{selectedInquiry.name}</span></div>
                  <div><span className="text-slate-400">الجوال:</span> <span className="text-slate-700" dir="ltr">{selectedInquiry.phone}</span></div>
                  <div><span className="text-slate-400">البريد:</span> <span className="text-slate-700" dir="ltr">{selectedInquiry.email || "-"}</span></div>
                  <div><span className="text-slate-400">النوع:</span> <span className="text-slate-700">{typeLabels[selectedInquiry.inquiryType] || selectedInquiry.inquiryType}</span></div>
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">الرسالة:</span>
                  <p className="text-slate-700 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedInquiry.message || "لا توجد رسالة"}</p>
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">ملاحظات داخلية:</span>
                  <p className="text-slate-700 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedInquiry.internalNotes || "لا توجد ملاحظات"}</p>
                </div>
                <div>
                  <Label className="text-slate-600">إضافة ملاحظة</Label>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="أضف ملاحظة داخلية..." rows={2} className="mt-1" />
                  <Button className="mt-2 bg-indigo-500 text-white hover:bg-indigo-600" size="sm" onClick={() => addNote.mutate({ id: selectedInquiry.id, note })} disabled={!note || addNote.isPending}>
                    إضافة الملاحظة
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
