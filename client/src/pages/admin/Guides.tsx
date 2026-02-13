import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { BookOpen, Plus, ChevronLeft, Search, Clock, Tag, Eye } from "lucide-react";

const categoryLabels: Record<string, string> = {
  getting_started: "البداية", dashboard: "لوحة المعلومات", properties: "العقارات",
  projects: "المشاريع", cms: "إدارة المحتوى", users: "المستخدمون",
  settings: "الإعدادات", reports: "التقارير", media: "الوسائط",
  messages: "المراسلات", notifications: "التنبيهات", general: "عام",
};

const categoryColors: Record<string, string> = {
  getting_started: "bg-green-100 text-green-700", dashboard: "bg-blue-100 text-blue-700",
  properties: "bg-purple-100 text-purple-700", projects: "bg-amber-100 text-amber-700",
  cms: "bg-teal-100 text-teal-700", users: "bg-red-100 text-red-700",
  settings: "bg-gray-100 text-gray-700", reports: "bg-indigo-100 text-indigo-700",
  media: "bg-pink-100 text-pink-700", messages: "bg-cyan-100 text-cyan-700",
  notifications: "bg-orange-100 text-orange-700", general: "bg-slate-100 text-slate-700",
};

// Built-in default guides
const defaultGuides = [
  {
    title: "مرحباً بك في لوحة التحكم", slug: "welcome", category: "getting_started",
    content: `# مرحباً بك في لوحة تحكم القاسم العقارية 🏢

## نظرة عامة
لوحة التحكم هي مركز إدارة موقع القاسم العقارية. من خلالها يمكنك:

### 1. إدارة العقارات
- إضافة عقارات جديدة مع الصور والتفاصيل
- تعديل أو حذف العقارات الموجودة
- تصنيف العقارات حسب النوع والمنطقة

### 2. إدارة المشاريع
- عرض وتعديل المشاريع العقارية
- تتبع حالة كل مشروع

### 3. إدارة المحتوى
- تعديل صفحات الموقع
- التحكم بأقسام الصفحة الرئيسية
- إعدادات SEO

### 4. التواصل
- متابعة طلبات العملاء
- مركز التنبيهات
- المراسلات الداخلية

### 5. التقارير والإحصائيات
- تقارير شاملة عن الأداء
- تصدير البيانات

## نصائح سريعة
- استخدم القائمة الجانبية للتنقل بين الأقسام
- يمكنك طي القائمة بالضغط على أيقونة الأسهم
- جميع التغييرات يتم حفظها تلقائياً`,
  },
  {
    title: "كيفية إضافة عقار جديد", slug: "add-property", category: "properties",
    content: `# كيفية إضافة عقار جديد

## الخطوات:

### 1. الانتقال لصفحة العقارات
اضغط على "العقارات" في القائمة الجانبية

### 2. الضغط على "إضافة عقار"
ستظهر نافذة إضافة العقار الجديد

### 3. تعبئة البيانات الأساسية
- **العنوان**: اسم العقار (مثال: فيلا فاخرة في حي العليا)
- **النوع**: اختر نوع العقار (فيلا، شقة، أرض، مكتب)
- **الغرض**: بيع أو إيجار
- **السعر**: السعر بالريال السعودي
- **المساحة**: المساحة بالمتر المربع

### 4. تفاصيل إضافية
- عدد الغرف والحمامات
- الموقع والحي
- وصف تفصيلي للعقار

### 5. رفع الصور
- اضغط على "رفع صورة" لإضافة صور العقار
- يُفضل رفع 3-5 صور على الأقل

### 6. النشر
- اختر الحالة "نشط" لنشر العقار مباشرة
- أو "مسودة" لحفظه دون نشر`,
  },
  {
    title: "إدارة الصلاحيات والمستخدمين", slug: "manage-permissions", category: "users",
    content: `# إدارة الصلاحيات والمستخدمين

## أنواع المستخدمين

### المدير (Admin)
- صلاحيات كاملة على جميع الأقسام
- إدارة المستخدمين والصلاحيات
- الوصول لسجل النشاطات

### المشرف (Manager)
- إدارة المحتوى والعقارات
- متابعة الطلبات
- عرض التقارير

### الموظف (Staff)
- عرض البيانات
- الرد على الطلبات
- صلاحيات محدودة

## تعديل الصلاحيات
1. انتقل إلى "الصلاحيات" من القائمة الجانبية
2. اختر الدور المراد تعديله
3. فعّل أو عطّل الصلاحيات المطلوبة
4. اضغط "حفظ"`,
  },
  {
    title: "التقارير وتصدير البيانات", slug: "reports-export", category: "reports",
    content: `# التقارير وتصدير البيانات

## أنواع التقارير المتاحة

### تقرير العقارات
- إجمالي العقارات حسب النوع
- العقارات النشطة مقابل غير النشطة
- توزيع الأسعار

### تقرير الطلبات
- عدد الطلبات الشهرية
- حالة الطلبات
- مصادر الطلبات

### تقرير المستخدمين
- عدد المستخدمين النشطين
- آخر تسجيل دخول

## تصدير البيانات
- اضغط على زر "تصدير CSV" في أي صفحة
- سيتم تحميل ملف Excel يحتوي على جميع البيانات
- يمكنك فتح الملف في Excel أو Google Sheets`,
  },
];

export default function AdminGuides() {
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", category: "general" as string, content: "" });

  const { data: dbGuides } = trpc.admin.listGuides.useQuery();
  const createGuide = trpc.admin.createGuide.useMutation({
    onSuccess: () => { toast.success("تم إنشاء الدليل"); setShowCreateDialog(false); },
    onError: (err: any) => toast.error(err.message),
  });

  // Merge default guides with DB guides
  const allGuides = [
    ...defaultGuides,
    ...((dbGuides ?? []) as any[]).filter((g: any) => !defaultGuides.find(d => d.slug === g.slug)),
  ];

  const filteredGuides = allGuides.filter((g) => !search || g.title.includes(search) || g.content?.includes(search));

  if (selectedGuide) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setSelectedGuide(null)}>
              <ChevronLeft className="h-4 w-4 ml-1" /> العودة للأدلة
            </Button>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Badge className={`text-xs ${categoryColors[selectedGuide.category] || "bg-gray-100 text-gray-700"}`}>
                  {categoryLabels[selectedGuide.category] || selectedGuide.category}
                </Badge>
              </div>
              <CardTitle className="text-xl text-[#0f1b33]">
                {selectedGuide.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none" dir="rtl">
                {selectedGuide.content?.split("\n").map((line: string, i: number) => {
                  if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold text-[#0f1b33] mt-6 mb-3">{line.slice(2)}</h1>;
                  if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold text-[#0f1b33] mt-5 mb-2">{line.slice(3)}</h2>;
                  if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold text-[#0f1b33] mt-4 mb-2">{line.slice(4)}</h3>;
                  if (line.startsWith("- **")) {
                    const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
                    if (match) return <p key={i} className="mr-4 my-1"><strong className="text-[#0f1b33]">{match[1]}</strong>{match[2] ? `: ${match[2]}` : ""}</p>;
                  }
                  if (line.startsWith("- ")) return <p key={i} className="mr-4 my-1 flex items-start gap-2"><span className="text-[#c8a45e] mt-1">●</span>{line.slice(2)}</p>;
                  if (line.match(/^\d+\./)) return <p key={i} className="mr-4 my-1 font-medium">{line}</p>;
                  if (line.trim() === "") return <br key={i} />;
                  return <p key={i} className="my-1 text-muted-foreground">{line}</p>;
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0f1b33]">أدلة الاستخدام</h1>
            <p className="text-muted-foreground text-sm mt-1">أدلة استرشادية وتعليمية لاستخدام لوحة التحكم</p>
          </div>
          <Button onClick={() => { setForm({ title: "", slug: "", category: "general", content: "" }); setShowCreateDialog(true); }} className="bg-[#0f1b33] hover:bg-[#1a2b4a]">
            <Plus className="h-4 w-4 ml-2" /> دليل جديد
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث في الأدلة..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGuides.map((guide, i) => (
            <Card key={guide.slug || i} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => setSelectedGuide(guide)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-[#0f1b33]/10 rounded-xl flex items-center justify-center group-hover:bg-[#c8a45e]/20 transition-colors">
                    <BookOpen className="h-5 w-5 text-[#0f1b33] group-hover:text-[#c8a45e] transition-colors" />
                  </div>
                  <Badge className={`text-[10px] ${categoryColors[guide.category] || "bg-gray-100 text-gray-700"}`}>
                    {categoryLabels[guide.category] || guide.category}
                  </Badge>
                </div>
                <h3 className="font-semibold text-[#0f1b33] mb-2 text-sm group-hover:text-[#c8a45e] transition-colors">{guide.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {guide.content?.replace(/[#*\-]/g, "").slice(0, 100)}...
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Eye className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">اضغط للقراءة</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Guide Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء دليل جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>العنوان *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^\u0621-\u064Aa-z0-9-]/g, "") })} placeholder="عنوان الدليل" />
                </div>
                <div>
                  <Label>التصنيف</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>الرابط (Slug)</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" placeholder="guide-slug" />
              </div>
              <div>
                <Label>المحتوى (يدعم Markdown)</Label>
                <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12} placeholder="# عنوان الدليل&#10;&#10;## القسم الأول&#10;محتوى القسم..." className="font-mono text-sm" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>إلغاء</Button>
              <Button onClick={() => {
                if (!form.title || !form.slug || !form.content) { toast.error("يرجى تعبئة جميع الحقول"); return; }
                createGuide.mutate(form);
              }} className="bg-[#0f1b33] hover:bg-[#1a2b4a]" disabled={createGuide.isPending}>
                إنشاء الدليل
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
