import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Building2, Users, MessageSquare, FolderKanban, TrendingUp, Clock, Image, FileText, Bell, Activity, ArrowUpRight, ArrowDownRight, MoreVertical } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { useLocation } from "wouter";

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8", "#7c3aed"];

const actionLabels: Record<string, string> = {
  create: "إنشاء", update: "تعديل", delete: "حذف", login: "تسجيل دخول",
  logout: "تسجيل خروج", status_change: "تغيير حالة", export: "تصدير",
  upload: "رفع", view: "عرض", settings_change: "تغيير إعدادات",
};

const entityLabels: Record<string, string> = {
  user: "مستخدم", property: "عقار", project: "مشروع", inquiry: "طلب",
  page: "صفحة", section: "قسم", media: "وسائط", setting: "إعدادات",
  report: "تقرير", audit_log: "سجل", permission: "صلاحية", guide: "دليل",
};

export default function AdminDashboard() {
  const { data: stats } = trpc.admin.dashboardStats.useQuery();
  const [, setLocation] = useLocation();

  const kpiCards = [
    { title: "إجمالي العقارات", value: stats?.totalProperties ?? 0, icon: Building2, bgColor: "bg-indigo-50", iconBg: "bg-indigo-500", iconColor: "text-white", trend: "+20%", trendUp: true, link: "/admin/properties" },
    { title: "العقارات النشطة", value: stats?.activeProperties ?? 0, icon: TrendingUp, bgColor: "bg-emerald-50", iconBg: "bg-emerald-500", iconColor: "text-white", trend: "+1.8%", trendUp: true, link: "/admin/properties" },
    { title: "الطلبات الجديدة", value: stats?.newInquiries ?? 0, icon: MessageSquare, bgColor: "bg-amber-50", iconBg: "bg-amber-500", iconColor: "text-white", trend: null, trendUp: false, link: "/admin/inquiries" },
    { title: "المشاريع", value: stats?.totalProjects ?? 0, icon: FolderKanban, bgColor: "bg-violet-50", iconBg: "bg-violet-500", iconColor: "text-white", trend: null, trendUp: false, link: "/admin/projects" },
    { title: "المستخدمون", value: stats?.totalUsers ?? 0, icon: Users, bgColor: "bg-blue-50", iconBg: "bg-blue-500", iconColor: "text-white", trend: null, trendUp: false, link: "/admin/users" },
    { title: "طلبات الشهر", value: stats?.monthlyInquiries ?? 0, icon: Clock, bgColor: "bg-orange-50", iconBg: "bg-orange-500", iconColor: "text-white", trend: null, trendUp: false, link: "/admin/inquiries" },
    { title: "ملفات الوسائط", value: stats?.totalMedia ?? 0, icon: Image, bgColor: "bg-purple-50", iconBg: "bg-purple-500", iconColor: "text-white", trend: null, trendUp: false, link: "/admin/media" },
    { title: "الصفحات", value: stats?.totalPages ?? 0, icon: FileText, bgColor: "bg-teal-50", iconBg: "bg-teal-500", iconColor: "text-white", trend: null, trendUp: false, link: "/admin/cms" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Header - Synto style gradient */}
        <div className="bg-gradient-to-l from-indigo-600 via-violet-600 to-purple-600 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 200" fill="none">
              <circle cx="350" cy="30" r="120" fill="white" opacity="0.1" />
              <circle cx="380" cy="150" r="80" fill="white" opacity="0.05" />
              <circle cx="50" cy="180" r="60" fill="white" opacity="0.05" />
            </svg>
          </div>
          <div className="relative z-10">
            <h1 className="text-2xl lg:text-3xl font-bold mb-1">
              مرحباً، {stats?.userName || "مدير"} 👋
            </h1>
            <p className="text-white/70 text-sm lg:text-base">
              إليك نظرة عامة على أداء موقع القاسم العقارية اليوم
            </p>
            <div className="flex items-center gap-4 mt-4">
              {(stats?.unreadNotifications ?? 0) > 0 && (
                <button onClick={() => setLocation("/admin/notifications")} className="flex items-center gap-2 bg-white/15 hover:bg-white/25 px-4 py-2 rounded-xl transition-colors text-sm backdrop-blur-sm border border-white/10">
                  <Bell className="h-4 w-4" />
                  <span>{stats?.unreadNotifications} تنبيه جديد</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* KPI Cards - Synto style with colored backgrounds and trend indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <Card
              key={card.title}
              className="border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white rounded-xl"
              onClick={() => setLocation(card.link)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 ${card.iconBg} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                    <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  {card.trend && (
                    <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-lg ${
                      card.trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                    }`}>
                      {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {card.trend}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-slate-800 mb-1">
                  {card.value.toLocaleString("ar-SA")}
                </p>
                <p className="text-xs text-slate-400">{card.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {/* Inquiries Trend - wider */}
          <Card className="border border-slate-100 shadow-sm bg-white rounded-xl lg:col-span-4">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-800">
                اتجاه الطلبات
              </CardTitle>
              <button className="h-8 w-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors">
                <MoreVertical className="h-4 w-4 text-slate-400" />
              </button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats?.inquiriesByMonth ?? []}>
                  <defs>
                    <linearGradient id="colorInq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      direction: "rtl",
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorInq)" name="الطلبات" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Properties by Type - Donut */}
          <Card className="border border-slate-100 shadow-sm bg-white rounded-xl lg:col-span-3">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-800">
                العقارات حسب النوع
              </CardTitle>
              <button className="h-8 w-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors">
                <MoreVertical className="h-4 w-4 text-slate-400" />
              </button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats?.propertiesByType ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    dataKey="count"
                    nameKey="type"
                    paddingAngle={3}
                    label={({ type, count }) => `${type}: ${count}`}
                    labelLine={false}
                  >
                    {(stats?.propertiesByType ?? []).map((_: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      direction: "rtl",
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Inquiries by Status + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inquiries by Status */}
          <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-800">
                حالة الطلبات
              </CardTitle>
              <button className="h-8 w-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors">
                <MoreVertical className="h-4 w-4 text-slate-400" />
              </button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats?.inquiriesByStatus ?? []} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="status" type="category" tick={{ fontSize: 11, fill: "#64748b" }} width={80} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      direction: "rtl",
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} name="العدد" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-800">
                آخر النشاطات
              </CardTitle>
              <button onClick={() => setLocation("/admin/audit-log")} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium hover:underline">
                عرض الكل
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[280px] overflow-y-auto">
                {(stats?.recentActivity ?? []).length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    <Activity className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                    لا توجد نشاطات بعد
                  </div>
                ) : (
                  (stats?.recentActivity ?? []).map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        log.action === "create" ? "bg-emerald-100 text-emerald-600" :
                        log.action === "delete" ? "bg-red-100 text-red-500" :
                        log.action === "update" || log.action === "status_change" ? "bg-blue-100 text-blue-500" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold">{log.userName || "نظام"}</span>
                          {" — "}
                          <span>{actionLabels[log.action] || log.action}</span>
                          {" "}
                          <span className="text-slate-400">{entityLabels[log.entityType] || log.entityType}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(log.createdAt).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Inquiries Table */}
        <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-800">
              آخر الطلبات
            </CardTitle>
            <button onClick={() => setLocation("/admin/inquiries")} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium hover:underline">
              عرض الكل
            </button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-right py-3 px-4 text-slate-400 font-medium text-xs">الاسم</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium text-xs">الجوال</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium text-xs">النوع</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium text-xs">الحالة</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium text-xs">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentInquiries ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                        لا توجد طلبات بعد
                      </td>
                    </tr>
                  ) : (
                    (stats?.recentInquiries ?? []).map((inquiry: any) => (
                      <tr key={inquiry.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-700">{inquiry.name}</td>
                        <td className="py-3.5 px-4 text-slate-500" dir="ltr">{inquiry.phone || "-"}</td>
                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className="text-xs font-normal rounded-lg border-slate-200 text-slate-600">
                            {inquiry.inquiryType === "buy" ? "شراء" : inquiry.inquiryType === "rent" ? "إيجار" : inquiry.inquiryType === "sell" ? "بيع" : inquiry.inquiryType === "management" ? "إدارة أملاك" : "عام"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge className={`text-xs font-medium rounded-lg ${
                            inquiry.status === "new" ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border border-emerald-200" :
                            inquiry.status === "in_progress" ? "bg-amber-50 text-amber-600 hover:bg-amber-50 border border-amber-200" :
                            inquiry.status === "completed" ? "bg-blue-50 text-blue-600 hover:bg-blue-50 border border-blue-200" :
                            "bg-slate-50 text-slate-500 hover:bg-slate-50 border border-slate-200"
                          }`}>
                            {inquiry.status === "new" ? "جديد" : inquiry.status === "in_progress" ? "قيد المتابعة" : inquiry.status === "completed" ? "مكتمل" : "مغلق"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs">
                          {new Date(inquiry.createdAt).toLocaleDateString("ar-SA")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
