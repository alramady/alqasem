import { useEffect, useCallback, useSyncExternalStore, useRef } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

const STORAGE_KEY = "alqasim_favorites";
const STORAGE_ORDER_KEY = "alqasim_favorites_order"; // tracks order of addition

// External store for cross-component sync (localStorage-based for guests)
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
  const localFavIds = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Always call hooks unconditionally (React rules of hooks)
  // customer.me returns null when not logged in — never throws
  const meQuery = trpc.customer.me.useQuery(undefined, {
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const customerData = meQuery.data ?? null;
  const isCustomerLoggedIn = !!customerData;

  // DB-based favorites for logged-in customers
  const dbFavsQuery = trpc.customer.getFavorites.useQuery(undefined, {
    enabled: isCustomerLoggedIn,
    staleTime: 1000 * 30,
  });

  const syncMutation = trpc.customer.syncFavorites.useMutation();
  const toggleMutation = trpc.customer.toggleFavorite.useMutation();
  const clearMutation = trpc.customer.clearFavorites.useMutation();
  const utils = trpc.useUtils();

  // Sync localStorage favorites to DB on login
  const hasSynced = useRef(false);
  useEffect(() => {
    if (isCustomerLoggedIn && !hasSynced.current && cachedIds.length > 0) {
      hasSynced.current = true;
      syncMutation.mutate(
        { propertyIds: cachedIds },
        {
          onSuccess: (serverIds) => {
            // Update localStorage with merged server data
            const newOrder = { ...cachedOrder };
            for (const id of serverIds) {
              if (!newOrder[id]) newOrder[id] = Date.now();
            }
            writeToStorage(serverIds, newOrder);
            utils.customer.getFavorites.invalidate();
          },
        }
      );
    }
    if (!isCustomerLoggedIn) {
      hasSynced.current = false;
    }
  }, [isCustomerLoggedIn]);

  // Use DB favorites when logged in, localStorage when guest
  const favIds = isCustomerLoggedIn && dbFavsQuery.data ? dbFavsQuery.data : localFavIds;

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

      const isCurrentlyFav = favIds.includes(id);

      if (isCustomerLoggedIn) {
        // Optimistic update for localStorage
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

        // Also update DB
        toggleMutation.mutate(
          { propertyId: id },
          {
            onSuccess: () => {
              utils.customer.getFavorites.invalidate();
            },
            onError: () => {
              // Rollback
              writeToStorage(cachedIds, cachedOrder);
              utils.customer.getFavorites.invalidate();
            },
          }
        );
      } else {
        // Guest: localStorage only
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
      }
    },
    [favIds, isCustomerLoggedIn, t]
  );

  const removeFavorite = useCallback(
    (id: number) => {
      const newIds = cachedIds.filter((f) => f !== id);
      const newOrder = { ...cachedOrder };
      delete newOrder[id];
      writeToStorage(newIds, newOrder);
      toast.success(t("favorites.removed"));

      if (isCustomerLoggedIn) {
        toggleMutation.mutate(
          { propertyId: id },
          { onSuccess: () => utils.customer.getFavorites.invalidate() }
        );
      }
    },
    [t, isCustomerLoggedIn]
  );

  const clearAll = useCallback(() => {
    writeToStorage([], {});
    toast.success(isAr ? "تم مسح جميع المفضلة" : "All favorites cleared");

    if (isCustomerLoggedIn) {
      clearMutation.mutate(undefined, {
        onSuccess: () => utils.customer.getFavorites.invalidate(),
      });
    }
  }, [isAr, isCustomerLoggedIn]);

  const getAddedTime = useCallback(
    (id: number) => cachedOrder[id] || 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [favIds] // re-derive when favIds change
  );

  const count = favIds.length;

  const shareUrl = useCallback(() => {
    if (favIds.length === 0) return "";
    const base = window.location.origin;
    return `${base}/favorites?ids=${favIds.join(",")}`;
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
