import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, Loader2, Lock, User, AlertCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { DEFAULT_ADMIN_LOGO } from "@/lib/branding";
import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";

export default function AdminLogin() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [twoFaToken, setTwoFaToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const codeInputRef = useRef<HTMLInputElement>(null);

  const loginMutation = trpc.admin.localLogin.useMutation({
    onSuccess: (data) => {
      if (data.requires2FA) {
        setTwoFaToken((data as any).twoFaToken);
        setShow2FA(true);
        setError("");
        setTimeout(() => codeInputRef.current?.focus(), 100);
      } else {
        window.location.href = "/admin/dashboard";
      }
    },
    onError: (err) => {
      setError(err.message || "فشل تسجيل الدخول");
    },
  });

  const verify2FAMutation = trpc.admin.verify2FA.useMutation({
    onSuccess: () => {
      window.location.href = "/admin/dashboard";
    },
    onError: (err) => {
      setError(err.message || "رمز التحقق غير صحيح");
      setTotpCode("");
    },
  });

  useEffect(() => {
    if (user && !loading) {
      setLocation("/admin/dashboard");
    }
  }, [user, loading, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    loginMutation.mutate({ username: username.trim(), password });
  };

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!totpCode.trim() || totpCode.trim().length < 6) {
      setError("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }
    verify2FAMutation.mutate({ twoFaToken, totpCode: totpCode.trim() });
  };

  const handleBack = () => {
    setShow2FA(false);
    setTwoFaToken("");
    setTotpCode("");
    setError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1b33]">
        <div className="animate-pulse text-[#c8a45e] text-lg">جاري التحميل...</div>
      </div>
    );
  }

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
            {show2FA ? (
              <ShieldCheck className="w-12 h-12 text-[#c8a45e]" />
            ) : (
              <img src={DEFAULT_ADMIN_LOGO} alt="القاسم العقارية" className="w-16 h-16 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-1">
              {show2FA ? "التحقق الثنائي" : "لوحة تحكم القاسم العقارية"}
            </h1>
            <p className="text-sm text-white/50">
              {show2FA ? "أدخل رمز التحقق من تطبيق المصادقة" : "نظام إدارة المحتوى والعمليات"}
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">
          {!show2FA ? (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-white/80 text-sm font-medium">
                  اسم المستخدم
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                    placeholder="أدخل اسم المستخدم"
                    className="pr-11 pl-4 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#c8a45e] focus:ring-[#c8a45e]/30 transition-all"
                    autoComplete="username"
                    autoFocus
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="أدخل كلمة المرور"
                    className="pr-11 pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#c8a45e] focus:ring-[#c8a45e]/30 transition-all"
                    autoComplete="current-password"
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
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-12 bg-[#c8a45e] text-[#0f1b33] hover:bg-[#d4b36e] font-bold shadow-lg text-base rounded-xl transition-all duration-200 hover:shadow-[#c8a45e]/20 hover:shadow-xl disabled:opacity-60"
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>

              <div className="text-center pt-2">
                <a
                  href="/admin/forgot-password"
                  className="text-sm text-[#c8a45e]/70 hover:text-[#c8a45e] transition-colors"
                >
                  نسيت كلمة المرور؟
                </a>
              </div>
            </form>
          ) : (
            /* 2FA Verification Form */
            <form onSubmit={handle2FASubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="bg-[#c8a45e]/5 border border-[#c8a45e]/20 rounded-xl p-4 text-center">
                <ShieldCheck className="w-8 h-8 text-[#c8a45e] mx-auto mb-2" />
                <p className="text-white/70 text-sm">
                  افتح تطبيق المصادقة (Google Authenticator أو Authy) وأدخل الرمز المكون من 6 أرقام
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totpCode" className="text-white/80 text-sm font-medium">
                  رمز التحقق
                </Label>
                <Input
                  ref={codeInputRef}
                  id="totpCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={totpCode}
                  onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 8)); setError(""); }}
                  placeholder="000000"
                  className="h-14 text-center text-2xl tracking-[0.5em] bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:border-[#c8a45e] focus:ring-[#c8a45e]/30 transition-all font-mono"
                  dir="ltr"
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-white/40 text-center">
                  يمكنك أيضاً استخدام أحد رموز الاسترداد
                </p>
              </div>

              <Button
                type="submit"
                disabled={verify2FAMutation.isPending}
                className="w-full h-12 bg-[#c8a45e] text-[#0f1b33] hover:bg-[#d4b36e] font-bold shadow-lg text-base rounded-xl transition-all duration-200 hover:shadow-[#c8a45e]/20 hover:shadow-xl disabled:opacity-60"
              >
                {verify2FAMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري التحقق...
                  </span>
                ) : (
                  "تأكيد"
                )}
              </Button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full flex items-center justify-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors pt-1"
              >
                <ArrowRight className="w-4 h-4" />
                العودة لتسجيل الدخول
              </button>
            </form>
          )}
        </div>

        {/* Back to website */}
        <a
          href="/"
          className="text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          العودة إلى الموقع الرئيسي
        </a>

        {/* Footer */}
        <p className="text-xs text-white/20 text-center mt-2">
          شركة القاسم العقارية &copy; {new Date().getFullYear()} - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
