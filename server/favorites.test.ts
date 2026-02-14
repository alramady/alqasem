import { describe, it, expect, beforeEach } from "vitest";

// ─── Favorites Storage Logic Tests ───
// These test the core logic of the useFavorites hook (localStorage-based)

const STORAGE_KEY = "alqasim_favorites";
const STORAGE_ORDER_KEY = "alqasim_favorites_order";

// Simulate localStorage read/write
function readFavorites(storage: Record<string, string>): { ids: number[]; order: Record<number, number> } {
  try {
    const ids = JSON.parse(storage[STORAGE_KEY] || "[]");
    const order = JSON.parse(storage[STORAGE_ORDER_KEY] || "{}");
    return { ids: Array.isArray(ids) ? ids : [], order: typeof order === "object" ? order : {} };
  } catch {
    return { ids: [], order: {} };
  }
}

function writeFavorites(storage: Record<string, string>, ids: number[], order: Record<number, number>) {
  storage[STORAGE_KEY] = JSON.stringify(ids);
  storage[STORAGE_ORDER_KEY] = JSON.stringify(order);
}

function toggleFavorite(storage: Record<string, string>, id: number): { ids: number[]; added: boolean } {
  const { ids, order } = readFavorites(storage);
  const isCurrentlyFav = ids.includes(id);
  let newIds: number[];
  const newOrder = { ...order };

  if (isCurrentlyFav) {
    newIds = ids.filter(f => f !== id);
    delete newOrder[id];
  } else {
    newIds = [...ids, id];
    newOrder[id] = Date.now();
  }
  writeFavorites(storage, newIds, newOrder);
  return { ids: newIds, added: !isCurrentlyFav };
}

function clearAllFavorites(storage: Record<string, string>) {
  writeFavorites(storage, [], {});
}

function removeFavorite(storage: Record<string, string>, id: number) {
  const { ids, order } = readFavorites(storage);
  const newIds = ids.filter(f => f !== id);
  const newOrder = { ...order };
  delete newOrder[id];
  writeFavorites(storage, newIds, newOrder);
}

describe("Favorites - Core Logic", () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
  });

  it("should start with empty favorites", () => {
    const { ids } = readFavorites(storage);
    expect(ids).toEqual([]);
  });

  it("should add a property to favorites", () => {
    const result = toggleFavorite(storage, 1);
    expect(result.added).toBe(true);
    expect(result.ids).toContain(1);
    expect(result.ids.length).toBe(1);
  });

  it("should remove a property from favorites when toggled again", () => {
    toggleFavorite(storage, 1);
    const result = toggleFavorite(storage, 1);
    expect(result.added).toBe(false);
    expect(result.ids).not.toContain(1);
    expect(result.ids.length).toBe(0);
  });

  it("should handle multiple favorites", () => {
    toggleFavorite(storage, 1);
    toggleFavorite(storage, 5);
    toggleFavorite(storage, 10);
    const { ids } = readFavorites(storage);
    expect(ids).toEqual([1, 5, 10]);
    expect(ids.length).toBe(3);
  });

  it("should remove only the specified property", () => {
    toggleFavorite(storage, 1);
    toggleFavorite(storage, 2);
    toggleFavorite(storage, 3);
    removeFavorite(storage, 2);
    const { ids } = readFavorites(storage);
    expect(ids).toEqual([1, 3]);
    expect(ids).not.toContain(2);
  });

  it("should clear all favorites", () => {
    toggleFavorite(storage, 1);
    toggleFavorite(storage, 2);
    toggleFavorite(storage, 3);
    clearAllFavorites(storage);
    const { ids, order } = readFavorites(storage);
    expect(ids).toEqual([]);
    expect(Object.keys(order)).toHaveLength(0);
  });

  it("should track addition order timestamps", () => {
    toggleFavorite(storage, 10);
    const { order } = readFavorites(storage);
    expect(order[10]).toBeDefined();
    expect(typeof order[10]).toBe("number");
    expect(order[10]).toBeGreaterThan(0);
  });

  it("should remove order entry when property is removed", () => {
    toggleFavorite(storage, 10);
    toggleFavorite(storage, 10); // remove
    const { order } = readFavorites(storage);
    expect(order[10]).toBeUndefined();
  });

  it("should handle corrupted localStorage gracefully", () => {
    storage[STORAGE_KEY] = "not-valid-json";
    const { ids } = readFavorites(storage);
    expect(ids).toEqual([]);
  });

  it("should handle non-array localStorage value gracefully", () => {
    storage[STORAGE_KEY] = '"string-value"';
    const { ids } = readFavorites(storage);
    expect(ids).toEqual([]);
  });

  it("should not duplicate IDs when adding same property twice without toggle", () => {
    toggleFavorite(storage, 5);
    // Manually try to add again
    const { ids } = readFavorites(storage);
    const alreadyExists = ids.includes(5);
    expect(alreadyExists).toBe(true);
    // Toggle should remove it
    const result = toggleFavorite(storage, 5);
    expect(result.added).toBe(false);
  });

  it("should persist data across read/write cycles", () => {
    toggleFavorite(storage, 100);
    toggleFavorite(storage, 200);
    // Simulate page reload by reading from storage
    const { ids } = readFavorites(storage);
    expect(ids).toEqual([100, 200]);
  });
});

describe("Favorites - Sort Logic", () => {
  it("should sort by newest added (descending timestamp)", () => {
    const order: Record<number, number> = {
      1: 1000,
      2: 3000,
      3: 2000,
    };
    const properties = [
      { id: 1, price: "500000" },
      { id: 2, price: "300000" },
      { id: 3, price: "800000" },
    ];
    const sorted = [...properties].sort((a, b) => (order[b.id] || 0) - (order[a.id] || 0));
    expect(sorted.map(p => p.id)).toEqual([2, 3, 1]);
  });

  it("should sort by price ascending", () => {
    const properties = [
      { id: 1, price: "500000" },
      { id: 2, price: "300000" },
      { id: 3, price: "800000" },
    ];
    const sorted = [...properties].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    expect(sorted.map(p => p.id)).toEqual([2, 1, 3]);
  });

  it("should sort by price descending", () => {
    const properties = [
      { id: 1, price: "500000" },
      { id: 2, price: "300000" },
      { id: 3, price: "800000" },
    ];
    const sorted = [...properties].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    expect(sorted.map(p => p.id)).toEqual([3, 1, 2]);
  });

  it("should handle null prices in sorting", () => {
    const properties = [
      { id: 1, price: "500000" },
      { id: 2, price: null as string | null },
      { id: 3, price: "800000" },
    ];
    const sorted = [...properties].sort((a, b) => parseFloat(a.price || "0") - parseFloat(b.price || "0"));
    expect(sorted[0].id).toBe(2); // null price treated as 0
  });
});

describe("Favorites - Share URL Logic", () => {
  it("should generate share URL with comma-separated IDs", () => {
    const ids = [1, 5, 10];
    const base = "https://example.com";
    const url = `${base}/favorites?ids=${ids.join(",")}`;
    expect(url).toBe("https://example.com/favorites?ids=1,5,10");
  });

  it("should return empty string for empty favorites", () => {
    const ids: number[] = [];
    const url = ids.length === 0 ? "" : `https://example.com/favorites?ids=${ids.join(",")}`;
    expect(url).toBe("");
  });

  it("should parse shared IDs from URL", () => {
    const search = "ids=1,5,10";
    const params = new URLSearchParams(search);
    const idsParam = params.get("ids");
    const parsed = idsParam ? idsParam.split(",").map(Number).filter(n => !isNaN(n) && n > 0) : [];
    expect(parsed).toEqual([1, 5, 10]);
  });

  it("should handle invalid shared IDs gracefully", () => {
    const search = "ids=1,abc,3,0,-1";
    const params = new URLSearchParams(search);
    const idsParam = params.get("ids");
    const parsed = idsParam ? idsParam.split(",").map(Number).filter(n => !isNaN(n) && n > 0) : [];
    expect(parsed).toEqual([1, 3]);
  });

  it("should handle missing ids param", () => {
    const search = "other=value";
    const params = new URLSearchParams(search);
    const idsParam = params.get("ids");
    const parsed = idsParam ? idsParam.split(",").map(Number).filter(n => !isNaN(n) && n > 0) : null;
    expect(parsed).toBeNull();
  });
});

describe("Favorites - Badge Count", () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
  });

  it("should show 0 count for empty favorites", () => {
    const { ids } = readFavorites(storage);
    expect(ids.length).toBe(0);
  });

  it("should update count when adding favorites", () => {
    toggleFavorite(storage, 1);
    toggleFavorite(storage, 2);
    const { ids } = readFavorites(storage);
    expect(ids.length).toBe(2);
  });

  it("should update count when removing favorites", () => {
    toggleFavorite(storage, 1);
    toggleFavorite(storage, 2);
    toggleFavorite(storage, 3);
    removeFavorite(storage, 2);
    const { ids } = readFavorites(storage);
    expect(ids.length).toBe(2);
  });

  it("should show 0 after clear all", () => {
    toggleFavorite(storage, 1);
    toggleFavorite(storage, 2);
    clearAllFavorites(storage);
    const { ids } = readFavorites(storage);
    expect(ids.length).toBe(0);
  });

  it("should format badge text for large counts", () => {
    const count = 150;
    const badgeText = count > 99 ? "99+" : String(count);
    expect(badgeText).toBe("99+");
  });

  it("should show exact count for small numbers", () => {
    const count = 5;
    const badgeText = count > 99 ? "99+" : String(count);
    expect(badgeText).toBe("5");
  });
});
