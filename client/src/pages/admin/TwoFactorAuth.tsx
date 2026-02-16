import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck, ShieldOff, QrCode, Copy, CheckCircle, AlertTriangle,
  Loader2, Eye, EyeOff, KeyRound, RefreshCw, ArrowRight, Lock
} from "lucide-react";

export default function TwoFactorAuth() {
  const { data: status, isLoading, refetch } = trpc.admin.get2FAStatus.useQuery();
  const setupMutation = trpc.admin.setup2FA.useMutation();
  const verifySetupMutation = trpc.admin.verify2FASetup.useMutation();
  const disableMutation = trpc.admin.disable2FA.useMutation();
  const regenBackupMutation = trpc.admin.regenerateBackupCodes.useMutation();

  const [step, setStep] = useState<"idle" | "setup" | "verify" | "backup" | "disable" | "regen">("idle");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const handleStartSetup = async () => {
    try {
      const result = await setupMutation.mutateAsync();
      setQrCode(result.qrCodeDataUrl);
      setSecret(result.secret);
      setStep("setup");
    } catch (err: any) {
      toast.error(err.message || "فشل في بدء الإعداد");
    }
  };

  const handleVerifySetup = async () => {
    if (verifyCode.length < 6) {
      toast.error("أدخل رمز التحقق المكون من 6 أرقام");
      return;
    }
    try {
      const result = await verifySetupMutation.mutateAsync({ code: verifyCode });
      setBackupCodes(result.backupCodes);
      setStep("backup");
      toast.success("تم تفعيل التحقق الثنائي بنجاح");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "رمز التحقق غير صحيح");
      setVerifyCode("");
    }
  };

  const handleDisable = async () => {
    if (!password) {
      toast.error("أدخل كلمة المرور");
      return;
    }
    try {
      await disableMutation.mutateAsync({ password });
      toast.success("تم تعطيل التحقق الثنائي");
      setStep("idle");
      setPassword("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "فشل في تعطيل التحقق الثنائي");
    }
  };

  const handleRegenBackup = async () => {
    if (!password) {
      toast.error("أدخل كلمة المرور");
      return;
    }
    try {
      const result = await regenBackupMutation.mutateAsync({ password });
      setBackupCodes(result.backupCodes);
      setStep("backup");
      setPassword("");
      toast.success("تم إنشاء رموز استرداد جديدة");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "فشل في إنشاء رموز الاسترداد");
    }
  };

  const copyToClipboard = (text: string, type: "secret" | "codes") => {
    navigator.clipboard.writeText(text);
    if (type === "secret") { setCopiedSecret(true); setTimeout(() => setCopiedSecret(false), 2000); }
    else { setCopiedCodes(true); setTimeout(() => setCopiedCodes(false), 2000); }
    toast.success("تم النسخ");
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8a45e]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-[#c8a45e]/10 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-[#c8a45e]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">التحقق الثنائي (2FA)</h2>
          <p className="text-sm text-white/50">حماية إضافية لحسابك عند تسجيل الدخول</p>
        </div>
      </div>

      {/* Status Card */}
      <div className={`rounded-2xl border p-5 ${status?.enabled ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status?.enabled ? (
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            ) : (
              <ShieldOff className="w-6 h-6 text-amber-400" />
            )}
            <div>
              <p className="font-semibold text-white">
                {status?.enabled ? "التحقق الثنائي مفعّل" : "التحقق الثنائي غير مفعّل"}
              </p>
              {status?.enabled && (
                <p className="text-sm text-white/50">
                  رموز الاسترداد المتبقية: {status.backupCodesRemaining}
                </p>
              )}
            </div>
          </div>
          {step === "idle" && (
            <div className="flex gap-2">
              {status?.enabled ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setStep("regen"); setPassword(""); }}
                    className="border-white/10 text-white/70 hover:text-white hover:bg-white/5"
                  >
                    <RefreshCw className="w-4 h-4 ml-1" />
                    رموز جديدة
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setStep("disable"); setPassword(""); }}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <ShieldOff className="w-4 h-4 ml-1" />
                    تعطيل
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleStartSetup}
                  disabled={setupMutation.isPending}
                  className="bg-[#c8a45e] text-[#0f1b33] hover:bg-[#d4b36e]"
                >
                  {setupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <ShieldCheck className="w-4 h-4 ml-1" />}
                  تفعيل التحقق الثنائي
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Setup Step: QR Code */}
      {step === "setup" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#c8a45e]" />
            الخطوة 1: مسح رمز QR
          </h3>
          <p className="text-sm text-white/60">
            افتح تطبيق المصادقة (Google Authenticator أو Authy) وامسح رمز QR أدناه
          </p>
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl p-4">
              <img loading="lazy" src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-white/40 text-center">أو أدخل المفتاح يدوياً:</p>
            <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/10">
              <code className="flex-1 text-sm text-[#c8a45e] font-mono text-center break-all" dir="ltr">{secret}</code>
              <button
                onClick={() => copyToClipboard(secret, "secret")}
                className="text-white/40 hover:text-white/70 transition-colors shrink-0"
              >
                {copiedSecret ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium">رمز التحقق من التطبيق</Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="h-14 text-center text-2xl tracking-[0.5em] bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:border-[#c8a45e] focus:ring-[#c8a45e]/30 font-mono"
              dir="ltr"
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleVerifySetup}
              disabled={verifySetupMutation.isPending || verifyCode.length < 6}
              className="flex-1 bg-[#c8a45e] text-[#0f1b33] hover:bg-[#d4b36e]"
            >
              {verifySetupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <CheckCircle className="w-4 h-4 ml-1" />}
              تأكيد التفعيل
            </Button>
            <Button
              variant="outline"
              onClick={() => { setStep("idle"); setVerifyCode(""); }}
              className="border-white/10 text-white/70 hover:text-white hover:bg-white/5"
            >
              إلغاء
            </Button>
          </div>
        </div>
      )}

      {/* Backup Codes */}
      {step === "backup" && backupCodes.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-white">رموز الاسترداد</h3>
              <p className="text-sm text-white/60 mt-1">
                احفظ هذه الرموز في مكان آمن. يمكنك استخدامها لتسجيل الدخول إذا فقدت الوصول لتطبيق المصادقة.
                <strong className="text-amber-400"> لن تظهر هذه الرموز مرة أخرى.</strong>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                <code className="text-sm font-mono text-white/80" dir="ltr">{code}</code>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => copyToClipboard(backupCodes.join("\n"), "codes")}
              variant="outline"
              className="flex-1 border-white/10 text-white/70 hover:text-white hover:bg-white/5"
            >
              {copiedCodes ? <CheckCircle className="w-4 h-4 ml-1 text-emerald-400" /> : <Copy className="w-4 h-4 ml-1" />}
              نسخ الرموز
            </Button>
            <Button
              onClick={() => { setStep("idle"); setBackupCodes([]); }}
              className="flex-1 bg-[#c8a45e] text-[#0f1b33] hover:bg-[#d4b36e]"
            >
              <CheckCircle className="w-4 h-4 ml-1" />
              تم الحفظ
            </Button>
          </div>
        </div>
      )}

      {/* Disable 2FA */}
      {step === "disable" && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShieldOff className="w-5 h-5 text-red-400" />
            تعطيل التحقق الثنائي
          </h3>
          <p className="text-sm text-white/60">
            سيؤدي تعطيل التحقق الثنائي إلى تقليل أمان حسابك. أدخل كلمة المرور للتأكيد.
          </p>
          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium">كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="pr-11 pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleDisable}
              disabled={disableMutation.isPending}
              className="flex-1 bg-red-500 text-white hover:bg-red-600"
            >
              {disableMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <ShieldOff className="w-4 h-4 ml-1" />}
              تعطيل
            </Button>
            <Button
              variant="outline"
              onClick={() => { setStep("idle"); setPassword(""); }}
              className="flex-1 border-white/10 text-white/70 hover:text-white hover:bg-white/5"
            >
              إلغاء
            </Button>
          </div>
        </div>
      )}

      {/* Regenerate Backup Codes */}
      {step === "regen" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#c8a45e]" />
            إنشاء رموز استرداد جديدة
          </h3>
          <p className="text-sm text-white/60">
            سيتم إلغاء جميع رموز الاسترداد القديمة وإنشاء رموز جديدة. أدخل كلمة المرور للتأكيد.
          </p>
          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium">كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="pr-11 pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleRegenBackup}
              disabled={regenBackupMutation.isPending}
              className="flex-1 bg-[#c8a45e] text-[#0f1b33] hover:bg-[#d4b36e]"
            >
              {regenBackupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <RefreshCw className="w-4 h-4 ml-1" />}
              إنشاء رموز جديدة
            </Button>
            <Button
              variant="outline"
              onClick={() => { setStep("idle"); setPassword(""); }}
              className="flex-1 border-white/10 text-white/70 hover:text-white hover:bg-white/5"
            >
              إلغاء
            </Button>
          </div>
        </div>
      )}

      {/* Info Section */}
      {step === "idle" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white/70">كيف يعمل التحقق الثنائي؟</h3>
          <div className="space-y-2 text-sm text-white/50">
            <p>1. عند تسجيل الدخول، ستحتاج لإدخال رمز من تطبيق المصادقة بالإضافة لكلمة المرور</p>
            <p>2. يتغير الرمز كل 30 ثانية مما يجعل اختراق حسابك أصعب بكثير</p>
            <p>3. احتفظ برموز الاسترداد في مكان آمن لاستخدامها عند فقدان الوصول للتطبيق</p>
          </div>
        </div>
      )}
    </div>
  );
}
