import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageGalleryManager from "@/components/ImageGalleryManager";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, Image as ImageIcon, FolderKanban } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = { active: "نشط", completed: "مكتمل", upcoming: "قادم" };

export default function AdminProjects() {
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<any>(null);
  const [form, setForm] = useState({
    title: "", titleEn: "", subtitle: "", subtitleEn: "", description: "", descriptionEn: "",
    location: "", locationEn: "", status: "active",
    totalUnits: "", soldUnits: "", videoUrl: "", isFeatured: false,
  });
  const [editForm, setEditForm] = useState({
    title: "", titleEn: "", subtitle: "", subtitleEn: "", description: "", descriptionEn: "",
    location: "", locationEn: "", status: "active",
    totalUnits: "", soldUnits: "", videoUrl: "", isFeatured: false,
  });

  const { data: projects, refetch } = trpc.admin.listProjects.useQuery();
  const createProject = trpc.admin.createProject.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المشروع");
      setShowCreate(false);
      setForm({ title: "", titleEn: "", subtitle: "", subtitleEn: "", description: "", descriptionEn: "", location: "", locationEn: "", status: "active", totalUnits: "", soldUnits: "", videoUrl: "", isFeatured: false });
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });
  const updateProject = trpc.admin.updateProject.useMutation({
    onSuccess: () => { toast.success("تم تحديث المشروع"); setEditProject(null); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteProject = trpc.admin.deleteProject.useMutation({
    onSuccess: () => { toast.success("تم حذف المشروع"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const openEdit = (p: any) => {
    setEditProject(p);
    setEditForm({
      title: p.title || "", titleEn: p.titleEn || "",
      subtitle: p.subtitle || "", subtitleEn: p.subtitleEn || "",
      description: p.description || "", descriptionEn: p.descriptionEn || "",
      location: p.location || "", locationEn: p.locationEn || "",
      status: p.status || "active",
      totalUnits: String(p.totalUnits || ""), soldUnits: String(p.soldUnits || ""),
      videoUrl: p.videoUrl || "", isFeatured: !!p.isFeatured,
    });
  };

  const handleUpdate = () => {
    if (!editProject) return;
    updateProject.mutate({
      id: editProject.id,
      title: editForm.title || undefined, titleEn: editForm.titleEn || undefined,
      subtitle: editForm.subtitle || undefined, subtitleEn: editForm.subtitleEn || undefined,
      description: editForm.description || undefined, descriptionEn: editForm.descriptionEn || undefined,
      location: editForm.location || undefined, locationEn: editForm.locationEn || undefined,
      status: editForm.status || undefined,
      totalUnits: editForm.totalUnits ? parseInt(editForm.totalUnits) : undefined,
      soldUnits: editForm.soldUnits ? parseInt(editForm.soldUnits) : undefined,
      videoUrl: editForm.videoUrl || undefined,
      isFeatured: editForm.isFeatured,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">إدارة المشاريع</h1>
            <p className="text-slate-400 text-sm mt-0.5">إدارة المشاريع التطويرية وصورها</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm"><Plus className="w-4 h-4 ml-2" />إضافة مشروع</Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-slate-800">إضافة مشروع جديد</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="md:col-span-2"><Label className="text-slate-600">اسم المشروع (عربي)</Label><Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="mt-1" /></div>
                <div className="md:col-span-2"><Label className="text-slate-600">Project Name (English)</Label><Input value={form.titleEn} onChange={(e) => setForm({...form, titleEn: e.target.value})} dir="ltr" className="mt-1 text-left" /></div>
                <div className="md:col-span-2"><Label className="text-slate-600">العنوان الفرعي (عربي)</Label><Input value={form.subtitle} onChange={(e) => setForm({...form, subtitle: e.target.value})} className="mt-1" /></div>
                <div className="md:col-span-2"><Label className="text-slate-600">Subtitle (English)</Label><Input value={form.subtitleEn} onChange={(e) => setForm({...form, subtitleEn: e.target.value})} dir="ltr" className="mt-1 text-left" /></div>
                <div className="md:col-span-2"><Label className="text-slate-600">الوصف (عربي)</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3} className="mt-1" /></div>
                <div className="md:col-span-2"><Label className="text-slate-600">Description (English)</Label><Textarea value={form.descriptionEn} onChange={(e) => setForm({...form, descriptionEn: e.target.value})} rows={3} dir="ltr" className="mt-1 text-left" /></div>
                <div><Label className="text-slate-600">الموقع (عربي)</Label><Input value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} className="mt-1" /></div>
                <div><Label className="text-slate-600">Location (English)</Label><Input value={form.locationEn} onChange={(e) => setForm({...form, locationEn: e.target.value})} dir="ltr" className="mt-1 text-left" /></div>
                <div>
                  <Label className="text-slate-600">الحالة</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-slate-600">إجمالي الوحدات</Label><Input type="number" value={form.totalUnits} onChange={(e) => setForm({...form, totalUnits: e.target.value})} dir="ltr" className="mt-1" /></div>
                <div><Label className="text-slate-600">الوحدات المباعة</Label><Input type="number" value={form.soldUnits} onChange={(e) => setForm({...form, soldUnits: e.target.value})} dir="ltr" className="mt-1" /></div>
                <div className="md:col-span-2"><Label className="text-slate-600">رابط الفيديو (YouTube)</Label><Input value={form.videoUrl} onChange={(e) => setForm({...form, videoUrl: e.target.value})} dir="ltr" placeholder="https://youtube.com/watch?v=..." className="mt-1" /></div>
                <div className="md:col-span-2">
                  <Button className="w-full bg-indigo-500 text-white hover:bg-indigo-600" onClick={() => createProject.mutate({
                    ...form, totalUnits: parseInt(form.totalUnits) || 0, soldUnits: parseInt(form.soldUnits) || 0,
                  })} disabled={createProject.isPending}>
                    {createProject.isPending ? "جاري الإضافة..." : "إضافة المشروع"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Table */}
        <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الصورة</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">المشروع</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الموقع</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الوحدات</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الصور</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الحالة</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {(projects ?? []).length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-400">
                      <FolderKanban className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                      لا توجد مشاريع
                    </td></tr>
                  ) : (
                    (projects ?? []).map((p: any) => {
                      const imgs: string[] = Array.isArray(p.images) ? p.images : [];
                      return (
                        <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-4">
                            {imgs.length > 0 ? (
                              <img loading="lazy" src={imgs[0]} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                <ImageIcon className="w-5 h-5 text-slate-300" />
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-700">{p.title}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{p.subtitle}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{p.location}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-700 font-medium" dir="ltr">{p.soldUnits || 0}/{p.totalUnits || 0}</span>
                              {(p.totalUnits || 0) > 0 && (
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.min(((p.soldUnits || 0) / (p.totalUnits || 1)) * 100, 100)}%` }} />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg font-medium ${imgs.length > 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>
                              <ImageIcon className="w-3 h-3" />{imgs.length}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 text-xs rounded-lg font-medium ${
                              p.status === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                              p.status === "completed" ? "bg-blue-50 text-blue-600 border border-blue-200" :
                              "bg-amber-50 text-amber-600 border border-amber-200"
                            }`}>{statusLabels[p.status] || p.status}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-indigo-50" onClick={() => openEdit(p)}>
                                <Edit className="w-4 h-4 text-indigo-500" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50" onClick={() => { if (confirm("هل أنت متأكد من حذف هذا المشروع؟")) deleteProject.mutate({ id: p.id }); }}>
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

      {/* Edit Project Dialog with Tabs */}
      <Dialog open={!!editProject} onOpenChange={(open) => { if (!open) setEditProject(null); }}>
        <DialogContent dir="rtl" className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-slate-800">تعديل المشروع</DialogTitle></DialogHeader>
          <Tabs defaultValue="details" dir="rtl" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details" className="gap-2"><Edit className="w-4 h-4" />البيانات الأساسية</TabsTrigger>
              <TabsTrigger value="images" className="gap-2"><ImageIcon className="w-4 h-4" />الصور</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><Label className="text-slate-600">اسم المشروع (عربي)</Label><Input value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="mt-1" /></div>
                <div className="md:col-span-2"><Label className="text-slate-600">Project Name (English)</Label><Input value={editForm.titleEn} onChange={(e) => setEditForm({...editForm, titleEn: e.target.value})} dir="ltr" className="mt-1 text-left" /></div>
                <div className="md:col-span-2"><Label className="text-slate-600">العنوان الفرعي (عربي)</Label><Input value={editForm.subtitle} onChange={(e) => setEditForm({...editForm, subtitle: e.target.value})} className="mt-1" /></div>
                <div className="md:col-span-2"><Label className="text-slate-600">Subtitle (English)</Label><Input value={editForm.subtitleEn} onChange={(e) => setEditForm({...editForm, subtitleEn: e.target.value})} dir="ltr" className="mt-1 text-left" /></div>
                <div className="md:col-span-2"><Label className="text-slate-600">الوصف (عربي)</Label><Textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} rows={4} className="mt-1" /></div>
                <div className="md:col-span-2"><Label className="text-slate-600">Description (English)</Label><Textarea value={editForm.descriptionEn} onChange={(e) => setEditForm({...editForm, descriptionEn: e.target.value})} rows={4} dir="ltr" className="mt-1 text-left" /></div>
                <div><Label className="text-slate-600">الموقع (عربي)</Label><Input value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} className="mt-1" /></div>
                <div><Label className="text-slate-600">Location (English)</Label><Input value={editForm.locationEn} onChange={(e) => setEditForm({...editForm, locationEn: e.target.value})} dir="ltr" className="mt-1 text-left" /></div>
                <div>
                  <Label className="text-slate-600">الحالة</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({...editForm, status: v})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-slate-600">إجمالي الوحدات</Label><Input type="number" value={editForm.totalUnits} onChange={(e) => setEditForm({...editForm, totalUnits: e.target.value})} dir="ltr" className="mt-1" /></div>
                <div><Label className="text-slate-600">الوحدات المباعة</Label><Input type="number" value={editForm.soldUnits} onChange={(e) => setEditForm({...editForm, soldUnits: e.target.value})} dir="ltr" className="mt-1" /></div>
                <div className="md:col-span-2"><Label className="text-slate-600">رابط الفيديو (YouTube)</Label><Input value={editForm.videoUrl} onChange={(e) => setEditForm({...editForm, videoUrl: e.target.value})} dir="ltr" placeholder="https://youtube.com/watch?v=..." className="mt-1" /></div>
                <div className="md:col-span-2">
                  <Button className="w-full bg-indigo-500 text-white hover:bg-indigo-600" onClick={handleUpdate} disabled={updateProject.isPending}>
                    {updateProject.isPending ? "جاري التحديث..." : "حفظ التغييرات"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="images" className="mt-4">
              {editProject && <ImageGalleryManager entityId={editProject.id} entityType="project" />}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
