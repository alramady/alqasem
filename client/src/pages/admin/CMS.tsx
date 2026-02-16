import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import PagePreview from "@/components/admin/PagePreview";
import ImageUploader from "@/components/admin/ImageUploader";
import WysiwygEditor from "@/components/admin/WysiwygEditor";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  FileText, Plus, Edit, Trash2, GripVertical, Search, Globe,
  Eye, EyeOff, LayoutDashboard, Home, Pencil, ChevronLeft,
  Type, AlignRight, Image, Settings2, PanelRightOpen, PanelRightClose,
  Monitor, Smartphone, Upload, ImagePlus
} from "lucide-react";

// Section icon mapping
const sectionIcons: Record<string, any> = {
  hero: Home,
  about: FileText,
  services: Settings2,
  properties: LayoutDashboard,
  projects: LayoutDashboard,
  partners: Globe,
  contact: AlignRight,
};

// Section label mapping
const sectionLabels: Record<string, string> = {
  hero: "القسم الرئيسي (Hero)",
  about: "من نحن",
  services: "خدماتنا",
  properties: "أحدث العقارات",
  projects: "مشاريعنا",
  partners: "شركاؤنا",
  contact: "تواصل معنا",
};

// Section image field definitions - what image fields each section supports
const sectionImageFields: Record<string, { key: string; label: string; multiple?: boolean; helpText?: string }[]> = {
  hero: [
    { key: "backgroundImage", label: "صورة الخلفية", helpText: "الصورة الرئيسية في خلفية قسم البطل" },
    { key: "overlayImages", label: "صور إضافية (سلايدر)", multiple: true, helpText: "صور متعددة للعرض كسلايدر" },
  ],
  about: [
    { key: "image", label: "صورة القسم", helpText: "الصورة المعروضة بجانب النص في قسم من نحن" },
    { key: "galleryImages", label: "معرض الصور", multiple: true, helpText: "صور إضافية لمعرض من نحن" },
  ],
  services: [
    { key: "backgroundImage", label: "صورة الخلفية", helpText: "صورة خلفية قسم الخدمات" },
  ],
  properties: [
    { key: "backgroundImage", label: "صورة الخلفية", helpText: "صورة خلفية قسم العقارات" },
  ],
  projects: [
    { key: "backgroundImage", label: "صورة الخلفية", helpText: "صورة خلفية قسم المشاريع" },
  ],
  partners: [
    { key: "logos", label: "شعارات الشركاء", multiple: true, helpText: "شعارات شركاء النجاح" },
  ],
  contact: [
    { key: "backgroundImage", label: "صورة الخلفية", helpText: "صورة خلفية قسم التواصل" },
    { key: "mapImage", label: "صورة الخريطة", helpText: "صورة الموقع على الخريطة" },
  ],
};

export default function AdminCMS() {
  const [activeTab, setActiveTab] = useState("homepage");
  const [showPageDialog, setShowPageDialog] = useState(false);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPage, setPreviewPage] = useState<any>(null);
  const [sectionEditorTab, setSectionEditorTab] = useState("content");

  const { data: pagesList, refetch: refetchPages } = trpc.admin.listPages.useQuery();
  const { data: sections, refetch: refetchSections } = trpc.admin.listHomepageSections.useQuery();
  const createPage = trpc.admin.createPage.useMutation({
    onSuccess: () => { refetchPages(); setShowPageDialog(false); toast.success("تم إنشاء الصفحة بنجاح"); },
    onError: (e) => toast.error(e.message),
  });
  const updatePage = trpc.admin.updatePage.useMutation({
    onSuccess: () => { refetchPages(); setShowPageDialog(false); toast.success("تم تحديث الصفحة"); },
    onError: (e) => toast.error(e.message),
  });
  const deletePage = trpc.admin.deletePage.useMutation({
    onSuccess: () => { refetchPages(); toast.success("تم حذف الصفحة"); },
    onError: (e) => toast.error(e.message),
  });
  const updateSection = trpc.admin.updateHomepageSection.useMutation({
    onSuccess: () => { refetchSections(); toast.success("تم تحديث القسم"); },
    onError: (e) => toast.error(e.message),
  });

  // Page form state
  const [pageForm, setPageForm] = useState({
    title: "", slug: "", content: "", pageType: "static" as string, status: "draft" as string,
    seoTitle: "", seoDescription: "", seoKeywords: "", template: "default",
    heroImage: "", contentImages: [] as string[],
  });

  // Section form state
  const [sectionForm, setSectionForm] = useState({
    title: "", subtitle: "", contentJson: "",
    images: {} as Record<string, string | string[]>,
  });

  const openCreatePage = () => {
    setEditingPage(null);
    setPageForm({ title: "", slug: "", content: "", pageType: "static", status: "draft", seoTitle: "", seoDescription: "", seoKeywords: "", template: "default", heroImage: "", contentImages: [] });
    setPreviewVisible(false);
    setShowPageDialog(true);
  };

  const openEditPage = (page: any) => {
    setEditingPage(page);
    // Extract image data from page content if embedded
    let heroImage = "";
    let contentImages: string[] = [];
    try {
      if (page.sections && typeof page.sections === "object") {
        heroImage = page.sections.heroImage || "";
        contentImages = page.sections.contentImages || [];
      }
    } catch {}
    setPageForm({
      title: page.title, slug: page.slug, content: page.content || "",
      pageType: page.pageType, status: page.status,
      seoTitle: page.seoTitle || "", seoDescription: page.seoDescription || "",
      seoKeywords: page.seoKeywords || "", template: page.template || "default",
      heroImage, contentImages,
    });
    setPreviewVisible(false);
    setShowPageDialog(true);
  };

  const openPreviewModal = (page: any) => {
    setPreviewPage(page);
    setShowPreviewModal(true);
  };

  const openEditSection = (section: any) => {
    setEditingSection(section);
    let contentStr = "";
    let imageData: Record<string, string | string[]> = {};
    try {
      const contentObj = section.content
        ? (typeof section.content === "string" ? JSON.parse(section.content) : section.content)
        : {};
      // Extract image fields from content
      const sectionKey = section.sectionKey;
      const imageFields = sectionImageFields[sectionKey] || [];
      for (const field of imageFields) {
        if (contentObj[field.key]) {
          imageData[field.key] = contentObj[field.key];
        }
      }
      // Remove image fields from the JSON display
      const cleanContent = { ...contentObj };
      for (const field of imageFields) {
        delete cleanContent[field.key];
      }
      contentStr = Object.keys(cleanContent).length > 0 ? JSON.stringify(cleanContent, null, 2) : "";
    } catch {
      contentStr = "";
    }
    setSectionForm({
      title: section.title || "",
      subtitle: section.subtitle || "",
      contentJson: contentStr,
      images: imageData,
    });
    setSectionEditorTab("content");
    setShowSectionDialog(true);
  };

  const handleSavePage = () => {
    if (!pageForm.title || !pageForm.slug) { toast.error("يرجى تعبئة العنوان والرابط"); return; }
    // Save images in the sections JSON field
    const sectionsData: any = {};
    if (pageForm.heroImage) sectionsData.heroImage = pageForm.heroImage;
    if (pageForm.contentImages.length > 0) sectionsData.contentImages = pageForm.contentImages;

    const payload: any = {
      title: pageForm.title, slug: pageForm.slug, content: pageForm.content,
      pageType: pageForm.pageType, status: pageForm.status,
      seoTitle: pageForm.seoTitle, seoDescription: pageForm.seoDescription,
      seoKeywords: pageForm.seoKeywords, template: pageForm.template,
      sections: Object.keys(sectionsData).length > 0 ? sectionsData : undefined,
    };

    if (editingPage) {
      updatePage.mutate({ id: editingPage.id, ...payload });
    } else {
      createPage.mutate(payload);
    }
  };

  const handleSaveSection = () => {
    if (!editingSection) return;
    // Merge text content with image data
    let parsedContent: any = {};
    if (sectionForm.contentJson.trim()) {
      try {
        parsedContent = JSON.parse(sectionForm.contentJson);
      } catch {
        toast.error("صيغة JSON غير صحيحة في حقل المحتوى");
        return;
      }
    }
    // Merge image fields back into content
    const sectionKey = editingSection.sectionKey;
    const imageFields = sectionImageFields[sectionKey] || [];
    for (const field of imageFields) {
      const val = sectionForm.images[field.key];
      if (val && (Array.isArray(val) ? val.length > 0 : val)) {
        parsedContent[field.key] = val;
      }
    }

    updateSection.mutate({
      id: editingSection.id,
      title: sectionForm.title || undefined,
      subtitle: sectionForm.subtitle || undefined,
      content: Object.keys(parsedContent).length > 0 ? parsedContent : undefined,
    });
    setShowSectionDialog(false);
  };

  const filteredPages = (pagesList ?? []).filter((p: any) => !search || p.title.includes(search) || p.slug.includes(search));

  // Helper to insert image tag into page content
  const insertImageIntoContent = (url: string) => {
    const imgTag = `<img loading="lazy" src="${url}" alt="" class="w-full rounded-lg my-4" />`;
    setPageForm(prev => ({
      ...prev,
      content: prev.content + "\n" + imgTag,
    }));
    toast.success("تم إدراج الصورة في المحتوى");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">إدارة المحتوى</h1>
            <p className="text-slate-400 text-sm mt-0.5">إنشاء وتعديل الصفحات وأقسام الصفحة الرئيسية</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 rounded-xl p-1">
            <TabsTrigger value="homepage" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              أقسام الرئيسية
            </TabsTrigger>
            <TabsTrigger value="pages" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              الصفحات
            </TabsTrigger>
          </TabsList>

          {/* Homepage Sections Tab */}
          <TabsContent value="homepage" className="space-y-4">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-slate-800">أقسام الصفحة الرئيسية</CardTitle>
                  <p className="text-xs text-slate-400">{(sections ?? []).length} أقسام</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">تحكم في أقسام الصفحة الرئيسية - اضغط على زر التعديل لتحرير المحتوى والصور</p>
              </CardHeader>
              <CardContent>
                {(sections ?? []).length === 0 ? (
                  <p className="text-center py-8 text-slate-400">لا توجد أقسام مسجلة بعد</p>
                ) : (
                  <div className="space-y-3">
                    {(sections ?? []).map((section: any) => {
                      const IconComp = sectionIcons[section.sectionKey] || FileText;
                      const label = sectionLabels[section.sectionKey] || section.sectionKey;
                      const hasContent = section.content && (typeof section.content === "object" ? Object.keys(section.content).length > 0 : true);
                      const imageFieldCount = (sectionImageFields[section.sectionKey] || []).length;
                      // Check if section has images in content
                      let hasImages = false;
                      try {
                        const c = typeof section.content === "object" ? section.content : JSON.parse(section.content || "{}");
                        const fields = sectionImageFields[section.sectionKey] || [];
                        hasImages = fields.some(f => c[f.key] && (Array.isArray(c[f.key]) ? c[f.key].length > 0 : c[f.key]));
                      } catch {}
                      return (
                        <div key={section.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                          <GripVertical className="h-4 w-4 text-slate-300 cursor-grab flex-shrink-0" />
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <IconComp className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-slate-700 text-sm">{section.title || label}</h4>
                              <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400 font-mono">{section.sectionKey}</Badge>
                              {hasContent && (
                                <Badge className="text-[10px] bg-emerald-50 text-emerald-600 border-0">محتوى موجود</Badge>
                              )}
                              {!hasContent && (
                                <Badge className="text-[10px] bg-amber-50 text-amber-600 border-0">بدون محتوى</Badge>
                              )}
                              {hasImages && (
                                <Badge className="text-[10px] bg-blue-50 text-blue-600 border-0 flex items-center gap-0.5">
                                  <Image className="h-2.5 w-2.5" /> صور
                                </Badge>
                              )}
                              {imageFieldCount > 0 && !hasImages && (
                                <Badge className="text-[10px] bg-slate-50 text-slate-400 border-0 flex items-center gap-0.5">
                                  <ImagePlus className="h-2.5 w-2.5" /> يدعم الصور
                                </Badge>
                              )}
                            </div>
                            {section.subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{section.subtitle}</p>}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-indigo-100 opacity-60 group-hover:opacity-100 transition-opacity"
                              onClick={() => openEditSection(section)}
                            >
                              <Pencil className="h-4 w-4 text-indigo-600" />
                              <span className="text-xs text-indigo-600 mr-1">تعديل</span>
                            </Button>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-slate-400">{section.isVisible ? "مرئي" : "مخفي"}</Label>
                              <Switch
                                checked={section.isVisible}
                                onCheckedChange={(checked) => updateSection.mutate({ id: section.id, isVisible: checked })}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pages Tab */}
          <TabsContent value="pages" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="بحث في الصفحات..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9 border-slate-200" />
              </div>
              <Button onClick={openCreatePage} className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg">
                <Plus className="h-4 w-4 ml-2" /> صفحة جديدة
              </Button>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>إجمالي الصفحات: {(pagesList ?? []).length}</span>
              <span>•</span>
              <span>منشور: {(pagesList ?? []).filter((p: any) => p.status === "published").length}</span>
              <span>•</span>
              <span>مسودة: {(pagesList ?? []).filter((p: any) => p.status === "draft").length}</span>
            </div>

            <div className="grid gap-3">
              {filteredPages.length === 0 && !search ? (
                <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400">لا توجد صفحات بعد</p>
                    <Button onClick={openCreatePage} variant="outline" className="mt-4 border-slate-200">إنشاء أول صفحة</Button>
                  </CardContent>
                </Card>
              ) : filteredPages.length === 0 && search ? (
                <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
                  <CardContent className="py-8 text-center">
                    <Search className="h-8 w-8 mx-auto text-slate-200 mb-2" />
                    <p className="text-slate-400 text-sm">لا توجد نتائج لـ "{search}"</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPages.map((page: any) => (
                  <Card key={page.id} className="border border-slate-100 shadow-sm bg-white rounded-xl hover:shadow-md hover:border-indigo-100 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-slate-800">{page.title}</h3>
                              <Badge variant={page.status === "published" ? "default" : "secondary"} className={`text-xs rounded-lg ${page.status === "published" ? "bg-emerald-50 text-emerald-600 border-0" : page.status === "draft" ? "bg-amber-50 text-amber-600 border-0" : "bg-slate-100 text-slate-500 border-0"}`}>
                                {page.status === "published" ? "منشور" : page.status === "draft" ? "مسودة" : "مؤرشف"}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400">
                                {page.pageType === "static" ? "ثابت" : page.pageType === "dynamic" ? "ديناميكي" : "هبوط"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Globe className="h-3 w-3" /> /{page.slug}
                              </span>
                              <span className="text-xs text-slate-400">
                                آخر تعديل: {new Date(page.updatedAt).toLocaleDateString("ar-SA")}
                              </span>
                              {page.content && (
                                <span className="text-xs text-emerald-500">
                                  {page.content.length > 100 ? `${Math.round(page.content.length / 100) * 100}+ حرف` : "محتوى قصير"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button variant="ghost" size="sm" className="hover:bg-emerald-50" onClick={() => openPreviewModal(page)} title="معاينة الصفحة">
                            <Eye className="h-4 w-4 text-emerald-500" />
                          </Button>
                          <Button variant="ghost" size="sm" className="hover:bg-indigo-50" onClick={() => openEditPage(page)}>
                            <Edit className="h-4 w-4 text-indigo-500" />
                          </Button>
                          <Button variant="ghost" size="sm" className="hover:bg-red-50" onClick={() => { if (confirm("هل أنت متأكد من حذف هذه الصفحة؟")) deletePage.mutate({ id: page.id }); }}>
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Page Create/Edit Dialog with Live Preview */}
        <Dialog open={showPageDialog} onOpenChange={setShowPageDialog}>
          <DialogContent className={`max-h-[92vh] overflow-hidden transition-all duration-300 ${previewVisible ? "max-w-[95vw] w-[95vw]" : "max-w-3xl"}`} dir="rtl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-slate-800">
                  {editingPage ? `تعديل الصفحة: ${editingPage.title}` : "إنشاء صفحة جديدة"}
                </DialogTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className={`gap-1.5 text-xs transition-colors ${previewVisible ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  onClick={() => setPreviewVisible(!previewVisible)}
                >
                  {previewVisible ? <PanelRightClose className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {previewVisible ? "إخفاء المعاينة" : "معاينة مباشرة"}
                </Button>
              </div>
            </DialogHeader>

            <div className={`flex gap-5 overflow-hidden ${previewVisible ? "flex-row" : "flex-col"}`} style={{ height: previewVisible ? "calc(92vh - 140px)" : "auto" }}>
              {/* Editor Panel */}
              <div className={`overflow-y-auto ${previewVisible ? "w-[45%] flex-shrink-0" : "w-full"}`} style={{ maxHeight: previewVisible ? "100%" : "calc(92vh - 200px)" }}>
                <Tabs defaultValue="content">
                  <TabsList className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1">
                    <TabsTrigger value="content" className="flex-1 rounded-md text-xs">المحتوى</TabsTrigger>
                    <TabsTrigger value="images" className="flex-1 rounded-md text-xs gap-1">
                      <Image className="h-3 w-3" /> الصور
                    </TabsTrigger>
                    <TabsTrigger value="seo" className="flex-1 rounded-md text-xs">SEO</TabsTrigger>
                    <TabsTrigger value="settings" className="flex-1 rounded-md text-xs">الإعدادات</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-600 text-xs">عنوان الصفحة *</Label>
                        <Input value={pageForm.title} onChange={(e) => setPageForm({ ...pageForm, title: e.target.value, slug: pageForm.slug || e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^\u0621-\u064Aa-z0-9-]/g, "") })} placeholder="مثال: من نحن" className="border-slate-200" />
                      </div>
                      <div>
                        <Label className="text-slate-600 text-xs">الرابط (Slug) *</Label>
                        <Input value={pageForm.slug} onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })} placeholder="about-us" dir="ltr" className="border-slate-200" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-slate-600 text-xs">المحتوى</Label>
                        <span className="text-[10px] text-slate-400">{pageForm.content.length} حرف</span>
                      </div>
                      <WysiwygEditor
                        value={pageForm.content}
                        onChange={(html) => setPageForm(prev => ({ ...prev, content: html }))}
                        placeholder="ابدأ كتابة محتوى الصفحة هنا..."
                        minHeight={previewVisible ? "450px" : "300px"}
                        dir="rtl"
                      />
                      {!previewVisible && (
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          اضغط "معاينة مباشرة" في الأعلى لمشاهدة الصفحة أثناء الكتابة
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  {/* Images Tab */}
                  <TabsContent value="images" className="space-y-5 mt-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 flex items-center gap-2">
                      <ImagePlus className="h-4 w-4 flex-shrink-0" />
                      <span>ارفع صور الصفحة هنا. يمكنك أيضاً إدراج صور مباشرة في المحتوى.</span>
                    </div>

                    {/* Hero Image */}
                    <ImageUploader
                      label="صورة البانر الرئيسي"
                      helpText="الصورة التي تظهر في أعلى الصفحة كخلفية للبانر"
                      value={pageForm.heroImage}
                      onChange={(val) => setPageForm({ ...pageForm, heroImage: val as string })}
                      folder="cms-pages"
                    />

                    {/* Content Images */}
                    <ImageUploader
                      label="صور المحتوى"
                      helpText="صور إضافية يمكن إدراجها في محتوى الصفحة"
                      value={pageForm.contentImages}
                      onChange={(val) => setPageForm({ ...pageForm, contentImages: val as string[] })}
                      multiple
                      maxImages={20}
                      folder="cms-pages"
                    />

                    {/* Quick insert buttons for content images */}
                    {pageForm.contentImages.length > 0 && (
                      <div className="border border-slate-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-slate-600 mb-2">إدراج صورة في المحتوى:</p>
                        <div className="flex flex-wrap gap-2">
                          {pageForm.contentImages.map((url, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => insertImageIntoContent(url)}
                              className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden hover:border-indigo-400 hover:ring-2 hover:ring-indigo-200 transition-all"
                              title="اضغط لإدراج في المحتوى"
                            >
                              <img loading="lazy" src={url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5">اضغط على أي صورة لإدراجها تلقائياً في محتوى HTML</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="seo" className="space-y-4 mt-4">
                    <div>
                      <Label className="text-slate-600 text-xs">عنوان SEO</Label>
                      <Input value={pageForm.seoTitle} onChange={(e) => setPageForm({ ...pageForm, seoTitle: e.target.value })} placeholder="عنوان الصفحة في محركات البحث" className="border-slate-200" />
                      <p className="text-xs text-slate-400 mt-1">{pageForm.seoTitle.length}/60 حرف</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 text-xs">وصف SEO</Label>
                      <Textarea value={pageForm.seoDescription} onChange={(e) => setPageForm({ ...pageForm, seoDescription: e.target.value })} rows={3} placeholder="الوصف الذي يظهر في نتائج البحث" className="border-slate-200" />
                      <p className="text-xs text-slate-400 mt-1">{pageForm.seoDescription.length}/160 حرف</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 text-xs">الكلمات المفتاحية</Label>
                      <Input value={pageForm.seoKeywords} onChange={(e) => setPageForm({ ...pageForm, seoKeywords: e.target.value })} placeholder="كلمة1, كلمة2, كلمة3" className="border-slate-200" />
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-600 text-xs">نوع الصفحة</Label>
                        <Select value={pageForm.pageType} onValueChange={(v) => setPageForm({ ...pageForm, pageType: v })}>
                          <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="static">ثابت</SelectItem>
                            <SelectItem value="dynamic">ديناميكي</SelectItem>
                            <SelectItem value="landing">صفحة هبوط</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-slate-600 text-xs">الحالة</Label>
                        <Select value={pageForm.status} onValueChange={(v) => setPageForm({ ...pageForm, status: v })}>
                          <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">مسودة</SelectItem>
                            <SelectItem value="published">منشور</SelectItem>
                            <SelectItem value="archived">مؤرشف</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-600 text-xs">القالب</Label>
                      <Select value={pageForm.template} onValueChange={(v) => setPageForm({ ...pageForm, template: v })}>
                        <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">افتراضي</SelectItem>
                          <SelectItem value="full-width">عرض كامل</SelectItem>
                          <SelectItem value="sidebar">مع شريط جانبي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Live Preview Panel */}
              {previewVisible && (
                <div className="flex-1 min-w-0 border-r border-slate-200 pr-5">
                  <PagePreview
                    title={pageForm.title}
                    slug={pageForm.slug}
                    content={pageForm.content}
                    seoDescription={pageForm.seoDescription}
                    status={pageForm.status}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {!previewVisible && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs border-slate-200 text-slate-500" onClick={() => setPreviewVisible(true)}>
                      <Eye className="h-3.5 w-3.5" /> معاينة
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setShowPageDialog(false)} className="border-slate-200">إلغاء</Button>
                  <Button onClick={handleSavePage} className="bg-indigo-500 hover:bg-indigo-600 text-white" disabled={createPage.isPending || updatePage.isPending}>
                    {createPage.isPending || updatePage.isPending ? "جاري الحفظ..." : editingPage ? "حفظ التعديلات" : "إنشاء الصفحة"}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Standalone Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden" dir="rtl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-slate-800 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-emerald-500" />
                  معاينة: {previewPage?.title}
                </DialogTitle>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs border-slate-200" onClick={() => { setShowPreviewModal(false); if (previewPage) openEditPage(previewPage); }}>
                  <Edit className="h-3.5 w-3.5" /> تعديل
                </Button>
              </div>
            </DialogHeader>
            <div style={{ height: "calc(92vh - 120px)" }}>
              {previewPage && (
                <PagePreview title={previewPage.title} slug={previewPage.slug} content={previewPage.content || ""} seoDescription={previewPage.seoDescription} status={previewPage.status} />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Section Edit Dialog with Image Upload */}
        <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-slate-800 flex items-center gap-2">
                <Pencil className="h-5 w-5 text-indigo-500" />
                تعديل قسم: {editingSection ? (sectionLabels[editingSection.sectionKey] || editingSection.sectionKey) : ""}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-2">
              {editingSection && (
                <div className="bg-indigo-50 rounded-lg p-3 text-xs text-indigo-700 flex items-center gap-2 mb-4">
                  <Badge className="bg-indigo-100 text-indigo-700 border-0 font-mono">{editingSection.sectionKey}</Badge>
                  <span>معرّف القسم (لا يمكن تغييره)</span>
                </div>
              )}

              <Tabs value={sectionEditorTab} onValueChange={setSectionEditorTab}>
                <TabsList className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 mb-4">
                  <TabsTrigger value="content" className="flex-1 rounded-md text-xs">
                    <Type className="h-3 w-3 ml-1" /> المحتوى
                  </TabsTrigger>
                  <TabsTrigger value="images" className="flex-1 rounded-md text-xs">
                    <Image className="h-3 w-3 ml-1" /> الصور
                    {editingSection && (sectionImageFields[editingSection.sectionKey] || []).length > 0 && (
                      <Badge className="text-[9px] bg-blue-100 text-blue-600 border-0 mr-1 px-1">
                        {(sectionImageFields[editingSection.sectionKey] || []).length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  <div>
                    <Label className="text-slate-600 flex items-center gap-1">
                      <Type className="h-3.5 w-3.5" /> العنوان
                    </Label>
                    <Input
                      value={sectionForm.title}
                      onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                      placeholder="عنوان القسم"
                      className="border-slate-200 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-600 flex items-center gap-1">
                      <AlignRight className="h-3.5 w-3.5" /> العنوان الفرعي
                    </Label>
                    <Input
                      value={sectionForm.subtitle}
                      onChange={(e) => setSectionForm({ ...sectionForm, subtitle: e.target.value })}
                      placeholder="العنوان الفرعي"
                      className="border-slate-200 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-600 flex items-center gap-1">
                      <Settings2 className="h-3.5 w-3.5" /> المحتوى (JSON)
                    </Label>
                    <p className="text-xs text-slate-400 mt-0.5 mb-1">بيانات القسم بصيغة JSON - تتحكم في المحتوى النصي المعروض (الصور في تبويب الصور)</p>
                    <Textarea
                      value={sectionForm.contentJson}
                      onChange={(e) => setSectionForm({ ...sectionForm, contentJson: e.target.value })}
                      rows={14}
                      placeholder='{"heading": "...", "description": "..."}'
                      className="font-mono text-xs border-slate-200 leading-relaxed"
                      dir="ltr"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="images" className="space-y-5">
                  {editingSection && (sectionImageFields[editingSection.sectionKey] || []).length === 0 ? (
                    <div className="text-center py-8">
                      <Image className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                      <p className="text-slate-400 text-sm">هذا القسم لا يدعم رفع الصور</p>
                      <p className="text-slate-300 text-xs mt-1">يمكنك إضافة روابط الصور في حقل المحتوى JSON</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 flex items-center gap-2">
                        <Upload className="h-4 w-4 flex-shrink-0" />
                        <span>ارفع صور القسم هنا. الصور سيتم حفظها تلقائياً مع محتوى القسم.</span>
                      </div>

                      {editingSection && (sectionImageFields[editingSection.sectionKey] || []).map((field) => (
                        <div key={field.key} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                          <ImageUploader
                            label={field.label}
                            helpText={field.helpText}
                            value={sectionForm.images[field.key] || (field.multiple ? [] : "")}
                            onChange={(val) => {
                              setSectionForm(prev => ({
                                ...prev,
                                images: { ...prev.images, [field.key]: val },
                              }));
                            }}
                            multiple={field.multiple}
                            maxImages={field.multiple ? 15 : 1}
                            folder={`cms-sections/${editingSection.sectionKey}`}
                          />
                        </div>
                      ))}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowSectionDialog(false)} className="border-slate-200">إلغاء</Button>
              <Button
                onClick={handleSaveSection}
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
                disabled={updateSection.isPending}
              >
                {updateSection.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
