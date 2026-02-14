import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Image as ImageIcon, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo2, Redo2, Table as TableIcon, Highlighter,
  Palette, Minus, Code2, Eye, EyeOff, Pilcrow,
  Upload, X, ChevronDown, Link2Off
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface WysiwygEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  dir?: "rtl" | "ltr";
}

// Toolbar button component
function ToolbarBtn({
  active,
  disabled,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? "bg-indigo-100 text-indigo-700"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}

// Toolbar separator
function Sep() {
  return <div className="w-px h-5 bg-slate-200 mx-0.5" />;
}

export default function WysiwygEditor({
  value,
  onChange,
  placeholder = "ابدأ الكتابة هنا...",
  minHeight = "300px",
  dir = "rtl",
}: WysiwygEditorProps) {
  const [showSource, setShowSource] = useState(false);
  const [sourceCode, setSourceCode] = useState(value);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMedia = trpc.admin.uploadMedia.useMutation();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-indigo-600 underline hover:text-indigo-800",
        },
      }),
      ImageExt.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full mx-auto my-4",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse border border-slate-300 w-full my-4",
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-slate-300 p-2",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-slate-300 p-2 bg-slate-100 font-bold",
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none",
        dir: dir,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value]);

  // Handle source code toggle
  const toggleSource = useCallback(() => {
    if (showSource) {
      // Switching from source to visual
      if (editor) {
        editor.commands.setContent(sourceCode, { emitUpdate: false });
        onChange(sourceCode);
      }
    } else {
      // Switching from visual to source
      setSourceCode(editor?.getHTML() || "");
    }
    setShowSource(!showSource);
  }, [showSource, sourceCode, editor, onChange]);

  // Handle image upload
  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          const result = await uploadMedia.mutateAsync({
            base64,
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            folder: "cms-wysiwyg",
          });
          if (result.url) {
            editor.chain().focus().setImage({ src: result.url }).run();
            toast.success("تم رفع الصورة بنجاح");
          }
        } catch (err) {
          toast.error("فشل رفع الصورة");
        }
      };
      reader.readAsDataURL(file);
    },
    [editor, uploadMedia]
  );

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleImageUpload(file);
      e.target.value = "";
    },
    [handleImageUpload]
  );

  // Handle paste images
  useEffect(() => {
    if (!editor) return;
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) handleImageUpload(file);
          break;
        }
      }
    };
    const editorEl = editor.view.dom;
    editorEl.addEventListener("paste", handlePaste);
    return () => editorEl.removeEventListener("paste", handlePaste);
  }, [editor, handleImageUpload]);

  // Add link
  const addLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl, target: "_blank" })
      .run();
    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  // Add image from URL
  const addImageFromUrl = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl("");
    setShowImageInput(false);
  }, [editor, imageUrl]);

  if (!editor) return null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-2 py-1.5 flex flex-wrap items-center gap-0.5">
        {/* Undo/Redo */}
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="تراجع">
          <Undo2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="إعادة">
          <Redo2 className="h-4 w-4" />
        </ToolbarBtn>

        <Sep />

        {/* Text formatting */}
        <ToolbarBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="عريض">
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="مائل">
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="تسطير">
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="يتوسطه خط">
          <Strikethrough className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()} title="تمييز">
          <Highlighter className="h-4 w-4" />
        </ToolbarBtn>

        <Sep />

        {/* Headings */}
        <ToolbarBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="عنوان 1">
          <Heading1 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="عنوان 2">
          <Heading2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="عنوان 3">
          <Heading3 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()} title="فقرة">
          <Pilcrow className="h-4 w-4" />
        </ToolbarBtn>

        <Sep />

        {/* Alignment */}
        <ToolbarBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="محاذاة يمين">
          <AlignRight className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="توسيط">
          <AlignCenter className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="محاذاة يسار">
          <AlignLeft className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="ضبط">
          <AlignJustify className="h-4 w-4" />
        </ToolbarBtn>

        <Sep />

        {/* Lists */}
        <ToolbarBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="قائمة نقطية">
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="قائمة مرقمة">
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>

        <Sep />

        {/* Block elements */}
        <ToolbarBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="اقتباس">
          <Quote className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="كود">
          <Code className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="خط فاصل">
          <Minus className="h-4 w-4" />
        </ToolbarBtn>

        <Sep />

        {/* Table */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="إدراج جدول"
        >
          <TableIcon className="h-4 w-4" />
        </ToolbarBtn>

        <Sep />

        {/* Link */}
        <div className="relative">
          <ToolbarBtn
            active={editor.isActive("link")}
            onClick={() => {
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run();
              } else {
                const previousUrl = editor.getAttributes("link").href || "";
                setLinkUrl(previousUrl);
                setShowLinkInput(!showLinkInput);
                setShowImageInput(false);
              }
            }}
            title={editor.isActive("link") ? "إزالة الرابط" : "إضافة رابط"}
          >
            {editor.isActive("link") ? <Link2Off className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
          </ToolbarBtn>
          {showLinkInput && (
            <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex items-center gap-1.5 w-72">
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="h-8 text-xs border-slate-200"
                dir="ltr"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") addLink(); if (e.key === "Escape") setShowLinkInput(false); }}
              />
              <Button size="sm" className="h-8 px-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs" onClick={addLink}>
                إضافة
              </Button>
              <button type="button" onClick={() => setShowLinkInput(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Image */}
        <div className="relative">
          <ToolbarBtn
            onClick={() => {
              setShowImageInput(!showImageInput);
              setShowLinkInput(false);
            }}
            title="إدراج صورة"
          >
            <ImageIcon className="h-4 w-4" />
          </ToolbarBtn>
          {showImageInput && (
            <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-3 w-80">
              <p className="text-xs font-medium text-slate-600 mb-2">إدراج صورة</p>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="رابط الصورة (URL)"
                    className="h-8 text-xs border-slate-200"
                    dir="ltr"
                    onKeyDown={(e) => { if (e.key === "Enter") addImageFromUrl(); if (e.key === "Escape") setShowImageInput(false); }}
                  />
                  <Button size="sm" className="h-8 px-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs" onClick={addImageFromUrl}>
                    إدراج
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] text-slate-400">أو</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs gap-1.5 border-slate-200"
                  onClick={() => { fileInputRef.current?.click(); setShowImageInput(false); }}
                >
                  <Upload className="h-3.5 w-3.5" />
                  رفع صورة من الجهاز
                </Button>
              </div>
              <button type="button" onClick={() => setShowImageInput(false)} className="absolute top-2 left-2 p-1 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <Sep />

        {/* Source toggle */}
        <ToolbarBtn active={showSource} onClick={toggleSource} title={showSource ? "العودة للمحرر المرئي" : "عرض كود HTML"}>
          <Code2 className="h-4 w-4" />
        </ToolbarBtn>
      </div>

      {/* Table context menu - shows when cursor is in a table */}
      {editor.isActive("table") && (
        <div className="border-b border-slate-200 bg-amber-50/50 px-3 py-1 flex items-center gap-1 text-xs">
          <span className="text-amber-700 font-medium ml-2">جدول:</span>
          <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()} className="px-2 py-0.5 rounded text-amber-700 hover:bg-amber-100 transition-colors">
            + عمود قبل
          </button>
          <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-2 py-0.5 rounded text-amber-700 hover:bg-amber-100 transition-colors">
            + عمود بعد
          </button>
          <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()} className="px-2 py-0.5 rounded text-amber-700 hover:bg-amber-100 transition-colors">
            + صف قبل
          </button>
          <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="px-2 py-0.5 rounded text-amber-700 hover:bg-amber-100 transition-colors">
            + صف بعد
          </button>
          <Sep />
          <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="px-2 py-0.5 rounded text-red-600 hover:bg-red-50 transition-colors">
            حذف عمود
          </button>
          <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="px-2 py-0.5 rounded text-red-600 hover:bg-red-50 transition-colors">
            حذف صف
          </button>
          <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="px-2 py-0.5 rounded text-red-600 hover:bg-red-50 transition-colors">
            حذف الجدول
          </button>
        </div>
      )}

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Editor content or source view */}
      {showSource ? (
        <div className="p-3">
          <Textarea
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            className="font-mono text-xs border-slate-200 leading-relaxed"
            style={{ minHeight }}
            dir="ltr"
            placeholder="<h2>عنوان</h2><p>محتوى الصفحة...</p>"
          />
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <Code2 className="h-3.5 w-3.5" />
            <span>وضع كود HTML - اضغط على زر الكود مرة أخرى للعودة للمحرر المرئي</span>
          </div>
        </div>
      ) : (
        <div className="wysiwyg-editor-content" style={{ minHeight }} dir={dir}>
          <EditorContent editor={editor} />
        </div>
      )}

      {/* Status bar */}
      <div className="border-t border-slate-200 bg-slate-50/50 px-3 py-1 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>{editor.storage.characterCount?.characters?.() ?? editor.getText().length} حرف</span>
          <span>{editor.storage.characterCount?.words?.() ?? editor.getText().split(/\s+/).filter(Boolean).length} كلمة</span>
        </div>
        <div className="flex items-center gap-1.5">
          {showSource ? (
            <span className="text-amber-600 flex items-center gap-1"><Code2 className="h-3 w-3" /> وضع HTML</span>
          ) : (
            <span className="text-emerald-600 flex items-center gap-1"><Eye className="h-3 w-3" /> محرر مرئي</span>
          )}
        </div>
      </div>
    </div>
  );
}
