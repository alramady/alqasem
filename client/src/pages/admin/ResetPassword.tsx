import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, XCircle, ArrowRight } from "lucide-react";
import { DEFAULT_ADMIN_LOGO } from "@/lib/branding";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Extract token from URL
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }, []);

  // Verify token validity
  const { data: tokenCheck, isLoading: tokenLoading } = trpc.admin.verifyResetToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const resetMutation = trpc.admin.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError("");
    },
    onError: (err) => {
      setError(err.message || "حدث خطأ. حاول مرة أخرى");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("كلمة المرور وتأكيدها غير متطابقتين");
      return;
    }
    setError("");
    resetMutation.mutate({ token, newPassword, confirmPassword });
  };

  const renderContent = () => {
    // No token provided
    if (!token) {
      return (
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white">رابط غير صالح</h2>
          <p className="text-white/60 text-sm">
            الرابط المستخدم غير صالح. يرجى طلب رابط جديد لإعادة تعيين كلمة المرور.
          </p>
          <a
            href="/admin/forgot-password"
            className="inline-flex items-center gap-2 text-sm text-[#c8a45e] hover:text-[#d4b36e] transition-colors"
          >
            طلب رابط جديد
          </a>
        </div>
      );
    }

    // Loading token verification
    if (tokenLoading) {
      return (
        <div className="text-center space-y-4 py-8">
          <Loader2 className="w-8 h-8 text-[#c8a45e] animate-spin mx-auto" />
          <p className="text-white/60 text-sm">جاري التحقق من الرابط...</p>
        </div>
      );
    }

    // Token invalid or expired
    if (tokenCheck && !tokenCheck.valid) {
      return (
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white">رابط منتهي الصلاحية</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.
          </p>
          <a
            href="/admin/forgot-password"
            className="inline-flex items-center gap-2 text-sm text-[#c8a45e] hover:text-[#d4b36e] transition-colors"
          >
            طلب رابط جديد
          </a>
        </div>
      );
    }

    // Success state
    if (success) {
      return (
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-lg font-bold text-white">تم تغيير كلمة المرور</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
          </p>
          <a
            href="/admin/login"
            className="inline-flex items-center gap-2 bg-[#c8a45e] text-[#0f1b33] hover:bg-[#d4b36e] font-bold px-6 py-3 rounded-xl transition-all"
          >
            تسجيل الدخول
          </a>
        </div>
      );
    }

    // Reset form
    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-white/80 text-sm font-medium">
            كلمة المرور الجديدة
          </Label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
              placeholder="أدخل كلمة المرور الجديدة"
              className="pr-11 pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#c8a45e] focus:ring-[#c8a45e]/30 transition-all"
              autoComplete="new-password"
              autoFocus
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-white/30">6 أحرف على الأقل</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-white/80 text-sm font-medium">
            تأكيد كلمة المرور
          </Label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              placeholder="أعد إدخال كلمة المرور"
              className="pr-11 pl-4 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#c8a45e] focus:ring-[#c8a45e]/30 transition-all"
              autoComplete="new-password"
              dir="ltr"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={resetMutation.isPending}
          className="w-full h-12 bg-[#c8a45e] text-[#0f1b33] hover:bg-[#d4b36e] font-bold shadow-lg text-base rounded-xl transition-all duration-200 hover:shadow-[#c8a45e]/20 hover:shadow-xl disabled:opacity-60"
        >
          {resetMutation.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري التحديث...
            </span>
          ) : (
            "تعيين كلمة المرور الجديدة"
          )}
        </Button>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1b33] relative overflow-hidden" dir="rtl">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C8A45C' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 p-8 max-w-md w-full mx-4">
        {/* Logo & Title */}
        <div className="flex flex-col items-center gap-4 mb-2">
          <div className="w-24 h-24 bg-gradient-to-br from-[#c8a45e]/30 to-[#c8a45e]/10 rounded-2xl flex items-center justify-center border border-[#c8a45e]/20 shadow-lg shadow-[#c8a45e]/5">
            <img src={DEFAULT_ADMIN_LOGO} alt="القاسم العقارية" className="w-16 h-16 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-1">
              إعادة تعيين كلمة المرور
            </h1>
            <p className="text-sm text-white/50">
              أنشئ كلمة مرور جديدة لحسابك
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">
          {renderContent()}
        </div>

        {/* Back to login */}
        <a
          href="/admin/login"
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة لتسجيل الدخول
        </a>

        <p className="text-xs text-white/20 text-center mt-2">
          شركة القاسم العقارية &copy; {new Date().getFullYear()} - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
