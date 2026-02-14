import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useLocation } from "wouter";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import {
  User, Phone, Mail, Lock, Edit3, Heart, LogOut, Loader2,
  Eye, EyeOff, Save, X, Calendar, Shield, ChevronLeft, ChevronRight
} from "lucide-react";

type Tab = "profile" | "password" | "favorites";

export default function CustomerAccount() {
  const { t, isAr } = useLanguage();
  const { customer, isLoading: authLoading, isLoggedIn, refetch } = useCustomerAuth();
  const [, navigate] = useLocation();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const BackArrow = isAr ? ChevronRight : ChevronLeft;

  useEffect(() => {
    if (customer) {
      setName(customer.name || "");
      setEmail(customer.email || "");
    }
  }, [customer]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [authLoading, isLoggedIn, navigate]);

  const updateProfileMutation = trpc.customer.updateProfile.useMutation({
    onSuccess: () => {
      toast.success(t("account.profileUpdated"));
      refetch();
      setEditMode(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const changePasswordMutation = trpc.customer.changePassword.useMutation({
    onSuccess: () => {
      toast.success(t("account.passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: (err) => toast.error(err.message),
  });

  const logoutMutation = trpc.customer.logout.useMutation({
    onSuccess: () => {
      toast.success(t("account.logoutSuccess"));
      refetch();
      navigate("/");
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name, email: email || undefined });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error(isAr ? "كلمة المرور 6 أحرف على الأقل" : "Password must be at least 6 characters");
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8f5f0]">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <Loader2 className="w-8 h-8 text-[#c8a45e] animate-spin" />
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "profile", label: t("account.editProfile"), icon: User },
    { id: "password", label: t("account.changePassword"), icon: Lock },
    { id: "favorites", label: t("account.myFavorites"), icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <Navbar />
      <section className="pt-32 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-[#0f1b33] to-[#1a2b4a] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {customer.name ? customer.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
              </div>
              <div className="flex-1 text-center sm:text-start">
                <h1 className="text-xl font-bold text-[#0f1b33]">
                  {t("account.welcome")}، {customer.name || t("account.guestUser")}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span dir="ltr">{customer.phone}</span>
                  </span>
                  {customer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {customer.email}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {t("account.memberSince")} {new Date(customer.createdAt).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "long" })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t("account.logout")}
              </button>
            </div>
          </div>

          {/* Tabs + Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar Tabs */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-2 flex md:flex-col gap-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-[#0f1b33] text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <tab.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="md:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-[#0f1b33]">{t("account.editProfile")}</h2>
                      {!editMode && (
                        <button
                          onClick={() => setEditMode(true)}
                          className="flex items-center gap-1.5 text-sm text-[#c8a45e] hover:text-[#b08f4e] font-medium"
                        >
                          <Edit3 className="w-4 h-4" />
                          {isAr ? "تعديل" : "Edit"}
                        </button>
                      )}
                    </div>

                    {editMode ? (
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t("account.name")}</label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t("account.email")}</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t("account.emailPlaceholder")}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30"
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            type="submit"
                            disabled={updateProfileMutation.isPending}
                            className="flex items-center gap-2 bg-[#E31E24] hover:bg-[#c91a1f] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                          >
                            {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {t("account.save")}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditMode(false); setName(customer.name || ""); setEmail(customer.email || ""); }}
                            className="px-6 py-2.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl"
                          >
                            {t("account.cancel")}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                          <User className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-400">{t("account.name")}</p>
                            <p className="text-sm font-medium text-[#0f1b33]">{customer.name || "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-400">{t("account.phone")}</p>
                            <p className="text-sm font-medium text-[#0f1b33]" dir="ltr">{customer.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-400">{t("account.email")}</p>
                            <p className="text-sm font-medium text-[#0f1b33]">{customer.email || "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                          <Shield className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-400">{isAr ? "حالة التحقق" : "Verification"}</p>
                            <p className={`text-sm font-medium ${customer.isVerified ? "text-green-600" : "text-orange-500"}`}>
                              {customer.isVerified ? (isAr ? "✓ موثق" : "✓ Verified") : (isAr ? "غير موثق" : "Not verified")}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Password Tab */}
                {activeTab === "password" && (
                  <div>
                    <h2 className="text-lg font-bold text-[#0f1b33] mb-6">{t("account.changePassword")}</h2>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t("account.currentPassword")}</label>
                        <div className="relative">
                          <input
                            type={showCurrentPw ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30"
                            style={{ paddingInlineEnd: "2.5rem" }}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPw(!showCurrentPw)}
                            className="absolute top-1/2 -translate-y-1/2 text-gray-400"
                            style={{ insetInlineEnd: "0.75rem" }}
                          >
                            {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t("account.newPassword")}</label>
                        <div className="relative">
                          <input
                            type={showNewPw ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30"
                            style={{ paddingInlineEnd: "2.5rem" }}
                            minLength={6}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw(!showNewPw)}
                            className="absolute top-1/2 -translate-y-1/2 text-gray-400"
                            style={{ insetInlineEnd: "0.75rem" }}
                          >
                            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="flex items-center gap-2 bg-[#E31E24] hover:bg-[#c91a1f] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {changePasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {t("account.changePassword")}
                      </button>
                    </form>
                  </div>
                )}

                {/* Favorites Tab */}
                {activeTab === "favorites" && (
                  <div>
                    <h2 className="text-lg font-bold text-[#0f1b33] mb-4">{t("account.myFavorites")}</h2>
                    <p className="text-gray-500 text-sm mb-4">
                      {isAr ? "عقاراتك المفضلة محفوظة ومتزامنة مع حسابك" : "Your favorite properties are saved and synced with your account"}
                    </p>
                    <Link
                      href="/favorites"
                      className="inline-flex items-center gap-2 bg-[#0f1b33] hover:bg-[#1a2b4a] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      {t("account.savedProperties")}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
