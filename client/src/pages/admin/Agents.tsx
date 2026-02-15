import { useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserCheck, Plus, Pencil, Trash2, Search, Upload, X, Phone, Mail, Landmark, Building2 } from "lucide-react";

const emptyForm = {
  agencyId: 0, nameAr: "", nameEn: "", slug: "", titleAr: "", titleEn: "",
  bioAr: "", bioEn: "", photo: "", phone: "", email: "", whatsapp: "",
  isActive: true, sortOrder: 0,
};

export default function AdminAgents() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: agentsList = [], isLoading } = trpc.admin.listAgents.useQuery(
    agencyFilter !== "all" ? { agencyId: Number(agencyFilter) } : undefined
  );
  const { data: agenciesList = [] } = trpc.admin.listAgencies.useQuery();
  const uploadMedia = trpc.admin.uploadMedia.useMutation();

  const createAgent = trpc.admin.createAgent.useMutation({
    onSuccess: () => { utils.admin.listAgents.invalidate(); toast.success("تم إنشاء الوكيل بنجاح"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateAgent = trpc.admin.updateAgent.useMutation({
    onSuccess: () => { utils.admin.listAgents.invalidate(); toast.success("تم تحديث الوكيل بنجاح"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteAgent = trpc.admin.deleteAgent.useMutation({
    onSuccess: () => { utils.admin.listAgents.invalidate(); toast.success("تم حذف الوكيل"); setDeleteConfirm(null); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = agentsList.filter((a: any) =>
    !search || a.nameAr?.includes(search) || a.nameEn?.toLowerCase().includes(search.toLowerCase()) || a.phone?.includes(search)
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (agent: any) => {
    setEditing(agent);
    setForm({
      agencyId: agent.agencyId || 0, nameAr: agent.nameAr || "", nameEn: agent.nameEn || "",
      slug: agent.slug || "", titleAr: agent.titleAr || "", titleEn: agent.titleEn || "",
      bioAr: agent.bioAr || "", bioEn: agent.bioEn || "",
      photo: agent.photo || "", phone: agent.phone || "", email: agent.email || "",
      whatsapp: agent.whatsapp || "",
      isActive: agent.isActive ?? true, sortOrder: agent.sortOrder || 0,
    });
    setDialogOpen(true);
  };

  const handlePhotoUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const result = await uploadMedia.mutateAsync({ filename: file.name, mimeType: file.type, base64, size: file.size });
        setForm(prev => ({ ...prev, photo: result.url }));
        toast.success("تم رفع الصورة");
      } catch {
        toast.error("فشل رفع الصورة");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.nameAr.trim()) { toast.error("اسم الوكيل بالعربية مطلوب"); return; }
    if (!form.agencyId) { toast.error("يجب اختيار المكتب العقاري"); return; }
    const data = {
      ...form,
      sortOrder: Number(form.sortOrder) || 0,
    };
    if (editing) {
      updateAgent.mutate({ id: editing.id, ...data });
    } else {
      createAgent.mutate(data);
    }
  };

  const getAgencyName = (agencyId: number) => {
    const agency = agenciesList.find((a: any) => a.id === agencyId);
    return agency?.nameAr || "غير محدد";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-indigo-500" />
              إدارة الوكلاء
            </h1>
            <p className="text-sm text-slate-500 mt-1">إدارة وكلاء المكاتب العقارية المسؤولين عن العقارات</p>
          </div>
          <Button onClick={openCreate} className="bg-indigo-500 hover:bg-indigo-600 text-white gap-2">
            <Plus className="w-4 h-4" />إضافة وكيل
          </Button>
        </div>

        {/* Filters */}
        <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="بحث بالاسم أو رقم الجوال..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 border-slate-200" />
              </div>
              <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                <SelectTrigger className="w-48 border-slate-200"><SelectValue placeholder="كل المكاتب" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المكاتب</SelectItem>
                  {agenciesList.map((a: any) => <SelectItem key={a.id} value={String(a.id)}>{a.nameAr}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="bg-white border border-slate-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{agentsList.length}</div>
              <div className="text-xs text-slate-500">إجمالي الوكلاء</div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{agentsList.filter((a: any) => a.isActive).length}</div>
              <div className="text-xs text-slate-500">وكلاء نشطون</div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{new Set(agentsList.map((a: any) => a.agencyId)).size}</div>
              <div className="text-xs text-slate-500">مكاتب ممثلة</div>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <Card className="bg-white border border-slate-100">
            <CardContent className="py-12 text-center text-slate-400">
              <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا يوجد وكلاء</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((agent: any) => (
              <Card key={agent.id} className="bg-white border border-slate-100 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Photo */}
                    <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {agent.photo ? (
                        <img src={agent.photo} alt={agent.nameAr} className="w-full h-full object-cover" />
                      ) : (
                        <UserCheck className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800">{agent.nameAr}</h3>
                        {agent.nameEn && <span className="text-sm text-slate-400" dir="ltr">{agent.nameEn}</span>}
                        <Badge className={agent.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}>
                          {agent.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </div>
                      {agent.titleAr && <p className="text-sm text-slate-500 mt-0.5">{agent.titleAr}</p>}
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1"><Landmark className="w-3 h-3" />{getAgencyName(agent.agencyId)}</span>
                        {agent.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{agent.phone}</span>}
                        {agent.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{agent.email}</span>}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEdit(agent)} className="gap-1">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteConfirm(agent)}>
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
              <DialogTitle>{editing ? "تعديل الوكيل" : "إضافة وكيل جديد"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Agency Selection */}
              <div>
                <label className="text-sm font-medium text-slate-700">المكتب العقاري *</label>
                <Select value={form.agencyId ? String(form.agencyId) : ""} onValueChange={(v) => setForm({ ...form, agencyId: Number(v) })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="اختر المكتب العقاري" /></SelectTrigger>
                  <SelectContent>
                    {agenciesList.filter((a: any) => a.status === "active").map((a: any) => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.nameAr}{a.nameEn ? ` (${a.nameEn})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Photo */}
              <div>
                <label className="text-sm font-medium text-slate-700">الصورة الشخصية</label>
                <div className="mt-1 flex items-center gap-3">
                  {form.photo ? (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200">
                      <img src={form.photo} alt="Photo" className="w-full h-full object-cover" />
                      <button onClick={() => setForm({ ...form, photo: "" })} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()} className="gap-1">
                      <Upload className="w-4 h-4" />رفع الصورة
                    </Button>
                  )}
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} />
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">الاسم بالعربية *</label>
                  <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} placeholder="أحمد محمد" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">الاسم بالإنجليزية</label>
                  <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="Ahmed Mohammed" dir="ltr" className="mt-1 text-left" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">الرابط (Slug)</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="يتم إنشاؤه تلقائياً" dir="ltr" className="mt-1 text-left" />
              </div>

              {/* Title */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">المسمى الوظيفي بالعربية</label>
                  <Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} placeholder="مدير المبيعات" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">المسمى الوظيفي بالإنجليزية</label>
                  <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="Sales Manager" dir="ltr" className="mt-1 text-left" />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-sm font-medium text-slate-700">نبذة بالعربية</label>
                <Textarea value={form.bioAr} onChange={(e) => setForm({ ...form, bioAr: e.target.value })} rows={3} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">نبذة بالإنجليزية</label>
                <Textarea value={form.bioEn} onChange={(e) => setForm({ ...form, bioEn: e.target.value })} rows={3} dir="ltr" className="mt-1 text-left" />
              </div>

              {/* Contact */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">الهاتف</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0500000000" dir="ltr" className="mt-1 text-left" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">البريد الإلكتروني</label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="agent@agency.com" dir="ltr" className="mt-1 text-left" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">واتساب</label>
                  <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="966500000000" dir="ltr" className="mt-1 text-left" />
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="text-sm font-medium text-slate-700">ترتيب العرض</label>
                  <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="mt-1" />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                  <label className="text-sm text-slate-700">نشط</label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleSave} disabled={createAgent.isPending || updateAgent.isPending} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                {(createAgent.isPending || updateAgent.isPending) ? "جاري الحفظ..." : editing ? "تحديث" : "إنشاء"}
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
            <p className="text-slate-600">هل أنت متأكد من حذف الوكيل <strong>{deleteConfirm?.nameAr}</strong>؟</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>إلغاء</Button>
              <Button variant="destructive" onClick={() => deleteConfirm && deleteAgent.mutate({ id: deleteConfirm.id })} disabled={deleteAgent.isPending}>
                {deleteAgent.isPending ? "جاري الحذف..." : "حذف"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
