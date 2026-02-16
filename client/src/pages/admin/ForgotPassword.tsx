import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Mail, ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { DEFAULT_ADMIN_LOGO } from "@/lib/branding";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const requestReset = trpc.admin.requestPasswordReset.useMutation({
    onSuccess: () => {
      setSent(true);
      setError("");
    },
    onError: (err) => {
      setError(err.message || "حدث خطأ. حاول مرة أخرى");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("البريد الإلكتروني مطلوب");
      return;
    }
    setError("");
    requestReset.mutate({ email, origin: window.location.origin });
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
            <img loading="lazy" src={DEFAULT_ADMIN_LOGO} alt="القاسم العقارية" className="w-16 h-16 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-1">
              نسيت كلمة المرور
            </h1>
            <p className="text-sm text-white/50">
              أدخل بريدك الإلكتروني لاستعادة حسابك
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-lg font-bold text-white">تم إرسال رابط الاستعادة</h2>
              <p className="text-white/60 text-sm leading-relaxed">
                إذا كان البريد الإلكتروني مسجلاً في النظام، ستصلك رسالة تحتوي على رابط لإعادة تعيين كلمة المرور.
              </p>
              <p className="text-white/40 text-xs">
                الرابط صالح لمدة ساعة واحدة فقط
              </p>
              <div className="pt-2 space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => { setSent(false); setEmail(""); }}
                >
                  إرسال رابط جديد
                </Button>
                <a
                  href="/admin/login"
                  className="flex items-center justify-center gap-2 text-sm text-[#c8a45e] hover:text-[#d4b36e] transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  العودة لتسجيل الدخول
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80 text-sm font-medium">
                  البريد الإلكتروني
                </Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="أدخل بريدك الإلكتروني"
                    className="pr-11 pl-4 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#c8a45e] focus:ring-[#c8a45e]/30 transition-all"
                    autoComplete="email"
                    autoFocus
                    dir="ltr"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={requestReset.isPending}
                className="w-full h-12 bg-[#c8a45e] text-[#0f1b33] hover:bg-[#d4b36e] font-bold shadow-lg text-base rounded-xl transition-all duration-200 hover:shadow-[#c8a45e]/20 hover:shadow-xl disabled:opacity-60"
              >
                {requestReset.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الإرسال...
                  </span>
                ) : (
                  "إرسال رابط الاستعادة"
                )}
              </Button>
            </form>
          )}
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
