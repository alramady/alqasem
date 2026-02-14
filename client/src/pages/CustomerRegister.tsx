import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useLocation } from "wouter";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { Phone, Lock, Eye, EyeOff, Loader2, KeyRound, User, Mail, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

type Step = "info" | "otp" | "complete";

export default function CustomerRegister() {
  const { t, isAr } = useLanguage();
  const { refetch } = useCustomerAuth();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<Step>("info");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const sendOtpMutation = trpc.customer.sendOTP.useMutation({
    onSuccess: () => {
      toast.success(t("account.otpSent"));
      setStep("otp");
    },
    onError: (err) => toast.error(err.message),
  });

  const registerMutation = trpc.customer.verifyOTPAndRegister.useMutation({
    onSuccess: () => {
      toast.success(t("account.registerSuccess"));
      refetch();
      setStep("complete");
      setTimeout(() => navigate("/account"), 2000);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !name || !password) return;
    if (password !== confirmPassword) {
      toast.error(isAr ? "كلمة المرور غير متطابقة" : "Passwords don't match");
      return;
    }
    if (password.length < 6) {
      toast.error(isAr ? "كلمة المرور 6 أحرف على الأقل" : "Password must be at least 6 characters");
      return;
    }
    sendOtpMutation.mutate({ phone, purpose: "register" });
  };

  const handleVerifyAndRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) return;
    registerMutation.mutate({ phone, code: otpCode, name, email, password });
  };

  const isLoading = sendOtpMutation.isPending || registerMutation.isPending;
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
                <User className="w-7 h-7 text-[#c8a45e]" />
              </div>
              <h1 className="text-2xl font-bold text-[#0f1b33]">{t("account.register")}</h1>
              <p className="text-gray-500 mt-2 text-sm">
                {isAr ? "أنشئ حسابك لحفظ المفضلة ومتابعة العقارات" : "Create your account to save favorites and track properties"}
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {["info", "otp", "complete"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s ? "bg-[#E31E24] text-white" :
                    ["info", "otp", "complete"].indexOf(step) > i ? "bg-green-500 text-white" :
                    "bg-gray-200 text-gray-400"
                  }`}>
                    {["info", "otp", "complete"].indexOf(step) > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < 2 && <div className={`w-8 h-0.5 ${["info", "otp", "complete"].indexOf(step) > i ? "bg-green-500" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>

            {/* Step 1: Info */}
            {step === "info" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t("account.name")}</label>
                  <div className="relative">
                    <User className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" style={{ insetInlineStart: "0.75rem" }} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("account.namePlaceholder")}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                      style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "0.75rem" }}
                      required
                    />
                  </div>
                </div>
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
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t("account.email")}</label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" style={{ insetInlineStart: "0.75rem" }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("account.emailPlaceholder")}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                      style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "0.75rem" }}
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
                      minLength={6}
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
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t("account.confirmPassword")}</label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" style={{ insetInlineStart: "0.75rem" }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t("account.confirmPassword")}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                      style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "0.75rem" }}
                      minLength={6}
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

            {/* Step 2: OTP */}
            {step === "otp" && (
              <form onSubmit={handleVerifyAndRegister} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setStep("info")}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0f1b33] transition-colors mb-2"
                >
                  <BackArrow className="w-3.5 h-3.5" />
                  {isAr ? "العودة" : "Back"}
                </button>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                  <p className="text-sm text-blue-700">
                    {isAr ? `تم إرسال رمز التحقق إلى` : `Verification code sent to`}
                    <span dir="ltr" className="font-mono font-bold mx-1">{phone}</span>
                  </p>
                </div>
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
                      autoFocus
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
                  {t("account.register")}
                </button>
                <button
                  type="button"
                  onClick={() => sendOtpMutation.mutate({ phone, purpose: "register" })}
                  disabled={sendOtpMutation.isPending}
                  className="w-full text-sm text-[#c8a45e] hover:text-[#b08f4e] font-medium transition-colors"
                >
                  {t("account.resendOtp")}
                </button>
              </form>
            )}

            {/* Step 3: Complete */}
            {step === "complete" && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-[#0f1b33] mb-2">{t("account.registerSuccess")}</h2>
                <p className="text-gray-500 text-sm">
                  {isAr ? "جاري تحويلك لصفحة حسابك..." : "Redirecting to your account..."}
                </p>
              </div>
            )}

            {step !== "complete" && (
              <>
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">{t("account.or")}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    {t("account.hasAccount")}{" "}
                    <Link href="/login" className="text-[#E31E24] hover:text-[#c91a1f] font-semibold">
                      {t("account.login")}
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
