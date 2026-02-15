import { useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Landmark, Plus, Pencil, Trash2, Search, Eye, EyeOff, Star, Upload, X, Users, Building2, Globe, Phone, Mail, MapPin } from "lucide-react";

const emptyForm = {
  nameAr: "", nameEn: "", slug: "", descriptionAr: "", descriptionEn: "",
  logo: "", coverImage: "", phone: "", email: "", website: "",
  city: "", cityEn: "", address: "", addressEn: "",
  licenseNumber: "",
  isFeatured: false, sortOrder: 0, status: "active" as string,
};

export default function AdminAgencies() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { data: agenciesList = [], isLoading } = trpc.admin.listAgencies.useQuery();
  const { data: citiesData } = trpc.public.getCitiesWithDistricts.useQuery();
  const uploadMedia = trpc.admin.uploadMedia.useMutation();

  const createAgency = trpc.admin.createAgency.useMutation({
    onSuccess: () => { utils.admin.listAgencies.invalidate(); toast.success("تم إنشاء المكتب بنجاح"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateAgency = trpc.admin.updateAgency.useMutation({
    onSuccess: () => { utils.admin.listAgencies.invalidate(); toast.success("تم تحديث المكتب بنجاح"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteAgency = trpc.admin.deleteAgency.useMutation({
    onSuccess: () => { utils.admin.listAgencies.invalidate(); toast.success("تم حذف المكتب"); setDeleteConfirm(null); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = agenciesList.filter((a: any) =>
    !search || a.nameAr?.includes(search) || a.nameEn?.toLowerCase().includes(search.toLowerCase()) || a.city?.includes(search)
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (agency: any) => {
    setEditing(agency);
    setForm({
      nameAr: agency.nameAr || "", nameEn: agency.nameEn || "", slug: agency.slug || "",
      descriptionAr: agency.descriptionAr || "", descriptionEn: agency.descriptionEn || "",
      logo: agency.logo || "", coverImage: agency.coverImage || "",
      phone: agency.phone || "", email: agency.email || "", website: agency.website || "",
      city: agency.city || "", cityEn: agency.cityEn || "",
      address: agency.address || "", addressEn: agency.addressEn || "",
      licenseNumber: agency.licenseNumber || "",
      isFeatured: agency.isFeatured || false, sortOrder: agency.sortOrder || 0,
      status: agency.status || "active",
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (file: File, field: "logo" | "coverImage") => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const result = await uploadMedia.mutateAsync({ filename: file.name, mimeType: file.type, base64, size: file.size });
        setForm(prev => ({ ...prev, [field]: result.url }));
        toast.success("تم رفع الصورة");
      } catch {
        toast.error("فشل رفع الصورة");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.nameAr.trim()) { toast.error("اسم المكتب بالعربية مطلوب"); return; }
    const data = {
      ...form,
      sortOrder: Number(form.sortOrder) || 0,
    };
    if (editing) {
      updateAgency.mutate({ id: editing.id, ...data });
    } else {
      createAgency.mutate(data);
    }
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-gray-100 text-gray-600",
    suspended: "bg-red-100 text-red-700",
  };
  const statusLabels: Record<string, string> = {
    active: "نشط",
    inactive: "غير نشط",
    suspended: "موقوف",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Landmark className="w-6 h-6 text-indigo-500" />
              إدارة المكاتب العقارية
            </h1>
            <p className="text-sm text-slate-500 mt-1">إدارة المكاتب العقارية المعلنة على المنصة</p>
          </div>
          <Button onClick={openCreate} className="bg-indigo-500 hover:bg-indigo-600 text-white gap-2">
            <Plus className="w-4 h-4" />إضافة مكتب
          </Button>
        </div>

        {/* Search */}
        <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="بحث بالاسم أو المدينة..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 border-slate-200" />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border border-slate-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{agenciesList.length}</div>
              <div className="text-xs text-slate-500">إجمالي المكاتب</div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{agenciesList.filter((a: any) => a.status === "active").length}</div>
              <div className="text-xs text-slate-500">مكاتب نشطة</div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{agenciesList.filter((a: any) => a.isFeatured).length}</div>
              <div className="text-xs text-slate-500">مكاتب مميزة</div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{agenciesList.filter((a: any) => a.status === "suspended").length}</div>
              <div className="text-xs text-slate-500">مكاتب موقوفة</div>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <Card className="bg-white border border-slate-100">
            <CardContent className="py-12 text-center text-slate-400">
              <Landmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد مكاتب عقارية</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((agency: any) => (
              <Card key={agency.id} className="bg-white border border-slate-100 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {agency.logo ? (
                        <img src={agency.logo} alt={agency.nameAr} className="w-full h-full object-cover" />
                      ) : (
                        <Landmark className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800">{agency.nameAr}</h3>
                        {agency.nameEn && <span className="text-sm text-slate-400" dir="ltr">{agency.nameEn}</span>}
                        <Badge className={statusColors[agency.status] || "bg-gray-100"}>{statusLabels[agency.status] || agency.status}</Badge>
                        {agency.isFeatured && <Badge className="bg-amber-100 text-amber-700"><Star className="w-3 h-3 ml-1" />مميز</Badge>}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 flex-wrap">
                        {agency.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{agency.city}</span>}
                        {agency.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{agency.phone}</span>}
                        {agency.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{agency.email}</span>}
                        {agency.licenseNumber && <span className="text-xs text-slate-400">رخصة: {agency.licenseNumber}</span>}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEdit(agency)} className="gap-1">
                        <Pencil className="w-3.5 h-3.5" />تعديل
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteConfirm(agency)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "تعديل المكتب العقاري" : "إضافة مكتب عقاري جديد"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">الاسم بالعربية *</label>
                  <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} placeholder="مكتب العقارات" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">الاسم بالإنجليزية</label>
                  <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="Real Estate Office" dir="ltr" className="mt-1 text-left" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">الرابط (Slug)</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="يتم إنشاؤه تلقائياً إذا تُرك فارغاً" dir="ltr" className="mt-1 text-left" />
              </div>

              {/* Logo & Cover */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">الشعار</label>
                  <div className="mt-1 flex items-center gap-3">
                    {form.logo ? (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                        <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
                        <button onClick={() => setForm({ ...form, logo: "" })} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} className="gap-1">
                        <Upload className="w-4 h-4" />رفع الشعار
                      </Button>
                    )}
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "logo")} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">صورة الغلاف</label>
                  <div className="mt-1 flex items-center gap-3">
                    {form.coverImage ? (
                      <div className="relative w-24 h-16 rounded-lg overflow-hidden border">
                        <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                        <button onClick={() => setForm({ ...form, coverImage: "" })} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => coverInputRef.current?.click()} className="gap-1">
                        <Upload className="w-4 h-4" />رفع الغلاف
                      </Button>
                    )}
                    <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "coverImage")} />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-slate-700">الوصف بالعربية</label>
                <Textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} rows={3} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">الوصف بالإنجليزية</label>
                <Textarea value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} rows={3} dir="ltr" className="mt-1 text-left" />
              </div>

              {/* Contact */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">الهاتف</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0500000000" dir="ltr" className="mt-1 text-left" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">البريد الإلكتروني</label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="info@agency.com" dir="ltr" className="mt-1 text-left" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">الموقع الإلكتروني</label>
                  <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://agency.com" dir="ltr" className="mt-1 text-left" />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">المدينة</label>
                  <Select value={form.city} onValueChange={(v) => {
                    const c = citiesData?.find((c: any) => c.nameAr === v);
                    setForm({ ...form, city: v, cityEn: c?.nameEn || "" });
                  }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                    <SelectContent>
                      {citiesData?.map((c: any) => <SelectItem key={c.id} value={c.nameAr}>{c.nameAr}{c.nameEn ? ` (${c.nameEn})` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">العنوان</label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="العنوان التفصيلي" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">العنوان بالإنجليزية</label>
                  <Input value={form.addressEn} onChange={(e) => setForm({ ...form, addressEn: e.target.value })} placeholder="Address in English" dir="ltr" className="mt-1 text-left" />
                </div>
              </div>

              {/* License */}
              <div>
                <label className="text-sm font-medium text-slate-700">رقم الرخصة</label>
                <Input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} placeholder="رقم رخصة فال" dir="ltr" className="mt-1 text-left" />
              </div>

              {/* Status & Featured */}
              <div className="grid grid-cols-3 gap-4 items-end">
                <div>
                  <label className="text-sm font-medium text-slate-700">الحالة</label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                      <SelectItem value="suspended">موقوف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">ترتيب العرض</label>
                  <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="mt-1" />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} />
                  <label className="text-sm text-slate-700">مكتب مميز</label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleSave} disabled={createAgency.isPending || updateAgency.isPending} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                {(createAgency.isPending || updateAgency.isPending) ? "جاري الحفظ..." : editing ? "تحديث" : "إنشاء"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد الحذف</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">هل أنت متأكد من حذف المكتب <strong>{deleteConfirm?.nameAr}</strong>؟ سيتم فصل جميع العقارات والوكلاء المرتبطين.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>إلغاء</Button>
              <Button variant="destructive" onClick={() => deleteConfirm && deleteAgency.mutate({ id: deleteConfirm.id })} disabled={deleteAgency.isPending}>
                {deleteAgency.isPending ? "جاري الحذف..." : "حذف"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
