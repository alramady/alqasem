import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Monitor, Smartphone, Globe, Clock, Shield, Trash2, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminSessions() {
  const { data, refetch, isLoading } = trpc.admin.listSessions.useQuery();

  const revokeSession = trpc.admin.revokeSession.useMutation({
    onSuccess: () => {
      toast.success("تم إلغاء الجلسة بنجاح");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const revokeAll = trpc.admin.revokeAllOtherSessions.useMutation({
    onSuccess: () => {
      toast.success("تم إلغاء جميع الجلسات الأخرى");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const sessions = data?.sessions || [];
  const otherSessions = sessions.filter(s => !s.isCurrent);

  const getDeviceIcon = (deviceInfo: string | null) => {
    if (!deviceInfo) return <Globe className="w-5 h-5" />;
    const lower = deviceInfo.toLowerCase();
    if (lower.includes("android") || lower.includes("ios") || lower.includes("iphone") || lower.includes("ipad")) {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (date: Date | string | null) => {
    if (!date) return "";
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy">إدارة الجلسات</h1>
            <p className="text-navy/50 text-sm mt-1">
              عرض وإدارة جلسات تسجيل الدخول النشطة
            </p>
          </div>
          {otherSessions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  إلغاء جميع الجلسات الأخرى
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>إلغاء جميع الجلسات الأخرى؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم تسجيل الخروج من جميع الأجهزة الأخرى. هذا الإجراء لا يمكن التراجع عنه.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => revokeAll.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {revokeAll.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "تأكيد الإلغاء"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Info Card */}
        <Card className="border-0 shadow-sm bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-blue-900 font-medium">أمان الحساب</p>
                <p className="text-xs text-blue-700/70 mt-1">
                  إذا لاحظت جلسة مشبوهة لا تعرفها، قم بإلغائها فوراً وغيّر كلمة المرور.
                  الجلسات تنتهي تلقائياً بعد 24 ساعة.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Monitor className="w-12 h-12 text-navy/20 mx-auto mb-3" />
              <p className="text-navy/50">لا توجد جلسات نشطة</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={`border-0 shadow-sm transition-all ${
                  session.isCurrent
                    ? "ring-2 ring-green-500/30 bg-green-50/30"
                    : "hover:shadow-md"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Device Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      session.isCurrent
                        ? "bg-green-100 text-green-600"
                        : "bg-navy/5 text-navy/40"
                    }`}>
                      {getDeviceIcon(session.deviceInfo)}
                    </div>

                    {/* Session Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-navy truncate">
                          {session.deviceInfo || "متصفح غير معروف"}
                        </h3>
                        {session.isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium shrink-0">
                            <CheckCircle className="w-3 h-3" />
                            الجلسة الحالية
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="text-xs text-navy/50 flex items-center gap-1" dir="ltr">
                          <Globe className="w-3 h-3" />
                          {session.ipAddress || "غير معروف"}
                        </span>
                        <span className="text-xs text-navy/50 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(session.lastActiveAt)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="text-xs text-navy/40">
                          تسجيل الدخول: {formatDate(session.createdAt)}
                        </span>
                        <span className="text-xs text-navy/40">
                          تنتهي: {formatDate(session.expiresAt)}
                        </span>
                      </div>
                    </div>

                    {/* Revoke Button */}
                    {!session.isCurrent && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                          >
                            <Trash2 className="w-4 h-4 ml-1" />
                            إلغاء
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>إلغاء هذه الجلسة؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              سيتم تسجيل الخروج من هذا الجهاز: {session.deviceInfo || "غير معروف"}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => revokeSession.mutate({ sessionId: session.id })}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              تأكيد
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {sessions.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-navy/60">
                  إجمالي الجلسات النشطة: <strong className="text-navy">{sessions.length}</strong>
                </span>
                {otherSessions.length > 0 && (
                  <span className="text-navy/40">
                    {otherSessions.length} جلسة على أجهزة أخرى
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
