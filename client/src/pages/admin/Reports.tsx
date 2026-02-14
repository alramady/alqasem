import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { Download, BarChart3, TrendingUp, Building2, MessageSquare, FileText, ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function AdminReports() {
  const [period, setPeriod] = useState("month");
  const { data: reportData } = trpc.admin.getReportData.useQuery({ period });
  const exportCSV = trpc.admin.exportReportCSV.useMutation({
    onSuccess: (data) => {
      if (!data.csv) {
        toast.error("لا توجد بيانات للتصدير");
        return;
      }
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم تصدير التقرير بنجاح");
    },
    onError: () => toast.error("فشل في تصدير التقرير"),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy">التقارير</h1>
            <p className="text-navy/50 text-sm mt-1">تقارير وإحصائيات شاملة</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">أسبوعي</SelectItem>
                <SelectItem value="month">شهري</SelectItem>
                <SelectItem value="quarter">ربع سنوي</SelectItem>
                <SelectItem value="year">سنوي</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={exportCSV.isPending}>
                  <Download className="w-4 h-4 ml-2" />
                  {exportCSV.isPending ? "جاري التصدير..." : "تصدير التقرير"}
                  <ChevronDown className="w-3 h-3 mr-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportCSV.mutate({ type: "properties" })}>
                  <Building2 className="w-4 h-4 ml-2" />تصدير العقارات (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportCSV.mutate({ type: "inquiries" })}>
                  <MessageSquare className="w-4 h-4 ml-2" />تصدير الطلبات (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportCSV.mutate({ type: "audit" })}>
                  <FileText className="w-4 h-4 ml-2" />تصدير سجل المراجعة (CSV)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div>
                <div><p className="text-xs text-navy/50">إجمالي العقارات</p><p className="text-xl font-bold text-navy">{reportData?.totalProperties ?? 0}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center"><MessageSquare className="w-5 h-5 text-navy" /></div>
                <div><p className="text-xs text-navy/50">إجمالي الطلبات</p><p className="text-xl font-bold text-navy">{reportData?.totalInquiries ?? 0}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-white" /></div>
                <div><p className="text-xs text-navy/50">نسبة التحويل</p><p className="text-xl font-bold text-navy">{reportData?.conversionRate ?? "0%"}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"><BarChart3 className="w-5 h-5 text-white" /></div>
                <div><p className="text-xs text-navy/50">متوسط السعر</p><p className="text-xl font-bold text-navy">{reportData?.avgPrice ?? "0"} ريال</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base text-navy">الطلبات حسب الفترة</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData?.inquiriesTrend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#c5a55a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base text-navy">العقارات المضافة</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData?.propertiesTrend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#1a2744" strokeWidth={2} dot={{ fill: "#1a2744" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
