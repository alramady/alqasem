import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useLocation } from "wouter";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { Phone, Lock, Eye, EyeOff, Loader2, KeyRound, ArrowLeft, ArrowRight } from "lucide-react";

type LoginMode = "password" | "otp";
type OtpStep = "phone" | "verify";

export default function CustomerLogin() {
  const { t, isAr } = useLanguage();
  const { refetch } = useCustomerAuth();
  const [, navigate] = useLocation();

  const [mode, setMode] = useState<LoginMode>("password");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");

  const loginMutation = trpc.customer.login.useMutation({
    onSuccess: () => {
      toast.success(t("account.loginSuccess"));
      refetch();
      navigate("/account");
    },
    onError: (err) => toast.error(err.message),
  });

  const sendOtpMutation = trpc.customer.sendOTP.useMutation({
    onSuccess: () => {
      toast.success(t("account.otpSent"));
      setOtpStep("verify");
    },
    onError: (err) => toast.error(err.message),
  });

  const verifyOtpMutation = trpc.customer.verifyOTPLogin.useMutation({
    onSuccess: () => {
      toast.success(t("account.loginSuccess"));
      refetch();
      navigate("/account");
    },
    onError: (err) => toast.error(err.message),
  });

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;
    loginMutation.mutate({ phone, password });
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    sendOtpMutation.mutate({ phone, purpose: "login" });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !otpCode) return;
    verifyOtpMutation.mutate({ phone, code: otpCode });
  };

  const isLoading = loginMutation.isPending || sendOtpMutation.isPending || verifyOtpMutation.isPending;
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <Navbar />
      <section className="pt-32 pb-16">
        <div className="container max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#0f1b33] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-[#c8a45e]" />
              </div>
              <h1 className="text-2xl font-bold text-[#0f1b33]">{t("account.login")}</h1>
              <p className="text-gray-500 mt-2 text-sm">
                {isAr ? "سجل دخولك لإدارة عقاراتك المفضلة" : "Login to manage your favorite properties"}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => { setMode("password"); setOtpStep("phone"); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${mode === "password" ? "bg-white text-[#0f1b33] shadow-sm" : "text-gray-500"}`}
              >
                {t("account.loginWithPassword")}
              </button>
              <button
                onClick={() => { setMode("otp"); setOtpStep("phone"); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${mode === "otp" ? "bg-white text-[#0f1b33] shadow-sm" : "text-gray-500"}`}
              >
                {t("account.loginWithOtp")}
              </button>
            </div>

            {/* Password Login */}
            {mode === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t("account.phone")}</label>
                  <div className="relative">
                    <Phone className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" style={{ insetInlineStart: "0.75rem" }} />
                    <input
                      type="tel"
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t("account.phonePlaceholder")}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                      style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "0.75rem" }}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t("account.password")}</label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" style={{ insetInlineStart: "0.75rem" }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("account.passwordPlaceholder")}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                      style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "2.5rem" }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      style={{ insetInlineEnd: "0.75rem" }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#E31E24] hover:bg-[#c91a1f] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t("account.login")}
                </button>
              </form>
            )}

            {/* OTP Login */}
            {mode === "otp" && otpStep === "phone" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t("account.phone")}</label>
                  <div className="relative">
                    <Phone className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" style={{ insetInlineStart: "0.75rem" }} />
                    <input
                      type="tel"
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t("account.phonePlaceholder")}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                      style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "0.75rem" }}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#E31E24] hover:bg-[#c91a1f] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t("account.sendOtp")}
                </button>
              </form>
            )}

            {mode === "otp" && otpStep === "verify" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setOtpStep("phone")}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0f1b33] transition-colors mb-2"
                >
                  <BackArrow className="w-3.5 h-3.5" />
                  {isAr ? "تغيير الرقم" : "Change number"}
                </button>
                <p className="text-sm text-gray-600 mb-2">
                  {isAr ? `تم إرسال رمز التحقق إلى ${phone}` : `Verification code sent to ${phone}`}
                </p>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t("account.otp")}</label>
                  <div className="relative">
                    <KeyRound className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" style={{ insetInlineStart: "0.75rem" }} />
                    <input
                      type="text"
                      dir="ltr"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder={t("account.otpPlaceholder")}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                      style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "0.75rem" }}
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full bg-[#E31E24] hover:bg-[#c91a1f] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t("account.verify")}
                </button>
                <button
                  type="button"
                  onClick={() => sendOtpMutation.mutate({ phone, purpose: "login" })}
                  disabled={sendOtpMutation.isPending}
                  className="w-full text-sm text-[#c8a45e] hover:text-[#b08f4e] font-medium transition-colors"
                >
                  {t("account.resendOtp")}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">{t("account.or")}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {t("account.noAccount")}{" "}
                <Link href="/register" className="text-[#E31E24] hover:text-[#c91a1f] font-semibold">
                  {t("account.register")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
