import { useState } from "react";
import { X, Copy, Check, MessageCircle, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export default function ShareModal({ isOpen, onClose, title, url }: ShareModalProps) {
  const { t, isAr } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = fullUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const channels = [
    {
      name: t("share.whatsapp"),
      icon: <MessageCircle className="w-5 h-5" />,
      color: "bg-green-500 hover:bg-green-600",
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: t("share.twitter"),
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
      color: "bg-black hover:bg-gray-800",
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      name: t("share.email"),
      icon: <Mail className="w-5 h-5" />,
      color: "bg-blue-500 hover:bg-blue-600",
      url: `mailto:?subject=${encodedTitle}&body=${encodedTitle}%0A${encodedUrl}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-[#0f1b33]">{t("share.title")}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 mb-5">
          {channels.map((ch) => (
            <a key={ch.name} href={ch.url} target="_blank" rel="noopener noreferrer"
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl text-white transition-colors ${ch.color}`}>
              {ch.icon}
              <span className="text-xs font-medium">{ch.name}</span>
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-[#f8f5f0] rounded-lg p-2">
          <input type="text" value={fullUrl} readOnly className="flex-1 bg-transparent text-xs text-gray-600 outline-none" dir="ltr" />
          <button onClick={copyLink} className="flex items-center gap-1 px-3 py-1.5 bg-[#c8a45e] text-[#0f1b33] rounded-md text-xs font-semibold hover:bg-[#b8944e] transition-colors">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t("share.copied") : t("share.copyLink")}
          </button>
        </div>
      </div>
    </div>
  );
}
