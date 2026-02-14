import { createContext, useContext, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface HomepageSection {
  id: number;
  sectionKey: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  isVisible: boolean | null;
  displayOrder: number | null;
}

interface SiteConfig {
  settings: Record<string, string>;
  sections: HomepageSection[];
  loading: boolean;
}

const defaultConfig: SiteConfig = {
  settings: {},
  sections: [],
  loading: true,
};

const SiteConfigContext = createContext<SiteConfig>(defaultConfig);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = trpc.public.getSiteConfig.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const value: SiteConfig = {
    settings: data?.settings || {},
    sections: data?.sections || [],
    loading: isLoading,
  };

  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

/** Get a specific setting value with optional fallback */
export function useSetting(key: string, fallback = ""): string {
  const { settings } = useSiteConfig();
  return settings[key] || fallback;
}

/** Get a specific homepage section by key */
export function useSection(sectionKey: string): HomepageSection | undefined {
  const { sections } = useSiteConfig();
  return sections.find((s) => s.sectionKey === sectionKey);
}

/** Check if a section is visible (defaults to true if not found) */
export function useSectionVisible(sectionKey: string): boolean {
  const section = useSection(sectionKey);
  if (!section) return true;
  return section.isVisible !== false;
}
