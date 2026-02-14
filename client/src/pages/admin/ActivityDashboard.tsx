import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Activity, Clock, User, Shield, Building2, FileText, MessageSquare,
  Image, Settings, Monitor, ChevronLeft, ChevronRight, Filter,
  LogIn, LogOut, Edit, Trash2, Plus, Eye, Upload, Download,
  RefreshCw, Search, Calendar, BarChart3, TrendingUp, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  { value: "all", label: "الكل", icon: Activity, color: "text-white/70" },
  { value: "auth", label: "المصادقة", icon: Shield, color: "text-blue-400" },
  { value: "property", label: "العقارات", icon: Building2, color: "text-emerald-400" },
  { value: "project", label: "المشاريع", icon: FileText, color: "text-purple-400" },
  { value: "inquiry", label: "الاستفسارات", icon: MessageSquare, color: "text-amber-400" },
  { value: "cms", label: "المحتوى", icon: FileText, color: "text-cyan-400" },
  { value: "media", label: "الوسائط", icon: Image, color: "text-pink-400" },
  { value: "settings", label: "الإعدادات", icon: Settings, color: "text-gray-400" },
  { value: "user", label: "المستخدمين", icon: Users, color: "text-indigo-400" },
  { value: "system", label: "النظام", icon: Monitor, color: "text-orange-400" },
];

const ACTION_ICONS: Record<string, any> = {
  login: LogIn, login_2fa: Shield, logout: LogOut,
  create: Plus, update: Edit, delete: Trash2,
  view: Eye, upload: Upload, export: Download,
  enable_2fa: Shield, disable_2fa: Shield,
  status_change: RefreshCw, settings_change: Settings,
  regenerate_backup_codes: RefreshCw,
};

function getActionIcon(action: string) {
  return ACTION_ICONS[action] || Activity;
}

function getCategoryColor(category: string): string {
  const cat = CATEGORIES.find(c => c.value === category);
  return cat?.color || "text-white/50";
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

export default function ActivityDashboard() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [showUserDetail, setShowUserDetail] = useState<number | null>(null);
  const LIMIT = 30;

  const { data: activityData, isLoading } = trpc.admin.getAllActivity.useQuery({
    limit: LIMIT,
    offset: page * LIMIT,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    userId: selectedUserId,
  });

  const { data: usersList } = trpc.admin.listUsers.useQuery({ search: userSearch });

  // User detail queries (only when a user is selected)
  const { data: userSummary } = trpc.admin.getUserActivitySummary.useQuery(
    { userId: showUserDetail! },
    { enabled: !!showUserDetail }
  );
  const { data: userActivity } = trpc.admin.getUserActivity.useQuery(
    { userId: showUserDetail!, limit: 20 },
    { enabled: !!showUserDetail }
  );
  const { data: loginHistory } = trpc.admin.getUserLoginHistory.useQuery(
    { userId: showUserDetail!, limit: 10 },
    { enabled: !!showUserDetail }
  );

  const totalPages = Math.ceil((activityData?.total || 0) / LIMIT);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1b33]">سجل النشاطات</h1>
          <p className="text-gray-500 text-sm mt-1">
            {showUserDetail ? "تفاصيل نشاط المستخدم" : "متابعة جميع الأنشطة والعمليات في النظام"}
          </p>
        </div>
        {showUserDetail && (
          <Button
            variant="outline"
            onClick={() => setShowUserDetail(null)}
            className="border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4 ml-1" />
            العودة للسجل العام
          </Button>
        )}
      </div>

      {/* User Detail View */}
      {showUserDetail ? (
        <UserDetailView
          userId={showUserDetail}
          summary={userSummary}
          activities={userActivity?.activities || []}
          loginHistory={loginHistory || []}
        />
      ) : (
        <>
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  onClick={() => { setSelectedCategory(cat.value); setPage(0); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat.value
                      ? "bg-[#0f1b33] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* User Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="بحث عن مستخدم..."
                className="pr-10 h-9 text-sm border-gray-200 rounded-lg"
              />
            </div>
            {selectedUserId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSelectedUserId(undefined); setPage(0); }}
                className="text-xs border-gray-200"
              >
                إلغاء فلتر المستخدم
              </Button>
            )}
            {usersList && userSearch && (
              <div className="flex gap-1 flex-wrap">
                {usersList.slice(0, 5).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setSelectedUserId(u.id); setPage(0); setUserSearch(""); }}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      selectedUserId === u.id
                        ? "bg-[#0f1b33] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {u.displayName || u.fullName || u.username || u.email}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0f1b33]">{activityData?.total || 0}</p>
                  <p className="text-xs text-gray-500">إجمالي النشاطات</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0f1b33]">{activityData?.activities?.length || 0}</p>
                  <p className="text-xs text-gray-500">في هذه الصفحة</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0f1b33]">{page + 1}</p>
                  <p className="text-xs text-gray-500">من {totalPages || 1} صفحة</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Filter className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0f1b33]">
                    {selectedCategory !== "all" ? CATEGORIES.find(c => c.value === selectedCategory)?.label : "الكل"}
                  </p>
                  <p className="text-xs text-gray-500">الفئة المحددة</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-[#0f1b33] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#c8a45e]" />
                سجل النشاطات
              </h3>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0f1b33] border-t-transparent mx-auto" />
                <p className="text-sm text-gray-500 mt-3">جاري التحميل...</p>
              </div>
            ) : !activityData?.activities?.length ? (
              <div className="p-12 text-center">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">لا توجد نشاطات مسجلة</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activityData.activities.map((activity: any) => {
                  const ActionIcon = getActionIcon(activity.action);
                  const categoryColor = getCategoryColor(activity.category);
                  return (
                    <div key={activity.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gray-100`}>
                          <ActionIcon className={`w-4 h-4 ${categoryColor.replace("text-", "text-")}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => setShowUserDetail(activity.userId)}
                              className="text-sm font-semibold text-[#0f1b33] hover:text-[#c8a45e] transition-colors"
                            >
                              {activity.userName || "مستخدم غير معروف"}
                            </button>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 ${categoryColor}`}>
                              {CATEGORIES.find(c => c.value === activity.category)?.label || activity.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                          {activity.entityType && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {activity.entityType} {activity.entityId ? `#${activity.entityId}` : ""}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 shrink-0 text-left">
                          {formatTimeAgo(activity.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="border-gray-200"
                >
                  <ChevronRight className="w-4 h-4 ml-1" />
                  السابق
                </Button>
                <span className="text-sm text-gray-500">
                  صفحة {page + 1} من {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="border-gray-200"
                >
                  التالي
                  <ChevronLeft className="w-4 h-4 mr-1" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** User Detail View Component */
function UserDetailView({
  userId,
  summary,
  activities,
  loginHistory,
}: {
  userId: number;
  summary: any;
  activities: any[];
  loginHistory: any[];
}) {
  const { data: user } = trpc.admin.getUser.useQuery({ id: userId });

  return (
    <div className="space-y-6">
      {/* User Header */}
      {user && (
        <div className="bg-gradient-to-br from-[#0f1b33] to-[#1a2d4f] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border-2 border-[#c8a45e]/50">
              <span className="text-2xl font-bold">
                {(user.displayName || user.fullName || user.username || "U")[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.displayName || user.fullName || user.username}</h2>
              <p className="text-white/60 text-sm">@{user.username || "—"} · {user.email || "—"}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  user.role === "admin" ? "bg-red-500/20 text-red-300" :
                  user.role === "manager" ? "bg-amber-500/20 text-amber-300" :
                  user.role === "staff" ? "bg-blue-500/20 text-blue-300" :
                  "bg-gray-500/20 text-gray-300"
                }`}>
                  {user.role === "admin" ? "مدير" : user.role === "manager" ? "مدير فرعي" : user.role === "staff" ? "موظف" : "مستخدم"}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  user.status === "active" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                }`}>
                  {user.status === "active" ? "نشط" : "معطّل"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1b33]">{summary.totalActions}</p>
                <p className="text-xs text-gray-500">إجمالي العمليات</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Monitor className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1b33]">{summary.recentSessions}</p>
                <p className="text-xs text-gray-500">جلسات (30 يوم)</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0f1b33]">
                  {summary.lastActive ? formatTimeAgo(summary.lastActive) : "—"}
                </p>
                <p className="text-xs text-gray-500">آخر نشاط</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1b33]">{summary.categoryCounts?.length || 0}</p>
                <p className="text-xs text-gray-500">فئات نشطة</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {summary?.categoryCounts?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-[#0f1b33] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#c8a45e]" />
            توزيع النشاطات حسب الفئة
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {summary.categoryCounts.map((cc: any) => {
              const cat = CATEGORIES.find(c => c.value === cc.category);
              const Icon = cat?.icon || Activity;
              return (
                <div key={cc.category} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <Icon className={`w-5 h-5 ${cat?.color || "text-gray-400"}`} />
                  <div>
                    <p className="text-sm font-semibold text-[#0f1b33]">{cc.count}</p>
                    <p className="text-xs text-gray-500">{cat?.label || cc.category}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Login History */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-[#0f1b33] flex items-center gap-2">
              <Monitor className="w-5 h-5 text-[#c8a45e]" />
              سجل تسجيل الدخول
            </h3>
          </div>
          {loginHistory.length === 0 ? (
            <div className="p-8 text-center">
              <Monitor className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">لا يوجد سجل تسجيل دخول</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {loginHistory.map((session: any) => (
                <div key={session.id} className="p-3 hover:bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-[#0f1b33] font-medium">{session.deviceInfo}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      session.isRevoked ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"
                    }`}>
                      {session.isRevoked ? "ملغاة" : "نشطة"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{session.ipAddress}</span>
                    <span>·</span>
                    <span>{formatTimeAgo(session.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-[#0f1b33] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#c8a45e]" />
              آخر النشاطات
            </h3>
          </div>
          {activities.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">لا توجد نشاطات مسجلة</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activities.map((act: any) => {
                const ActionIcon = getActionIcon(act.action);
                return (
                  <div key={act.id} className="p-3 hover:bg-gray-50/50">
                    <div className="flex items-start gap-2">
                      <ActionIcon className={`w-4 h-4 mt-0.5 ${getCategoryColor(act.category)}`} />
                      <div className="flex-1">
                        <p className="text-sm text-[#0f1b33]">{act.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                            {CATEGORIES.find(c => c.value === act.category)?.label || act.category}
                          </span>
                          <span className="text-xs text-gray-400">{formatTimeAgo(act.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
