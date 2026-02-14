import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Loader2, Plus, Trash2, GripVertical } from "lucide-react";

interface ImageUploaderProps {
  /** Current image URL(s) */
  value?: string | string[];
  /** Called when image(s) change */
  onChange: (value: string | string[]) => void;
  /** Allow multiple images */
  multiple?: boolean;
  /** Maximum number of images (for multiple mode) */
  maxImages?: number;
  /** Upload folder name for S3 organization */
  folder?: string;
  /** Label text */
  label?: string;
  /** Help text */
  helpText?: string;
  /** Compact mode (smaller size) */
  compact?: boolean;
  /** Max file size in MB */
  maxSizeMB?: number;
  /** Accepted file types */
  accept?: string;
}

const MAX_FILE_SIZE_DEFAULT = 5; // 5MB

export default function ImageUploader({
  value,
  onChange,
  multiple = false,
  maxImages = 10,
  folder = "cms",
  label,
  helpText,
  compact = false,
  maxSizeMB = MAX_FILE_SIZE_DEFAULT,
  accept = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMedia = trpc.admin.uploadMedia.useMutation();

  // Normalize value to array
  const images: string[] = Array.isArray(value)
    ? value
    : value
    ? [value]
    : [];

  const canAddMore = multiple ? images.length < maxImages : images.length === 0;

  const processFile = useCallback(
    async (file: File): Promise<string | null> => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(`الملف "${file.name}" ليس صورة`);
        return null;
      }

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`الملف "${file.name}" أكبر من ${maxSizeMB}MB`);
        return null;
      }

      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // Remove data:image/...;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload via tRPC
      const result = await uploadMedia.mutateAsync({
        filename: file.name,
        mimeType: file.type,
        base64,
        size: file.size,
        folder,
      });

      return result.url;
    },
    [folder, maxSizeMB, uploadMedia]
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (!canAddMore) {
        toast.error(
          multiple
            ? `الحد الأقصى ${maxImages} صور`
            : "يمكنك رفع صورة واحدة فقط"
        );
        return;
      }

      const allowedCount = multiple
        ? Math.min(fileArray.length, maxImages - images.length)
        : 1;
      const filesToUpload = fileArray.slice(0, allowedCount);

      setUploading(true);
      const newUrls: string[] = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadProgress(
          `جاري رفع ${i + 1} من ${filesToUpload.length}...`
        );
        try {
          const url = await processFile(filesToUpload[i]);
          if (url) newUrls.push(url);
        } catch (err: any) {
          toast.error(`فشل رفع "${filesToUpload[i].name}": ${err.message}`);
        }
      }

      setUploading(false);
      setUploadProgress("");

      if (newUrls.length > 0) {
        if (multiple) {
          onChange([...images, ...newUrls]);
        } else {
          onChange(newUrls[0]);
        }
        toast.success(
          newUrls.length === 1
            ? "تم رفع الصورة بنجاح"
            : `تم رفع ${newUrls.length} صور بنجاح`
        );
      }
    },
    [canAddMore, images, maxImages, multiple, onChange, processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleRemove = useCallback(
    (index: number) => {
      if (multiple) {
        const updated = images.filter((_, i) => i !== index);
        onChange(updated);
      } else {
        onChange("");
      }
    },
    [images, multiple, onChange]
  );

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!multiple) return;
      const updated = [...images];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      onChange(updated);
    },
    [images, multiple, onChange]
  );

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5" />
          {label}
        </label>
      )}

      {/* Current Images */}
      {images.length > 0 && (
        <div className={`grid gap-2 ${compact ? "grid-cols-4" : multiple ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-1"}`}>
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className={`relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50 ${
                compact ? "aspect-square" : multiple ? "aspect-square" : "aspect-video max-h-48"
              }`}
            >
              <img
                src={url}
                alt={`صورة ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f1f5f9' width='100' height='100'/%3E%3Ctext fill='%2394a3b8' font-size='12' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3Eخطأ%3C/text%3E%3C/svg%3E";
                }}
              />
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-1">
                  {multiple && index > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 bg-white/90 hover:bg-white rounded-full"
                      onClick={() => handleReorder(index, index - 1)}
                      title="تقديم"
                    >
                      <GripVertical className="h-3.5 w-3.5 text-slate-600" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 bg-red-500/90 hover:bg-red-600 rounded-full"
                    onClick={() => handleRemove(index)}
                    title="حذف الصورة"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-white" />
                  </Button>
                </div>
              </div>
              {/* Image number badge */}
              {multiple && images.length > 1 && (
                <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                  {index + 1}
                </div>
              )}
            </div>
          ))}

          {/* Add more button (for multiple mode) */}
          {multiple && canAddMore && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-indigo-500"
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  <span className="text-[10px]">إضافة</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Drop Zone (show when no images or in single mode with replace) */}
      {canAddMore && images.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`
            relative rounded-xl border-2 border-dashed transition-all cursor-pointer
            ${dragOver
              ? "border-indigo-400 bg-indigo-50"
              : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
            }
            ${compact ? "p-4" : "p-6"}
          `}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                <p className="text-sm text-indigo-600 font-medium">{uploadProgress || "جاري الرفع..."}</p>
              </>
            ) : (
              <>
                <div className={`rounded-full bg-indigo-50 flex items-center justify-center ${compact ? "w-10 h-10" : "w-14 h-14"}`}>
                  <Upload className={`text-indigo-500 ${compact ? "h-5 w-5" : "h-6 w-6"}`} />
                </div>
                <div>
                  <p className={`font-medium text-slate-700 ${compact ? "text-xs" : "text-sm"}`}>
                    {dragOver ? "أفلت الصورة هنا" : "اسحب وأفلت أو اضغط للاختيار"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {multiple
                      ? `يدعم JPG, PNG, WebP, GIF, SVG • حتى ${maxImages} صور • الحد ${maxSizeMB}MB لكل صورة`
                      : `يدعم JPG, PNG, WebP, GIF, SVG • الحد ${maxSizeMB}MB`
                    }
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Single image replace button */}
      {!multiple && images.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs border-slate-200 text-slate-500 hover:bg-slate-50 gap-1.5"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {uploadProgress || "جاري الرفع..."}
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" />
              استبدال الصورة
            </>
          )}
        </Button>
      )}

      {helpText && (
        <p className="text-[10px] text-slate-400">{helpText}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
            e.target.value = ""; // Reset so same file can be selected again
          }
        }}
      />
    </div>
  );
}
