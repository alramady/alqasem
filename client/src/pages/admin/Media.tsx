import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Upload, Trash2, Grid, List, Search, Image as ImageIcon,
  FileVideo, FileText as FileTextIcon, Copy, X, ExternalLink,
  Loader2
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export default function AdminMedia() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: mediaList, refetch } = trpc.admin.listMedia.useQuery({ search });
  const uploadMedia = trpc.admin.uploadMedia.useMutation({
    onSuccess: () => { toast.success("تم رفع الملف بنجاح"); refetch(); },
    onError: (err: any) => toast.error(err.message),
    onSettled: () => setUploading(false),
  });
  const deleteMedia = trpc.admin.deleteMedia.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الملف");
      refetch();
      if (previewItem) setPreviewItem(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    let completed = 0;
    const total = files.length;
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`الملف ${file.name} أكبر من 10MB`);
        completed++;
        if (completed === total) setUploading(false);
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        uploadMedia.mutate({ filename: file.name, mimeType: file.type, base64, size: file.size });
        completed++;
        if (completed === total && !uploadMedia.isPending) setUploading(false);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const copyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("تم نسخ الرابط");
  }, []);

  const getIcon = (type: string) => {
    if (type?.startsWith("image")) return <ImageIcon className="w-10 h-10 text-indigo-400" />;
    if (type?.startsWith("video")) return <FileVideo className="w-10 h-10 text-purple-400" />;
    return <FileTextIcon className="w-10 h-10 text-slate-400" />;
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const mediaItems = mediaList ?? [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">مكتبة الوسائط</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              رفع وإدارة الصور والملفات ({mediaItems.length} ملف)
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode("grid")} className={`p-2 transition-colors ${viewMode === "grid" ? "bg-indigo-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                <Grid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-indigo-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf" className="hidden" onChange={handleUpload} />
            <Button
              className="bg-indigo-500 text-white hover:bg-indigo-600 rounded-lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Upload className="w-4 h-4 ml-2" />}
              {uploading ? "جاري الرفع..." : "رفع ملف"}
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="بحث في الملفات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 border-slate-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Grid View */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {/* Upload dropzone card */}
            <Card
              className="border-2 border-dashed border-slate-200 hover:border-indigo-300 cursor-pointer transition-all group rounded-xl"
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="p-0 flex flex-col items-center justify-center h-44 text-slate-300 group-hover:text-indigo-400 transition-colors">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-xs">رفع ملف جديد</span>
              </CardContent>
            </Card>

            {mediaItems.length === 0 && !uploading ? (
              <div className="col-span-full text-center py-16 text-slate-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                <p>لا توجد ملفات بعد</p>
                <p className="text-xs mt-1">اضغط على "رفع ملف" لإضافة صور وملفات</p>
              </div>
            ) : (
              mediaItems.map((m: any) => (
                <Card
                  key={m.id}
                  className="border border-slate-100 shadow-sm group relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow rounded-xl"
                  onClick={() => setPreviewItem(m)}
                >
                  <CardContent className="p-0">
                    {m.mimeType?.startsWith("image") ? (
                      <img
                        src={m.filePath}
                        alt={m.altText || m.filename}
                        className="w-full h-36 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-36 bg-slate-50 flex items-center justify-center">
                        {getIcon(m.mimeType)}
                      </div>
                    )}
                    <div className="p-2.5">
                      <p className="text-xs text-slate-700 truncate font-medium">{m.filename}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatSize(m.fileSize)}</p>
                    </div>
                    {/* Hover overlay with actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white rounded-lg"
                        onClick={(e) => { e.stopPropagation(); copyUrl(m.filePath); }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("هل أنت متأكد من حذف هذا الملف؟")) {
                            deleteMedia.mutate({ id: m.id });
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* List View */
          <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs w-12">معاينة</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الملف</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">النوع</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الحجم</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">التاريخ</th>
                    <th className="text-right py-3.5 px-4 text-slate-400 font-medium text-xs">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {mediaItems.map((m: any) => (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors" onClick={() => setPreviewItem(m)}>
                      <td className="py-2 px-4">
                        {m.mimeType?.startsWith("image") ? (
                          <img src={m.filePath} alt="" className="w-10 h-10 object-cover rounded-lg" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                            {getIcon(m.mimeType)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{m.filename}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{m.mimeType}</td>
                      <td className="py-3 px-4 text-slate-500">{formatSize(m.fileSize)}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{m.createdAt ? new Date(m.createdAt).toLocaleDateString("ar-SA") : "-"}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-indigo-50" onClick={(e) => { e.stopPropagation(); copyUrl(m.filePath); }}>
                            <Copy className="w-4 h-4 text-indigo-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("هل أنت متأكد من حذف هذا الملف؟")) {
                                deleteMedia.mutate({ id: m.id });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mediaItems.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                  <p>لا توجد ملفات بعد</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Lightbox */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            {/* Preview header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 truncate flex-1 ml-4">{previewItem.filename}</h3>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg" onClick={() => setPreviewItem(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Preview content */}
            <div className="p-4">
              {previewItem.mimeType?.startsWith("image") ? (
                <img
                  src={previewItem.filePath}
                  alt={previewItem.altText || previewItem.filename}
                  className="w-full max-h-[50vh] object-contain rounded-xl bg-slate-50"
                />
              ) : previewItem.mimeType?.startsWith("video") ? (
                <video
                  src={previewItem.filePath}
                  controls
                  className="w-full max-h-[50vh] rounded-xl bg-black"
                />
              ) : (
                <div className="w-full h-48 bg-slate-50 rounded-xl flex items-center justify-center">
                  {getIcon(previewItem.mimeType)}
                </div>
              )}
            </div>

            {/* Preview details */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3 rounded-b-2xl">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400">اسم الملف:</span>
                  <p className="text-slate-700 font-medium">{previewItem.filename}</p>
                </div>
                <div>
                  <span className="text-slate-400">النوع:</span>
                  <p className="text-slate-700">{previewItem.mimeType}</p>
                </div>
                <div>
                  <span className="text-slate-400">الحجم:</span>
                  <p className="text-slate-700">{formatSize(previewItem.fileSize)}</p>
                </div>
                <div>
                  <span className="text-slate-400">التاريخ:</span>
                  <p className="text-slate-700">{previewItem.createdAt ? new Date(previewItem.createdAt).toLocaleDateString("ar-SA") : "-"}</p>
                </div>
              </div>

              {/* URL field with copy */}
              <div>
                <span className="text-slate-400 text-sm">رابط الملف:</span>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={previewItem.filePath}
                    readOnly
                    className="text-xs bg-white border-slate-200"
                    dir="ltr"
                  />
                  <Button variant="outline" size="sm" className="border-slate-200" onClick={() => copyUrl(previewItem.filePath)}>
                    <Copy className="w-4 h-4 ml-1" />نسخ
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-200" asChild>
                    <a href={previewItem.filePath} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 ml-1" />فتح
                    </a>
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => {
                    if (confirm("هل أنت متأكد من حذف هذا الملف؟")) {
                      deleteMedia.mutate({ id: previewItem.id });
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 ml-1" />حذف الملف
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
