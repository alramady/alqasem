import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Save, Phone, Mail, MapPin, MessageCircle, Loader2, Image, Upload, Trash2, Palette, Globe, Building2, Award, FileCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { DEFAULT_LOGO, DEFAULT_ADMIN_LOGO } from "@/lib/branding";

export default function AdminSettings() {
  const { data: settings } = trpc.admin.getSettings.useQuery();
  const updateSettings = trpc.admin.updateSettings.useMutation({
    onSuccess: () => toast.success("تم حفظ الإعدادات"),
    onError: (err: any) => toast.error(err.message),
  });

  const [contact, setContact] = useState({ phone: "", email: "", whatsapp: "", address: "" });
  const [social, setSocial] = useState({ instagram: "", twitter: "", tiktok: "", snapchat: "", linkedin: "" });
  const [branding, setBranding] = useState({ logo: "", adminLogo: "", favicon: "", ogImage: "" });
  const [company, setCompany] = useState({ company_name: "", company_name_en: "", fal_number: "", cr_number: "", address_en: "", working_hours: "", working_hours_en: "", mobile: "" });

  useEffect(() => {
    if (settings) {
      const s = settings as Record<string, string>;
      setContact({ phone: s.phone || "", email: s.email || "", whatsapp: s.whatsapp || "", address: s.address || "" });
      setSocial({ instagram: s.instagram || "", twitter: s.twitter || "", tiktok: s.tiktok || "", snapchat: s.snapchat || "", linkedin: s.linkedin || "" });
      setBranding({
        logo: s.logo || "",
        adminLogo: s.adminLogo || "",
        favicon: s.favicon || "",
        ogImage: s.ogImage || "",
      });
      setCompany({
        company_name: s.company_name || "القاسم العقارية",
        company_name_en: s.company_name_en || "Al-Qasim Real Estate",
        fal_number: s.fal_number || "",
        cr_number: s.cr_number || "",
        address_en: s.address_en || "",
        working_hours: s.working_hours || "",
        working_hours_en: s.working_hours_en || "",
        mobile: s.mobile || "",
      });
    }
  }, [settings]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">الإعدادات</h1>
          <p className="text-slate-400 text-sm mt-0.5">إعدادات الموقع العامة</p>
        </div>

        <Tabs defaultValue="branding" dir="rtl">
          <TabsList className="bg-slate-100 p-1 rounded-xl flex-wrap h-auto gap-1">
            <TabsTrigger value="branding" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Palette className="w-4 h-4 ml-1.5" />الهوية البصرية
            </TabsTrigger>
            <TabsTrigger value="company" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Building2 className="w-4 h-4 ml-1.5" />بيانات الشركة
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">بيانات التواصل</TabsTrigger>
            <TabsTrigger value="social" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">وسائل التواصل</TabsTrigger>
            <TabsTrigger value="email" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">قوالب البريد</TabsTrigger>
          </TabsList>

          {/* ===== BRANDING TAB ===== */}
          <TabsContent value="branding" className="mt-4">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  الهوية البصرية — الشعارات والأيقونات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                {/* Main Logo */}
                <BrandingField
                  label="الشعار الرئيسي (Navbar + Footer)"
                  hint="يظهر في شريط التنقل والفوتر. يُفضل صورة شفافة PNG بعرض 200-400px"
                  value={branding.logo}
                  fallback={DEFAULT_LOGO}
                  onChange={(v) => setBranding({ ...branding, logo: v })}
                />

                {/* Admin Logo */}
                <BrandingField
                  label="شعار لوحة التحكم (Admin Panel)"
                  hint="يظهر في صفحة تسجيل الدخول والشريط الجانبي. يُفضل صورة شفافة PNG"
                  value={branding.adminLogo}
                  fallback={DEFAULT_ADMIN_LOGO}
                  onChange={(v) => setBranding({ ...branding, adminLogo: v })}
                />

                {/* Favicon */}
                <BrandingField
                  label="أيقونة المتصفح (Favicon)"
                  hint="تظهر في تبويب المتصفح. يُفضل صورة مربعة 32x32 أو 64x64 بصيغة PNG أو ICO"
                  value={branding.favicon}
                  fallback=""
                  onChange={(v) => setBranding({ ...branding, favicon: v })}
                  small
                />

                {/* OG Image */}
                <BrandingField
                  label="صورة المشاركة (Open Graph)"
                  hint="تظهر عند مشاركة الموقع على وسائل التواصل. يُفضل 1200x630px بصيغة PNG أو JPG"
                  value={branding.ogImage}
                  fallback=""
                  onChange={(v) => setBranding({ ...branding, ogImage: v })}
                  wide
                />

                <div className="pt-2 border-t border-slate-100">
                  <Button
                    className="bg-indigo-500 text-white hover:bg-indigo-600 rounded-lg"
                    onClick={() => updateSettings.mutate({ group: "branding", values: branding })}
                    disabled={updateSettings.isPending}
                  >
                    {updateSettings.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                    {updateSettings.isPending ? "جاري الحفظ..." : "حفظ الهوية البصرية"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== COMPANY TAB ===== */}
          <TabsContent value="company" className="mt-4">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  بيانات الشركة والتراخيص
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-sm">اسم الشركة (عربي)</Label>
                    <Input value={company.company_name} onChange={(e) => setCompany({...company, company_name: e.target.value})} placeholder="القاسم العقارية" className="border-slate-200 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-sm">اسم الشركة (إنجليزي)</Label>
                    <Input value={company.company_name_en} onChange={(e) => setCompany({...company, company_name_en: e.target.value})} dir="ltr" placeholder="Al-Qasim Real Estate" className="border-slate-200 rounded-lg" />
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-sm text-amber-800">التراخيص والاعتمادات</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-amber-700 text-sm font-semibold">رقم رخصة فال (FAL)</Label>
                      <Input value={company.fal_number} onChange={(e) => setCompany({...company, fal_number: e.target.value})} dir="ltr" placeholder="مثال: 1200XXXXXX" className="border-amber-200 rounded-lg bg-white" />
                      <p className="text-xs text-amber-600">رقم ترخيص الهيئة العامة للعقار — يظهر في الفوتر وصفحة التراخيص</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-amber-700 text-sm font-semibold">رقم السجل التجاري (CR)</Label>
                      <Input value={company.cr_number} onChange={(e) => setCompany({...company, cr_number: e.target.value})} dir="ltr" placeholder="مثال: 1010XXXXXX" className="border-amber-200 rounded-lg bg-white" />
                      <p className="text-xs text-amber-600">رقم السجل التجاري — يظهر في صفحة التراخيص</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-sm">رقم الجوال</Label>
                    <Input value={company.mobile} onChange={(e) => setCompany({...company, mobile: e.target.value})} dir="ltr" placeholder="0500051679" className="border-slate-200 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-sm">العنوان (إنجليزي)</Label>
                    <Input value={company.address_en} onChange={(e) => setCompany({...company, address_en: e.target.value})} dir="ltr" placeholder="Riyadh, Saudi Arabia" className="border-slate-200 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-sm">ساعات العمل (عربي)</Label>
                    <Input value={company.working_hours} onChange={(e) => setCompany({...company, working_hours: e.target.value})} placeholder="الأحد - الخميس: 9 ص - 6 م" className="border-slate-200 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-sm">ساعات العمل (إنجليزي)</Label>
                    <Input value={company.working_hours_en} onChange={(e) => setCompany({...company, working_hours_en: e.target.value})} dir="ltr" placeholder="Sun - Thu: 9 AM - 6 PM" className="border-slate-200 rounded-lg" />
                  </div>
                </div>
                <Button
                  className="bg-indigo-500 text-white hover:bg-indigo-600 rounded-lg"
                  onClick={() => updateSettings.mutate({ group: "company", values: company })}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                  {updateSettings.isPending ? "جاري الحفظ..." : "حفظ بيانات الشركة"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== CONTACT TAB ===== */}
          <TabsContent value="contact" className="mt-4">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-500" />
                  بيانات التواصل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-sm">رقم الهاتف الموحد</Label>
                    <Input value={contact.phone} onChange={(e) => setContact({...contact, phone: e.target.value})} dir="ltr" placeholder="920001911" className="border-slate-200 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-sm">البريد الإلكتروني</Label>
                    <Input value={contact.email} onChange={(e) => setContact({...contact, email: e.target.value})} dir="ltr" placeholder="info@alqasem.com.sa" className="border-slate-200 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-sm">رقم الواتساب</Label>
                    <Input value={contact.whatsapp} onChange={(e) => setContact({...contact, whatsapp: e.target.value})} dir="ltr" placeholder="+966xxxxxxxxx" className="border-slate-200 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 text-sm">العنوان</Label>
                  <Textarea value={contact.address} onChange={(e) => setContact({...contact, address: e.target.value})} rows={2} className="border-slate-200 rounded-lg" />
                </div>
                <Button
                  className="bg-indigo-500 text-white hover:bg-indigo-600 rounded-lg"
                  onClick={() => updateSettings.mutate({ group: "contact", values: contact })}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                  {updateSettings.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== SOCIAL TAB ===== */}
          <TabsContent value="social" className="mt-4">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-indigo-500" />
                  وسائل التواصل الاجتماعي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-sm">Instagram</Label>
                    <Input value={social.instagram} onChange={(e) => setSocial({...social, instagram: e.target.value})} dir="ltr" placeholder="https://instagram.com/alqasem_sa" className="border-slate-200 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-sm">X (Twitter)</Label>
                    <Input value={social.twitter} onChange={(e) => setSocial({...social, twitter: e.target.value})} dir="ltr" placeholder="https://x.com/alqasem_sa" className="border-slate-200 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-sm">TikTok</Label>
                    <Input value={social.tiktok} onChange={(e) => setSocial({...social, tiktok: e.target.value})} dir="ltr" placeholder="https://tiktok.com/@alqasem_sa" className="border-slate-200 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-sm">Snapchat</Label>
                    <Input value={social.snapchat} onChange={(e) => setSocial({...social, snapchat: e.target.value})} dir="ltr" className="border-slate-200 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-sm">LinkedIn</Label>
                    <Input value={social.linkedin} onChange={(e) => setSocial({...social, linkedin: e.target.value})} dir="ltr" className="border-slate-200 rounded-lg" />
                  </div>
                </div>
                <Button
                  className="bg-indigo-500 text-white hover:bg-indigo-600 rounded-lg"
                  onClick={() => updateSettings.mutate({ group: "social", values: social })}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                  {updateSettings.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== EMAIL TEMPLATES TAB ===== */}
          <TabsContent value="email" className="mt-4">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  قوالب البريد الإلكتروني
                </CardTitle>
              </CardHeader>
              <CardContent className="py-6 space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <h3 className="font-semibold text-sm text-slate-700 mb-2">قالب إعادة تعيين كلمة المرور</h3>
                    <p className="text-xs text-slate-400 mb-3">يُرسل عند طلب إعادة تعيين كلمة المرور. المتغيرات: {'{resetLink}'}, {'{userName}'}, {'{expiryTime}'}</p>
                    <Textarea rows={4} defaultValue="مرحباً {userName},\n\nلقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. اضغط على الرابط التالي:\n{resetLink}\n\nهذا الرابط صالح لمدة {expiryTime}." className="text-sm" />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <h3 className="font-semibold text-sm text-slate-700 mb-2">قالب ترحيب المستخدم الجديد</h3>
                    <p className="text-xs text-slate-400 mb-3">يُرسل عند إنشاء حساب جديد. المتغيرات: {'{userName}'}, {'{loginUrl}'}</p>
                    <Textarea rows={4} defaultValue="مرحباً بك {userName} في القاسم العقارية!\n\nتم إنشاء حسابك بنجاح. يمكنك تسجيل الدخول من هنا:\n{loginUrl}" className="text-sm" />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <h3 className="font-semibold text-sm text-slate-700 mb-2">قالب إشعار الطلب الجديد</h3>
                    <p className="text-xs text-slate-400 mb-3">يُرسل للمدير عند ورود طلب جديد. المتغيرات: {'{inquiryName}'}, {'{inquiryEmail}'}, {'{propertyTitle}'}, {'{inquiryMessage}'}</p>
                    <Textarea rows={4} defaultValue="طلب جديد من {inquiryName}\n\nالعقار: {propertyTitle}\nالبريد: {inquiryEmail}\nالرسالة: {inquiryMessage}" className="text-sm" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => toast.success("تم حفظ قوالب البريد")} className="bg-indigo-600 hover:bg-indigo-700">
                    <Save className="w-4 h-4 ml-2" />حفظ القوالب
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

/** Reusable branding field with URL input + preview */
function BrandingField({
  label,
  hint,
  value,
  fallback,
  onChange,
  small,
  wide,
}: {
  label: string;
  hint: string;
  value: string;
  fallback: string;
  onChange: (v: string) => void;
  small?: boolean;
  wide?: boolean;
}) {
  const previewUrl = value || fallback;
  const previewSize = small ? "w-12 h-12" : wide ? "w-64 h-32" : "w-24 h-24";

  return (
    <div className="flex flex-col md:flex-row gap-5 items-start">
      {/* Preview */}
      <div className={`${previewSize} rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 shrink-0 overflow-hidden`}>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={label}
            className="max-w-full max-h-full object-contain p-1"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div className={`flex flex-col items-center gap-1 text-slate-300 ${previewUrl ? "hidden" : ""}`}>
          <Image className="w-6 h-6" />
          <span className="text-[10px]">لا يوجد</span>
        </div>
      </div>

      {/* Input */}
      <div className="flex-1 space-y-2 w-full">
        <Label className="text-slate-700 font-semibold text-sm">{label}</Label>
        <p className="text-xs text-slate-400">{hint}</p>
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            dir="ltr"
            placeholder="https://example.com/logo.png"
            className="border-slate-200 rounded-lg flex-1 text-sm"
          />
          {value && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 border-slate-200"
              onClick={() => onChange("")}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        {value && (
          <p className="text-[11px] text-green-600 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            شعار مخصص — سيتم استخدامه بدلاً من الشعار الافتراضي
          </p>
        )}
        {!value && fallback && (
          <p className="text-[11px] text-slate-400">
            يُستخدم الشعار الافتراضي حالياً. أضف رابط صورة لاستبداله.
          </p>
        )}
      </div>
    </div>
  );
}
