import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import PropertyImageGallery from "@/components/PropertyImageGallery";
import { Plus, Search, Edit, Trash2, Download, ImageIcon, Eye, Building2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

const propertyTypes: Record<string, string> = {
  villa: "فيلا", apartment: "شقة", land: "أرض", commercial: "تجاري", office: "مكتب", building: "عمارة"
};
const listingTypes: Record<string, string> = { sale: "بيع", rent: "إيجار" };
const statusLabels: Record<string, string> = { active: "نشط", sold: "مباع", rented: "مؤجر", draft: "مسودة" };

const emptyForm = {
  title: "", titleEn: "", description: "", descriptionEn: "", type: "villa", listingType: "sale", status: "active",
  price: "", area: "", rooms: "", bathrooms: "", city: "الرياض", cityEn: "", district: "", districtEn: "", address: "", addressEn: "", videoUrl: "",
  virtualTourUrl: "", virtualTourType: "" as string,
  latitude: "", longitude: "",
  agencyId: "", agentId: "",
};

export default function AdminProperties() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [activeEditTab, setActiveEditTab] = useState("details");

  const { data: properties, refetch } = trpc.admin.listProperties.useQuery({ search, type: typeFilter, status: statusFilter });
  const { data: citiesData } = trpc.public.getCitiesWithDistricts.useQuery();
  const { data: agenciesList = [] } = trpc.admin.listAgencies.useQuery();
  const { data: agentsList = [] } = trpc.admin.listAgents.useQuery();

  const createProp = trpc.admin.createProperty.useMutation({
    onSuccess: () => { toast.success("تم إضافة العقار بنجاح"); setShowCreate(false); setForm({ ...emptyForm }); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const updateProp = trpc.admin.updateProperty.useMutation({
    onSuccess: () => { toast.success("تم تحديث العقار بنجاح"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteProp = trpc.admin.deleteProperty.useMutation({
    onSuccess: () => { toast.success("تم حذف العقار"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const exportCSV = trpc.admin.exportPropertiesCSV.useMutation({
    onSuccess: (data: any) => {
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "properties.csv";
      link.click();
      toast.success("تم تصدير البيانات");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openEdit = (prop: any) => {
    setEditingProperty(prop);
    setEditForm({
      title: prop.title || "", titleEn: prop.titleEn || "",
      description: prop.description || "", descriptionEn: prop.descriptionEn || "",
      type: prop.type || "villa",
      listingType: prop.listingType || "sale", status: prop.status || "active",
      price: prop.price?.toString() || "", area: prop.area?.toString() || "",
      rooms: prop.rooms?.toString() || "", bathrooms: prop.bathrooms?.toString() || "",
      city: prop.city || "الرياض", cityEn: prop.cityEn || "",
      district: prop.district || "", districtEn: prop.districtEn || "",
      address: prop.address || "", addressEn: prop.addressEn || "",
      videoUrl: prop.videoUrl || "",
      virtualTourUrl: (prop as any).virtualTourUrl || "", virtualTourType: (prop as any).virtualTourType || "",
      latitude: prop.latitude?.toString() || "", longitude: prop.longitude?.toString() || "",
      agencyId: prop.agencyId?.toString() || "", agentId: prop.agentId?.toString() || "",
    });
    setActiveEditTab("details");
  };

  const saveEdit = () => {
    if (!editingProperty) return;
    updateProp.mutate({
      id: editingProperty.id, title: editForm.title, titleEn: editForm.titleEn,
      description: editForm.description, descriptionEn: editForm.descriptionEn,
      type: editForm.type, listingType: editForm.listingType, status: editForm.status,
      price: parseFloat(editForm.price) || 0, area: parseFloat(editForm.area) || 0,
      rooms: parseInt(editForm.rooms) || 0, bathrooms: parseInt(editForm.bathrooms) || 0,
      city: editForm.city, cityEn: editForm.cityEn, district: editForm.district, districtEn: editForm.districtEn,
      address: editForm.address, addressEn: editForm.addressEn, videoUrl: editForm.videoUrl,
      virtualTourUrl: editForm.virtualTourUrl || undefined, virtualTourType: (editForm.virtualTourType || undefined) as "matterport" | "youtube" | "custom" | undefined,
      latitude: editForm.latitude ? parseFloat(editForm.latitude) : undefined,
      longitude: editForm.longitude ? parseFloat(editForm.longitude) : undefined,
      agencyId: editForm.agencyId && editForm.agencyId !== "none" ? Number(editForm.agencyId) : undefined,
      agentId: editForm.agentId && editForm.agentId !== "none" ? Number(editForm.agentId) : undefined,
    });
  };

  const imageCountMap = useMemo(() => {
    const map: Record<number, number> = {};
    (properties ?? []).forEach((p: any) => { map[p.id] = Array.isArray(p.images) ? p.images.length : 0; });
    return map;
  }, [properties]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">إدارة العقارات</h1>
            <p className="text-slate-400 text-sm mt-0.5">إضافة وتعديل وحذف العقارات مع إدارة الصور</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportCSV.mutate()} disabled={exportCSV.isPending} className="border-slate-200 text-slate-600 hover:bg-slate-50">
              <Download className="w-4 h-4 ml-2" />تصدير CSV
            </Button>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm"><Plus className="w-4 h-4 ml-2" />إضافة عقار</Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-slate-800">إضافة عقار جديد</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-slate-400 mb-2">أضف بيانات العقار الأساسية أولاً، ثم يمكنك إضافة الصور من صفحة التعديل.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="md:col-span-2">
                    <Label className="text-slate-600">عنوان العقار (عربي)</Label>
                    <Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="فيلا فاخرة في حي النرجس" className="mt-1" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-slate-600">Property Title (English)</Label>
                    <Input value={form.titleEn} onChange={(e) => setForm({...form, titleEn: e.target.value})} placeholder="Luxury Villa in Al-Narjis" dir="ltr" className="mt-1 text-left" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-slate-600">الوصف (عربي)</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="وصف تفصيلي للعقار..." rows={3} className="mt-1" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-slate-600">Description (English)</Label>
                    <Textarea value={form.descriptionEn} onChange={(e) => setForm({...form, descriptionEn: e.target.value})} placeholder="Detailed property description..." rows={3} dir="ltr" className="mt-1 text-left" />
                  </div>
                  <div>
                    <Label className="text-slate-600">نوع العقار</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(propertyTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-600">نوع العرض</Label>
                    <Select value={form.listingType} onValueChange={(v) => setForm({...form, listingType: v})}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(listingTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-600">السعر (ريال)</Label>
                    <Input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} placeholder="1,500,000" dir="ltr" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-slate-600">المساحة (م²)</Label>
                    <Input type="number" value={form.area} onChange={(e) => setForm({...form, area: e.target.value})} placeholder="350" dir="ltr" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-slate-600">الغرف</Label>
                    <Input type="number" value={form.rooms} onChange={(e) => setForm({...form, rooms: e.target.value})} placeholder="5" dir="ltr" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-slate-600">دورات المياه</Label>
                    <Input type="number" value={form.bathrooms} onChange={(e) => setForm({...form, bathrooms: e.target.value})} placeholder="3" dir="ltr" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-slate-600">المدينة</Label>
                    <Select value={form.city} onValueChange={(v) => {
                      const city = citiesData?.find(c => c.nameAr === v);
                      setForm({...form, city: v, cityEn: city?.nameEn || "", district: "", districtEn: ""});
                    }}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                      <SelectContent>
                        {citiesData?.map(c => <SelectItem key={c.id} value={c.nameAr}>{c.nameAr}{c.nameEn ? ` (${c.nameEn})` : ""}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-600">الحي</Label>
                    <Select value={form.district} onValueChange={(v) => {
                      const selectedCity = citiesData?.find(c => c.nameAr === form.city);
                      const dist = selectedCity?.districts?.find((d: any) => d.nameAr === v);
                      setForm({...form, district: v, districtEn: dist?.nameEn || ""});
                    }}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="اختر الحي" /></SelectTrigger>
                      <SelectContent>
                        {(citiesData?.find(c => c.nameAr === form.city)?.districts || []).map((d: any) => <SelectItem key={d.id} value={d.nameAr}>{d.nameAr}{d.nameEn ? ` (${d.nameEn})` : ""}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-600">العنوان التفصيلي (عربي)</Label>
                    <Input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} placeholder="شارع الأمير محمد بن سلمان" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-slate-600">Address (English)</Label>
                    <Input value={form.addressEn} onChange={(e) => setForm({...form, addressEn: e.target.value})} placeholder="Prince Mohammed bin Salman St." dir="ltr" className="mt-1 text-left" />
                  </div>
                  <div>
                    <Label className="text-slate-600">خط العرض (Latitude)</Label>
                    <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({...form, latitude: e.target.value})} placeholder="24.7136" dir="ltr" className="mt-1 text-left" />
                  </div>
                  <div>
                    <Label className="text-slate-600">خط الطول (Longitude)</Label>
                    <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({...form, longitude: e.target.value})} placeholder="46.6753" dir="ltr" className="mt-1 text-left" />
                  </div>
                  <div>
                    <Label className="text-slate-600">المكتب العقاري</Label>
                    <Select value={form.agencyId} onValueChange={(v) => setForm({...form, agencyId: v, agentId: ""})}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="اختياري" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون مكتب</SelectItem>
                        {agenciesList.filter((a: any) => a.status === "active").map((a: any) => <SelectItem key={a.id} value={String(a.id)}>{a.nameAr}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-600">الوكيل المسؤول</Label>
                    <Select value={form.agentId} onValueChange={(v) => setForm({...form, agentId: v})}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="اختياري" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون وكيل</SelectItem>
                        {agentsList.filter((a: any) => a.isActive && (!form.agencyId || form.agencyId === "none" || a.agencyId === Number(form.agencyId))).map((a: any) => <SelectItem key={a.id} value={String(a.id)}>{a.nameAr}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-slate-600">رابط الجولة الافتراضية 360° (Matterport / YouTube / مخصص)</Label>
                    <Input value={form.virtualTourUrl} onChange={(e) => {
                      const url = e.target.value;
                      let tourType = form.virtualTourType;
                      if (url.includes('matterport.com') || url.includes('my.matterport')) tourType = 'matterport';
                      else if (url.includes('youtube.com') || url.includes('youtu.be')) tourType = 'youtube';
                      else if (url) tourType = 'custom';
                      else tourType = '';
                      setForm({...form, virtualTourUrl: url, virtualTourType: tourType});
                    }} dir="ltr" placeholder="https://my.matterport.com/show/?m=..." className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-slate-600">نوع الجولة الافتراضية</Label>
                    <select value={form.virtualTourType} onChange={(e) => setForm({...form, virtualTourType: e.target.value})} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                      <option value="">غير محدد</option>
                      <option value="matterport">Matterport</option>
                      <option value="youtube">YouTube 360°</option>
                      <option value="custom">مخصص (iframe)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Button className="w-full bg-indigo-500 text-white hover:bg-indigo-600" onClick={() => createProp.mutate({
                      ...form, price: parseFloat(form.price) || 0, area: parseFloat(form.area) || 0,
                      rooms: parseInt(form.rooms) || 0, bathrooms: parseInt(form.bathrooms) || 0,
                      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
                      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
                      agencyId: form.agencyId && form.agencyId !== "none" ? Number(form.agencyId) : undefined,
                      agentId: form.agentId && form.agentId !== "none" ? Number(form.agentId) : undefined,
                      virtualTourUrl: form.virtualTourUrl || undefined,
                      virtualTourType: (form.virtualTourType || undefined) as "matterport" | "youtube" | "custom" | undefined,
                    })} disabled={createProp.isPending}>
                      {createProp.isPending ? "جاري الإضافة..." : "إضافة العقار"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="بحث بالعنوان أو الحي..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 border-slate-200" />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36 border-slate-200"><SelectValue placeholder="كل الأنواع" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  {Object.entries(propertyTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 border-slate-200"><SelectValue placeholder="كل الحالات" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Properties Table */}
        <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الصورة</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">العنوان</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">النوع</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">العرض</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">السعر</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">المساحة</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الصور</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الحالة</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {(properties ?? []).length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-12 text-slate-400">
                      <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                      لا توجد عقارات
                    </td></tr>
                  ) : (
                    (properties ?? []).map((p: any) => {
                      const coverImage = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
                      const imgCount = imageCountMap[p.id] || 0;
                      return (
                        <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-4">
                            {coverImage ? (
                              <img loading="lazy" src={coverImage} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                <ImageIcon className="w-5 h-5 text-slate-300" />
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium max-w-[200px] truncate">{p.title}</td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-lg font-medium">{propertyTypes[p.type] || p.type}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{listingTypes[p.listingType] || p.listingType}</td>
                          <td className="py-3 px-4 text-slate-700 font-semibold" dir="ltr">{p.price ? Number(p.price).toLocaleString() : "—"} ريال</td>
                          <td className="py-3 px-4 text-slate-500" dir="ltr">{p.area || "—"} م²</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg font-medium ${imgCount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>
                              <ImageIcon className="w-3 h-3" />
                              {imgCount}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 text-xs rounded-lg font-medium ${
                              p.status === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                              p.status === "sold" ? "bg-blue-50 text-blue-600 border border-blue-200" :
                              p.status === "rented" ? "bg-violet-50 text-violet-600 border border-violet-200" :
                              "bg-slate-50 text-slate-500 border border-slate-200"
                            }`}>{statusLabels[p.status] || p.status}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-indigo-50" onClick={() => openEdit(p)} title="تعديل العقار">
                                <Edit className="w-4 h-4 text-indigo-500" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50" onClick={() => {
                                if (confirm("هل أنت متأكد من حذف هذا العقار؟")) deleteProp.mutate({ id: p.id });
                              }}>
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Property Dialog */}
      <Dialog open={!!editingProperty} onOpenChange={(open) => { if (!open) setEditingProperty(null); }}>
        <DialogContent dir="rtl" className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-800">تعديل العقار: {editingProperty?.title}</DialogTitle>
          </DialogHeader>

          <Tabs value={activeEditTab} onValueChange={setActiveEditTab} dir="rtl" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details" className="gap-2">
                <Edit className="w-4 h-4" />البيانات الأساسية
              </TabsTrigger>
              <TabsTrigger value="images" className="gap-2">
                <ImageIcon className="w-4 h-4" />الصور ({imageCountMap[editingProperty?.id] || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-slate-600">عنوان العقار (عربي)</Label>
                  <Input value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-slate-600">Property Title (English)</Label>
                  <Input value={editForm.titleEn} onChange={(e) => setEditForm({...editForm, titleEn: e.target.value})} dir="ltr" className="mt-1 text-left" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-slate-600">الوصف (عربي)</Label>
                  <Textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} rows={3} className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-slate-600">Description (English)</Label>
                  <Textarea value={editForm.descriptionEn} onChange={(e) => setEditForm({...editForm, descriptionEn: e.target.value})} rows={3} dir="ltr" className="mt-1 text-left" />
                </div>
                <div>
                  <Label className="text-slate-600">نوع العقار</Label>
                  <Select value={editForm.type} onValueChange={(v) => setEditForm({...editForm, type: v})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(propertyTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-600">نوع العرض</Label>
                  <Select value={editForm.listingType} onValueChange={(v) => setEditForm({...editForm, listingType: v})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(listingTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-600">الحالة</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({...editForm, status: v})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-600">السعر (ريال)</Label>
                  <Input type="number" value={editForm.price} onChange={(e) => setEditForm({...editForm, price: e.target.value})} dir="ltr" className="mt-1" />
                </div>
                <div>
                  <Label className="text-slate-600">المساحة (م²)</Label>
                  <Input type="number" value={editForm.area} onChange={(e) => setEditForm({...editForm, area: e.target.value})} dir="ltr" className="mt-1" />
                </div>
                <div>
                  <Label className="text-slate-600">الغرف</Label>
                  <Input type="number" value={editForm.rooms} onChange={(e) => setEditForm({...editForm, rooms: e.target.value})} dir="ltr" className="mt-1" />
                </div>
                <div>
                  <Label className="text-slate-600">دورات المياه</Label>
                  <Input type="number" value={editForm.bathrooms} onChange={(e) => setEditForm({...editForm, bathrooms: e.target.value})} dir="ltr" className="mt-1" />
                </div>
                <div>
                  <Label className="text-slate-600">المدينة</Label>
                  <Select value={editForm.city} onValueChange={(v) => {
                    const city = citiesData?.find(c => c.nameAr === v);
                    setEditForm({...editForm, city: v, cityEn: city?.nameEn || "", district: "", districtEn: ""});
                  }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                    <SelectContent>
                      {citiesData?.map(c => <SelectItem key={c.id} value={c.nameAr}>{c.nameAr}{c.nameEn ? ` (${c.nameEn})` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-600">الحي</Label>
                  <Select value={editForm.district} onValueChange={(v) => {
                    const selectedCity = citiesData?.find(c => c.nameAr === editForm.city);
                    const dist = selectedCity?.districts?.find((d: any) => d.nameAr === v);
                    setEditForm({...editForm, district: v, districtEn: dist?.nameEn || ""});
                  }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="اختر الحي" /></SelectTrigger>
                    <SelectContent>
                      {(citiesData?.find(c => c.nameAr === editForm.city)?.districts || []).map((d: any) => <SelectItem key={d.id} value={d.nameAr}>{d.nameAr}{d.nameEn ? ` (${d.nameEn})` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-600">العنوان التفصيلي (عربي)</Label>
                  <Input value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <Label className="text-slate-600">Address (English)</Label>
                  <Input value={editForm.addressEn} onChange={(e) => setEditForm({...editForm, addressEn: e.target.value})} dir="ltr" className="mt-1 text-left" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-slate-600">رابط الفيديو (YouTube أو غيره)</Label>
                  <Input value={editForm.videoUrl} onChange={(e) => setEditForm({...editForm, videoUrl: e.target.value})} dir="ltr" placeholder="https://youtube.com/..." className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-slate-600">رابط الجولة الافتراضية 360° (Matterport / YouTube / مخصص)</Label>
                  <Input value={editForm.virtualTourUrl} onChange={(e) => {
                    const url = e.target.value;
                    let tourType = editForm.virtualTourType;
                    if (url.includes('matterport.com') || url.includes('my.matterport')) tourType = 'matterport';
                    else if (url.includes('youtube.com') || url.includes('youtu.be')) tourType = 'youtube';
                    else if (url) tourType = 'custom';
                    else tourType = '';
                    setEditForm({...editForm, virtualTourUrl: url, virtualTourType: tourType});
                  }} dir="ltr" placeholder="https://my.matterport.com/show/?m=..." className="mt-1" />
                </div>
                <div>
                  <Label className="text-slate-600">نوع الجولة الافتراضية</Label>
                  <select value={editForm.virtualTourType} onChange={(e) => setEditForm({...editForm, virtualTourType: e.target.value})} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                    <option value="">غير محدد</option>
                    <option value="matterport">Matterport</option>
                    <option value="youtube">YouTube 360°</option>
                    <option value="custom">مخصص (iframe)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-slate-600">خط العرض (Latitude)</Label>
                  <Input type="number" step="any" value={editForm.latitude} onChange={(e) => setEditForm({...editForm, latitude: e.target.value})} placeholder="24.7136" dir="ltr" className="mt-1 text-left" />
                </div>
                <div>
                  <Label className="text-slate-600">خط الطول (Longitude)</Label>
                  <Input type="number" step="any" value={editForm.longitude} onChange={(e) => setEditForm({...editForm, longitude: e.target.value})} placeholder="46.6753" dir="ltr" className="mt-1 text-left" />
                </div>
                <div>
                  <Label className="text-slate-600">المكتب العقاري</Label>
                  <Select value={editForm.agencyId} onValueChange={(v) => setEditForm({...editForm, agencyId: v, agentId: ""})}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="اختياري" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون مكتب</SelectItem>
                      {agenciesList.filter((a: any) => a.status === "active").map((a: any) => <SelectItem key={a.id} value={String(a.id)}>{a.nameAr}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-600">الوكيل المسؤول</Label>
                  <Select value={editForm.agentId} onValueChange={(v) => setEditForm({...editForm, agentId: v})}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="اختياري" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون وكيل</SelectItem>
                      {agentsList.filter((a: any) => a.isActive && (!editForm.agencyId || editForm.agencyId === "none" || a.agencyId === Number(editForm.agencyId))).map((a: any) => <SelectItem key={a.id} value={String(a.id)}>{a.nameAr}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Button className="w-full bg-indigo-500 text-white hover:bg-indigo-600" onClick={saveEdit} disabled={updateProp.isPending}>
                    {updateProp.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="images" className="mt-4">
              {editingProperty && (
                <PropertyImageGallery propertyId={editingProperty.id} onImagesChange={() => refetch()} />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
