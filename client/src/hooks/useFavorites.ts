import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "alqasim_favorites";
const STORAGE_ORDER_KEY = "alqasim_favorites_order"; // tracks order of addition

// External store for cross-component sync
let listeners: Array<() => void> = [];
let cachedIds: number[] = [];
let cachedOrder: Record<number, number> = {}; // id -> timestamp

function readFromStorage(): { ids: number[]; order: Record<number, number> } {
  try {
    const ids = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const order = JSON.parse(localStorage.getItem(STORAGE_ORDER_KEY) || "{}");
    return { ids: Array.isArray(ids) ? ids : [], order: typeof order === "object" ? order : {} };
  } catch {
    return { ids: [], order: {} };
  }
}

function writeToStorage(ids: number[], order: Record<number, number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(order));
  cachedIds = ids;
  cachedOrder = order;
  listeners.forEach((l) => l());
}

// Initialize cache
const initial = readFromStorage();
cachedIds = initial.ids;
cachedOrder = initial.order;

// Listen for changes from other tabs
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === STORAGE_ORDER_KEY) {
      const updated = readFromStorage();
      cachedIds = updated.ids;
      cachedOrder = updated.order;
      listeners.forEach((l) => l());
    }
  });
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return cachedIds;
}

export function useFavorites() {
  const { t, isAr } = useLanguage();
  const favIds = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const isFavorite = useCallback(
    (id: number) => favIds.includes(id),
    [favIds]
  );

  const toggleFavorite = useCallback(
    (id: number, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const isCurrentlyFav = cachedIds.includes(id);
      let newIds: number[];
      let newOrder = { ...cachedOrder };

      if (isCurrentlyFav) {
        newIds = cachedIds.filter((f) => f !== id);
        delete newOrder[id];
        toast.success(t("favorites.removed"));
      } else {
        newIds = [...cachedIds, id];
        newOrder[id] = Date.now();
        toast.success(t("favorites.added"));
      }
      writeToStorage(newIds, newOrder);
    },
    [t]
  );

  const removeFavorite = useCallback(
    (id: number) => {
      const newIds = cachedIds.filter((f) => f !== id);
      const newOrder = { ...cachedOrder };
      delete newOrder[id];
      writeToStorage(newIds, newOrder);
      toast.success(t("favorites.removed"));
    },
    [t]
  );

  const clearAll = useCallback(() => {
    writeToStorage([], {});
    toast.success(isAr ? "تم مسح جميع المفضلة" : "All favorites cleared");
  }, [isAr]);

  const getAddedTime = useCallback(
    (id: number) => cachedOrder[id] || 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [favIds] // re-derive when favIds change
  );

  const count = favIds.length;

  const shareUrl = useCallback(() => {
    if (cachedIds.length === 0) return "";
    const base = window.location.origin;
    return `${base}/favorites?ids=${cachedIds.join(",")}`;
  }, [favIds]);

  return {
    favIds,
    count,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearAll,
    getAddedTime,
    shareUrl,
  };
}
