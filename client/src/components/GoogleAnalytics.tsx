import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

/**
 * Google Analytics integration component.
 * Loads GA4 script dynamically when enabled from admin settings.
 * Tracks page views on route changes.
 */
export default function GoogleAnalytics() {
  const { data: config } = trpc.public.getSiteConfig.useQuery();
  const [location] = useLocation();

  const gaEnabled = config?.settings?.google_analytics_enabled === "true";
  const gaId = config?.settings?.google_analytics_id || "";
  const gtmId = config?.settings?.google_tag_manager_id || "";

  // Load Google Analytics 4 (gtag.js)
  useEffect(() => {
    if (!gaEnabled || !gaId) return;

    // Check if already loaded
    if (document.getElementById("ga-script")) return;

    // Load gtag.js
    const script = document.createElement("script");
    script.id = "ga-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    // Initialize gtag
    const initScript = document.createElement("script");
    initScript.id = "ga-init";
    initScript.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}', {
        page_path: window.location.pathname,
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure'
      });
    `;
    document.head.appendChild(initScript);

    return () => {
      const s1 = document.getElementById("ga-script");
      const s2 = document.getElementById("ga-init");
      if (s1) s1.remove();
      if (s2) s2.remove();
    };
  }, [gaEnabled, gaId]);

  // Load Google Tag Manager
  useEffect(() => {
    if (!gaEnabled || !gtmId) return;

    // Check if already loaded
    if (document.getElementById("gtm-script")) return;

    const script = document.createElement("script");
    script.id = "gtm-script";
    script.textContent = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(script);

    return () => {
      const s = document.getElementById("gtm-script");
      if (s) s.remove();
    };
  }, [gaEnabled, gtmId]);

  // Track page views on route changes
  useEffect(() => {
    if (!gaEnabled || !gaId) return;
    if (typeof (window as any).gtag === "function") {
      (window as any).gtag("config", gaId, {
        page_path: location,
      });
    }
  }, [location, gaEnabled, gaId]);

  return null;
}
