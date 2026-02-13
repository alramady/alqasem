/**
 * Generic Image Gallery Manager - works for properties and projects
 * Supports multi-image upload, drag-to-reorder, delete, and set cover image
 */
import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Upload, GripVertical, Star, Loader2, ImagePlus, Trash2, AlertCircle,
} from "lucide-react";

type EntityType = "property" | "project";

interface ImageGalleryManagerProps {
  entityId: number;
  entityType: EntityType;
  onImagesChange?: (images: string[]) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const labels: Record<EntityType, { title: string; entity: string; coverLabel: string }> = {
  property: { title: "صور العقار", entity: "العقار", coverLabel: "غلاف" },
  project: { title: "صور المشروع", entity: "المشروع", coverLabel: "غلاف" },
};

export default function ImageGalleryManager({ entityId, entityType, onImagesChange }: ImageGalleryManagerProps) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const l = labels[entityType];

  // Queries - select based on entity type
  const propertyImages = trpc.admin.getPropertyImages.useQuery(
    { propertyId: entityId },
    { enabled: entityType === "property" && !!entityId }
  );
  const projectImages = trpc.admin.getProjectImages.useQuery(
    { projectId: entityId },
    { enabled: entityType === "project" && !!entityId }
  );

  const imageData = entityType === "property" ? propertyImages : projectImages;
  const refetch = imageData.refetch;
  const images = imageData.data?.images ?? [];

  // Mutations
  const uploadPropertyImage = trpc.admin.uploadPropertyImage.useMutation();
  const uploadProjectImage = trpc.admin.uploadProjectImage.useMutation();
  const removePropertyImage = trpc.admin.removePropertyImage.useMutation();
  const removeProjectImage = trpc.admin.removeProjectImage.useMutation();
  const reorderPropertyImages = trpc.admin.reorderPropertyImages.useMutation();
  const reorderProjectImages = trpc.admin.reorderProjectImages.useMutation();

  const handleUploadSuccess = useCallback(() => {
    refetch();
    setUploadingCount((c) => Math.max(0, c - 1));
  }, [refetch]);

  const handleUploadError = useCallback((err: any) => {
    toast.error(err.message || "فشل رفع الصورة");
    setUploadingCount((c) => Math.max(0, c - 1));
  }, []);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: نوع الملف غير مدعوم`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: حجم الملف يتجاوز 10 ميجابايت`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;
    setUploadingCount((c) => c + validFiles.length);

    for (const file of validFiles) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        const payload = { filename: file.name, mimeType: file.type, base64, size: file.size };

        if (entityType === "property") {
          uploadPropertyImage.mutate({ propertyId: entityId, ...payload }, { onSuccess: handleUploadSuccess, onError: handleUploadError });
        } else {
          uploadProjectImage.mutate({ projectId: entityId, ...payload }, { onSuccess: handleUploadSuccess, onError: handleUploadError });
        }
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [entityId, entityType, uploadPropertyImage, uploadProjectImage, handleUploadSuccess, handleUploadError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
      setDragOverIndex(null);
      return;
    }

    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newImages = [...images];
      const [moved] = newImages.splice(draggedIndex, 1);
      newImages.splice(dragOverIndex, 0, moved);
      if (entityType === "property") {
        reorderPropertyImages.mutate({ propertyId: entityId, images: newImages }, { onSuccess: () => refetch() });
      } else {
        reorderProjectImages.mutate({ projectId: entityId, images: newImages }, { onSuccess: () => refetch() });
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, images, entityId, entityType, reorderPropertyImages, reorderProjectImages, handleFileSelect, refetch]);

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [moved] = newImages.splice(index, 1);
    newImages.unshift(moved);
    if (entityType === "property") {
      reorderPropertyImages.mutate({ propertyId: entityId, images: newImages }, { onSuccess: () => refetch() });
    } else {
      reorderProjectImages.mutate({ projectId: entityId, images: newImages }, { onSuccess: () => refetch() });
    }
    toast.success("تم تعيين الصورة كغلاف");
  };

  const handleRemove = (imageUrl: string) => {
    if (entityType === "property") {
      removePropertyImage.mutate({ propertyId: entityId, imageUrl }, { onSuccess: () => { toast.success("تم حذف الصورة"); refetch(); }, onError: (err) => toast.error(err.message) });
    } else {
      removeProjectImage.mutate({ projectId: entityId, imageUrl }, { onSuccess: () => { toast.success("تم حذف الصورة"); refetch(); }, onError: (err) => toast.error(err.message) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-navy">{l.title}</h3>
          <p className="text-xs text-navy/50 mt-0.5">
            {images.length} صورة{images.length > 0 ? " • الصورة الأولى هي الغلاف" : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingCount > 0} className="gap-2">
          {uploadingCount > 0 ? (<><Loader2 className="w-4 h-4 animate-spin" /> جاري الرفع ({uploadingCount})</>) : (<><ImagePlus className="w-4 h-4" /> إضافة صور</>)}
        </Button>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
      </div>

      {images.length === 0 && uploadingCount === 0 ? (
        <div
          className="border-2 border-dashed border-navy/20 rounded-xl p-10 text-center cursor-pointer hover:border-gold/50 hover:bg-gold/5 transition-all"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={handleDrop}
        >
          <Upload className="w-10 h-10 text-navy/30 mx-auto mb-3" />
          <p className="text-navy/60 font-medium mb-1">اسحب الصور هنا أو اضغط للاختيار</p>
          <p className="text-xs text-navy/40">JPG, PNG, WebP, GIF — حتى 10 ميجابايت لكل صورة</p>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={handleDrop}
        >
          {images.map((url, index) => (
            <div
              key={url}
              draggable
              onDragStart={() => setDraggedIndex(index)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
              onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
              className={`relative group rounded-xl overflow-hidden border-2 transition-all aspect-square ${
                dragOverIndex === index ? "border-gold scale-105 shadow-lg" :
                index === 0 ? "border-gold/50" : "border-transparent hover:border-navy/20"
              } ${draggedIndex === index ? "opacity-40" : ""}`}
            >
              <img src={url} alt={`صورة ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
              {index === 0 && (
                <div className="absolute top-2 right-2 bg-gold text-navy text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" fill="currentColor" />{l.coverLabel}
                </div>
              )}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/60 text-white rounded-md p-1 cursor-grab active:cursor-grabbing"><GripVertical className="w-4 h-4" /></div>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                  {index !== 0 && (
                    <button onClick={() => handleSetCover(index)} className="text-xs text-white/90 hover:text-gold flex items-center gap-1 transition-colors" title="تعيين كغلاف">
                      <Star className="w-3 h-3" />{l.coverLabel}
                    </button>
                  )}
                  <button onClick={() => handleRemove(url)} className="text-xs text-white/90 hover:text-red-400 flex items-center gap-1 transition-colors mr-auto" title="حذف الصورة">
                    <Trash2 className="w-3 h-3" />حذف
                  </button>
                </div>
              </div>
            </div>
          ))}

          {uploadingCount > 0 && Array.from({ length: uploadingCount }).map((_, i) => (
            <div key={`uploading-${i}`} className="aspect-square rounded-xl border-2 border-dashed border-navy/20 flex items-center justify-center bg-navy/5">
              <div className="text-center"><Loader2 className="w-6 h-6 text-navy/40 animate-spin mx-auto mb-1" /><p className="text-[10px] text-navy/40">جاري الرفع...</p></div>
            </div>
          ))}

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
            className="aspect-square rounded-xl border-2 border-dashed border-navy/20 flex items-center justify-center cursor-pointer hover:border-gold/50 hover:bg-gold/5 transition-all"
          >
            <div className="text-center"><ImagePlus className="w-6 h-6 text-navy/30 mx-auto mb-1" /><p className="text-[10px] text-navy/40">إضافة المزيد</p></div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-navy/40 bg-navy/5 rounded-lg p-3">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <p>اسحب الصور لإعادة ترتيبها. الصورة الأولى تُستخدم كغلاف في القوائم والبطاقات.</p>
          <p className="mt-1">الأنواع المدعومة: JPG, PNG, WebP, GIF — الحد الأقصى: 10 ميجابايت لكل صورة.</p>
        </div>
      </div>
    </div>
  );
}
