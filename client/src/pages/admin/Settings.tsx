import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Save, Phone, Mail, MapPin, MessageCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function AdminSettings() {
  const { data: settings } = trpc.admin.getSettings.useQuery();
  const updateSettings = trpc.admin.updateSettings.useMutation({
    onSuccess: () => toast.success("تم حفظ الإعدادات"),
    onError: (err: any) => toast.error(err.message),
  });

  const [contact, setContact] = useState({ phone: "", email: "", whatsapp: "", address: "" });
  const [social, setSocial] = useState({ instagram: "", twitter: "", tiktok: "", snapchat: "", linkedin: "" });

  useEffect(() => {
    if (settings) {
      const s = settings as Record<string, string>;
      setContact({ phone: s.phone || "", email: s.email || "", whatsapp: s.whatsapp || "", address: s.address || "" });
      setSocial({ instagram: s.instagram || "", twitter: s.twitter || "", tiktok: s.tiktok || "", snapchat: s.snapchat || "", linkedin: s.linkedin || "" });
    }
  }, [settings]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">الإعدادات</h1>
          <p className="text-slate-400 text-sm mt-0.5">إعدادات الموقع العامة</p>
        </div>

        <Tabs defaultValue="contact" dir="rtl">
          <TabsList className="bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="contact" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">بيانات التواصل</TabsTrigger>
            <TabsTrigger value="social" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">وسائل التواصل</TabsTrigger>
            <TabsTrigger value="email" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">قوالب البريد</TabsTrigger>
          </TabsList>

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
