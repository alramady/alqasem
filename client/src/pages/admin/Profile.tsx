import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { User, Lock, Mail, Phone, Shield, Save, Eye, EyeOff, CheckCircle, Clock, KeyRound } from "lucide-react";

export default function AdminProfile() {
  const { data: profile, isLoading, refetch } = trpc.admin.getMyProfile.useQuery();
  const updateProfile = trpc.admin.updateProfile.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      setIsEditingProfile(false);
    },
    onError: (err) => toast.error(err.message),
  });
  const changePassword = trpc.admin.changePassword.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const startEditing = () => {
    if (profile) {
      setDisplayName(profile.displayName || profile.fullName || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
    }
    setIsEditingProfile(true);
  };

  const handleUpdateProfile = () => {
    const data: { displayName?: string; email?: string; phone?: string } = {};
    if (displayName) data.displayName = displayName;
    if (email) data.email = email;
    if (phone) data.phone = phone;
    updateProfile.mutate(data);
  };

  const handleChangePassword = () => {
    if (newPassword.length < 6) {
      toast.error("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("كلمة المرور الجديدة وتأكيدها غير متطابقتين");
      return;
    }
    changePassword.mutate({ currentPassword, newPassword, confirmPassword });
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: "bg-red-100 text-red-700 border-red-200",
      manager: "bg-amber-100 text-amber-700 border-amber-200",
      staff: "bg-blue-100 text-blue-700 border-blue-200",
      user: "bg-gray-100 text-gray-700 border-gray-200",
    };
    const labels: Record<string, string> = {
      admin: "مدير النظام",
      manager: "مدير",
      staff: "موظف",
      user: "مستخدم",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[role] || styles.user}`}>
        <Shield className="w-3 h-3" />
        {labels[role] || role}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0f1b33] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1b33]">
            الملف الشخصي
          </h1>
          <p className="text-gray-500 text-sm mt-1">إدارة بيانات حسابك وتغيير كلمة المرور</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-[#0f1b33] to-[#1a2d4f] p-6 text-center">
              <div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-[#c8a45e]/50 mb-3">
                <span className="text-3xl font-bold text-white">
                  {(profile?.displayName || profile?.fullName || profile?.username || "U")[0].toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{profile?.displayName || profile?.fullName || profile?.username}</h3>
              <p className="text-white/60 text-sm mt-1">@{profile?.username || "—"}</p>
              <div className="mt-3">{getRoleBadge(profile?.role || "user")}</div>
            </div>

            {/* Profile Info */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-[#c8a45e]" />
                <span className="text-gray-600">{profile?.email || "لم يتم تحديده"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-[#c8a45e]" />
                <span className="text-gray-600">{profile?.phone || "لم يتم تحديده"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-[#c8a45e]" />
                <span className="text-gray-600">
                  آخر تسجيل دخول: {profile?.lastSignedIn ? new Date(profile.lastSignedIn).toLocaleDateString("ar-SA") : "—"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-[#c8a45e]" />
                <span className="text-gray-600">
                  تاريخ الإنشاء: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("ar-SA") : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Edit */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0f1b33]/5 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-[#0f1b33]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0f1b33]">البيانات الشخصية</h3>
                  <p className="text-xs text-gray-400">تعديل الاسم والبريد والهاتف</p>
                </div>
              </div>
              {!isEditingProfile && (
                <button onClick={startEditing} className="text-sm text-[#0f1b33] hover:text-[#c8a45e] font-medium transition-colors">
                  تعديل
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم المعروض</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c8a45e]/20 focus:border-[#c8a45e] outline-none transition-all text-sm"
                    placeholder="أدخل الاسم المعروض"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c8a45e]/20 focus:border-[#c8a45e] outline-none transition-all text-sm"
                    placeholder="example@email.com"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c8a45e]/20 focus:border-[#c8a45e] outline-none transition-all text-sm"
                    placeholder="+966XXXXXXXXX"
                    dir="ltr"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={updateProfile.isPending}
                    className="flex items-center gap-2 bg-[#0f1b33] hover:bg-[#1a2d4f] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {updateProfile.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </button>
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                  <span className="text-sm text-gray-500">الاسم المعروض</span>
                  <span className="text-sm font-medium text-[#0f1b33]">{profile?.displayName || profile?.fullName || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                  <span className="text-sm text-gray-500">اسم المستخدم</span>
                  <span className="text-sm font-medium text-[#0f1b33]" dir="ltr">{profile?.username || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                  <span className="text-sm text-gray-500">البريد الإلكتروني</span>
                  <span className="text-sm font-medium text-[#0f1b33]" dir="ltr">{profile?.email || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500">رقم الهاتف</span>
                  <span className="text-sm font-medium text-[#0f1b33]" dir="ltr">{profile?.phone || "—"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0f1b33]">تغيير كلمة المرور</h3>
                  <p className="text-xs text-gray-400">تحديث كلمة المرور الخاصة بحسابك</p>
                </div>
              </div>
              {!showChangePassword && (
                <button onClick={() => setShowChangePassword(true)} className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">
                  تغيير
                </button>
              )}
            </div>

            {showChangePassword ? (
              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور الحالية</label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c8a45e]/20 focus:border-[#c8a45e] outline-none transition-all text-sm pl-10"
                      placeholder="أدخل كلمة المرور الحالية"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور الجديدة</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c8a45e]/20 focus:border-[#c8a45e] outline-none transition-all text-sm pl-10"
                      placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword.length > 0 && newPassword.length < 6 && (
                    <p className="text-xs text-red-500 mt-1">كلمة المرور يجب أن تكون 6 أحرف على الأقل</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">تأكيد كلمة المرور الجديدة</label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c8a45e]/20 focus:border-[#c8a45e] outline-none transition-all text-sm pl-10"
                      placeholder="أعد إدخال كلمة المرور الجديدة"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">كلمة المرور غير متطابقة</p>
                  )}
                </div>

                {/* Password Strength Indicator */}
                {newPassword.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-medium text-gray-600 mb-2">متطلبات كلمة المرور:</p>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className={`w-3.5 h-3.5 ${newPassword.length >= 6 ? "text-green-500" : "text-gray-300"}`} />
                      <span className={newPassword.length >= 6 ? "text-green-600" : "text-gray-400"}>6 أحرف على الأقل</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className={`w-3.5 h-3.5 ${/[A-Z]/.test(newPassword) ? "text-green-500" : "text-gray-300"}`} />
                      <span className={/[A-Z]/.test(newPassword) ? "text-green-600" : "text-gray-400"}>حرف كبير واحد على الأقل</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className={`w-3.5 h-3.5 ${/[0-9]/.test(newPassword) ? "text-green-500" : "text-gray-300"}`} />
                      <span className={/[0-9]/.test(newPassword) ? "text-green-600" : "text-gray-400"}>رقم واحد على الأقل</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className={`w-3.5 h-3.5 ${newPassword === confirmPassword && confirmPassword.length > 0 ? "text-green-500" : "text-gray-300"}`} />
                      <span className={newPassword === confirmPassword && confirmPassword.length > 0 ? "text-green-600" : "text-gray-400"}>تأكيد كلمة المرور متطابق</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={changePassword.isPending || newPassword.length < 6 || newPassword !== confirmPassword}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4" />
                    {changePassword.isPending ? "جاري التغيير..." : "تغيير كلمة المرور"}
                  </button>
                  <button
                    onClick={() => {
                      setShowChangePassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">كلمة المرور محمية ومشفرة</p>
                    <p className="text-xs text-gray-400 mt-0.5">آخر تغيير: غير محدد</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security Info */}
          <div className="bg-gradient-to-br from-[#0f1b33] to-[#1a2d4f] rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-[#c8a45e]" />
              <h3 className="font-bold text-lg">نصائح أمنية</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-[#c8a45e] mb-2">كلمة مرور قوية</h4>
                <p className="text-xs text-white/60 leading-relaxed">استخدم مزيجاً من الأحرف الكبيرة والصغيرة والأرقام والرموز الخاصة</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-[#c8a45e] mb-2">تغيير دوري</h4>
                <p className="text-xs text-white/60 leading-relaxed">قم بتغيير كلمة المرور كل 3 أشهر للحفاظ على أمان حسابك</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-[#c8a45e] mb-2">لا تشارك بياناتك</h4>
                <p className="text-xs text-white/60 leading-relaxed">لا تشارك اسم المستخدم أو كلمة المرور مع أي شخص آخر</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-[#c8a45e] mb-2">تسجيل الخروج</h4>
                <p className="text-xs text-white/60 leading-relaxed">تأكد من تسجيل الخروج عند استخدام أجهزة مشتركة أو عامة</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
