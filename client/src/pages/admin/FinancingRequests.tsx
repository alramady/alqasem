import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search, ChevronLeft, ChevronRight, Phone, Mail, Building2,
  Calendar, DollarSign, Percent, Clock, MessageCircle, ExternalLink,
  FileText, User, CreditCard,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: "جديد", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  contacted: { label: "تم التواصل", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  in_progress: { label: "قيد المعالجة", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  approved: { label: "موافق عليه", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  closed: { label: "مغلق", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
};

function formatSAR(amount: number) {
  return new Intl.NumberFormat("ar-SA", { style: "decimal", maximumFractionDigits: 0 }).format(amount) + " ر.س";
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("ar-SA", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function generateWhatsAppLink(req: any) {
  const msg = encodeURIComponent(
    `طلب تمويل عقاري - ${req.requestNumber || ""}\n` +
    `الاسم: ${req.customerName}\n` +
    `الجوال: ${req.customerPhone}\n` +
    `العقار: ${req.propertyTitle || "غير محدد"}\n` +
    `سعر العقار: ${formatSAR(req.propertyPrice)}\n` +
    `الدفعة المقدمة: ${req.downPaymentPct}%\n` +
    `مبلغ التمويل: ${formatSAR(req.loanAmount)}\n` +
    `نسبة الربح: ${req.rate}%\n` +
    `المدة: ${req.termYears} سنة\n` +
    `القسط الشهري: ${formatSAR(req.monthlyPayment)}\n` +
    (req.notes ? `ملاحظات: ${req.notes}` : "")
  );
  return `https://wa.me/${req.customerPhone.replace(/^0/, "966")}?text=${msg}`;
}

export default function FinancingRequests() {

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, refetch } = trpc.admin.listFinancingRequests.useQuery({
    page, limit: 20, status: status as any, search: search || undefined,
  });

  const detail = trpc.admin.getFinancingRequestDetail.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );

  const updateStatus = trpc.admin.updateFinancingRequestStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الحالة بنجاح");
      refetch();
      if (selectedId) detail.refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const totalPages = Math.ceil((data?.total || 0) / 20);

  const openDetail = (id: number) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">طلبات التمويل العقاري</h1>
          <p className="text-muted-foreground mt-1">إدارة ومتابعة طلبات التمويل المقدمة من العملاء</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <CreditCard className="w-5 h-5 ml-2" />
          {data?.total || 0} طلب
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، الجوال، رقم الطلب، العقار..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
                className="pr-10"
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="حالة الطلب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="new">جديد</SelectItem>
                <SelectItem value="contacted">تم التواصل</SelectItem>
                <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                <SelectItem value="approved">موافق عليه</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
                <SelectItem value="closed">مغلق</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { setSearch(searchInput); setPage(1); }}>بحث</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {data && data.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(STATUS_MAP).map(([key, { label, color }]) => {
            const cnt = data.items.filter((i: any) => i.status === key).length;
            return (
              <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatus(key); setPage(1); }}>
                <CardContent className="p-3 text-center">
                  <Badge className={`${color} mb-1`}>{label}</Badge>
                  <p className="text-xl font-bold">{cnt}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
          ) : !data?.items?.length ? (
            <div className="p-8 text-center text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد طلبات تمويل</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-right font-medium">رقم الطلب</th>
                    <th className="p-3 text-right font-medium">العميل</th>
                    <th className="p-3 text-right font-medium">العقار</th>
                    <th className="p-3 text-right font-medium">مبلغ التمويل</th>
                    <th className="p-3 text-right font-medium">القسط الشهري</th>
                    <th className="p-3 text-right font-medium">الحالة</th>
                    <th className="p-3 text-right font-medium">التاريخ</th>
                    <th className="p-3 text-right font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((req: any) => (
                    <tr key={req.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => openDetail(req.id)}>
                      <td className="p-3 font-mono text-xs">{req.requestNumber || `#${req.id}`}</td>
                      <td className="p-3">
                        <div className="font-medium">{req.customerName}</div>
                        <div className="text-xs text-muted-foreground" dir="ltr">{req.customerPhone}</div>
                      </td>
                      <td className="p-3 max-w-[200px] truncate">{req.propertyTitle || "—"}</td>
                      <td className="p-3 font-medium">{formatSAR(req.loanAmount)}</td>
                      <td className="p-3 text-emerald-600 font-bold">{formatSAR(req.monthlyPayment)}</td>
                      <td className="p-3">
                        <Badge className={STATUS_MAP[req.status]?.color || ""}>{STATUS_MAP[req.status]?.label || req.status}</Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{formatDate(req.createdAt)}</td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                            <a href={generateWhatsAppLink(req)} target="_blank" rel="noopener noreferrer" title="واتساب">
                              <MessageCircle className="w-4 h-4 text-green-600" />
                            </a>
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                            <a href={`tel:${req.customerPhone}`} title="اتصال">
                              <Phone className="w-4 h-4 text-blue-600" />
                            </a>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">صفحة {page} من {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              تفاصيل طلب التمويل {detail.data?.requestNumber || ""}
            </DialogTitle>
          </DialogHeader>
          {detail.isLoading ? (
            <div className="p-4 text-center text-muted-foreground">جاري التحميل...</div>
          ) : detail.data ? (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4" /> بيانات العميل</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">الاسم:</span> <span className="font-medium">{detail.data.customerName}</span></div>
                  <div><span className="text-muted-foreground">الجوال:</span> <span className="font-medium" dir="ltr">{detail.data.customerPhone}</span></div>
                  {detail.data.customerEmail && (
                    <div className="col-span-2"><span className="text-muted-foreground">البريد:</span> <span className="font-medium">{detail.data.customerEmail}</span></div>
                  )}
                </div>
              </div>

              {/* Property & Financing */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4" /> تفاصيل التمويل</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {detail.data.propertyTitle && (
                    <div className="col-span-2"><span className="text-muted-foreground">العقار:</span> <span className="font-medium">{detail.data.propertyTitle}</span></div>
                  )}
                  <div><span className="text-muted-foreground">سعر العقار:</span> <span className="font-medium">{formatSAR(detail.data.propertyPrice)}</span></div>
                  <div><span className="text-muted-foreground">الدفعة المقدمة:</span> <span className="font-medium">{detail.data.downPaymentPct}%</span></div>
                  <div><span className="text-muted-foreground">مبلغ التمويل:</span> <span className="font-bold text-primary">{formatSAR(detail.data.loanAmount)}</span></div>
                  <div><span className="text-muted-foreground">نسبة الربح:</span> <span className="font-medium">{detail.data.rate}%</span></div>
                  <div><span className="text-muted-foreground">المدة:</span> <span className="font-medium">{detail.data.termYears} سنة</span></div>
                  <div><span className="text-muted-foreground">القسط الشهري:</span> <span className="font-bold text-emerald-600">{formatSAR(detail.data.monthlyPayment)}</span></div>
                </div>
              </div>

              {/* Notes */}
              {detail.data.notes && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">ملاحظات العميل</h3>
                  <p className="text-sm">{detail.data.notes}</p>
                </div>
              )}

              {/* Status & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">الحالة:</span>
                  <Select
                    value={detail.data.status}
                    onValueChange={(v) => updateStatus.mutate({ id: detail.data!.id, status: v as any })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">جديد</SelectItem>
                      <SelectItem value="contacted">تم التواصل</SelectItem>
                      <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                      <SelectItem value="approved">موافق عليه</SelectItem>
                      <SelectItem value="rejected">مرفوض</SelectItem>
                      <SelectItem value="closed">مغلق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 mr-auto">
                  <Button size="sm" variant="outline" className="text-green-600" asChild>
                    <a href={generateWhatsAppLink(detail.data)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-4 h-4 ml-1" /> واتساب
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${detail.data.customerPhone}`}>
                      <Phone className="w-4 h-4 ml-1" /> اتصال
                    </a>
                  </Button>
                  {detail.data.customerEmail && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`mailto:${detail.data.customerEmail}`}>
                        <Mail className="w-4 h-4 ml-1" /> بريد
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> تاريخ الطلب: {formatDate(detail.data.createdAt)}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
