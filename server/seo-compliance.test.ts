import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("SEO & Saudi Compliance", () => {
  const indexHtml = fs.readFileSync(
    path.join(__dirname, "../client/index.html"),
    "utf-8"
  );

  describe("Meta Tags", () => {
    it("should have a descriptive title tag", () => {
      expect(indexHtml).toContain("<title>");
      expect(indexHtml).toContain("القاسم");
      expect(indexHtml).toContain("Al-Qasim");
    });

    it("should have a meta description", () => {
      expect(indexHtml).toMatch(/meta name="description"/);
    });

    it("should have keywords meta tag with Arabic and English terms", () => {
      expect(indexHtml).toMatch(/meta name="keywords"/);
      expect(indexHtml).toContain("عقارات الرياض");
      expect(indexHtml).toContain("Riyadh real estate");
    });

    it("should have robots meta tag allowing indexing", () => {
      expect(indexHtml).toMatch(/meta name="robots"/);
      expect(indexHtml).toContain("index, follow");
    });

    it("should have geo meta tags for Saudi Arabia", () => {
      expect(indexHtml).toMatch(/meta name="geo.region" content="SA-01"/);
      expect(indexHtml).toMatch(/meta name="geo.placename" content="Riyadh"/);
    });

    it("should have hreflang tags for Arabic and English", () => {
      expect(indexHtml).toMatch(/hreflang="ar"/);
      expect(indexHtml).toMatch(/hreflang="en"/);
      expect(indexHtml).toMatch(/hreflang="x-default"/);
    });
  });

  describe("Open Graph Tags", () => {
    it("should have og:title", () => {
      expect(indexHtml).toMatch(/og:title/);
    });

    it("should have og:description", () => {
      expect(indexHtml).toMatch(/og:description/);
    });

    it("should have og:type website", () => {
      expect(indexHtml).toContain('og:type" content="website"');
    });

    it("should have og:locale for Arabic Saudi", () => {
      expect(indexHtml).toContain('og:locale" content="ar_SA"');
    });

    it("should have og:site_name", () => {
      expect(indexHtml).toMatch(/og:site_name/);
    });
  });

  describe("Twitter Card Tags", () => {
    it("should have twitter:card", () => {
      expect(indexHtml).toMatch(/twitter:card/);
    });

    it("should have twitter:title", () => {
      expect(indexHtml).toMatch(/twitter:title/);
    });
  });

  describe("Structured Data (JSON-LD)", () => {
    it("should have JSON-LD script tag", () => {
      expect(indexHtml).toContain('type="application/ld+json"');
    });

    it("should have RealEstateAgent schema type", () => {
      expect(indexHtml).toContain('"@type": "RealEstateAgent"');
    });

    it("should have Saudi address in structured data", () => {
      expect(indexHtml).toContain('"addressCountry": "SA"');
      expect(indexHtml).toContain("الرياض");
    });

    it("should have social media links in sameAs", () => {
      expect(indexHtml).toContain('"sameAs"');
      expect(indexHtml).toContain("instagram.com");
    });

    it("should have opening hours specification", () => {
      expect(indexHtml).toContain('"openingHoursSpecification"');
    });
  });

  describe("robots.txt", () => {
    const robotsTxt = fs.readFileSync(
      path.join(__dirname, "../client/public/robots.txt"),
      "utf-8"
    );

    it("should allow general crawling", () => {
      expect(robotsTxt).toContain("Allow: /");
    });

    it("should disallow admin and API paths", () => {
      expect(robotsTxt).toContain("Disallow: /admin/");
      expect(robotsTxt).toContain("Disallow: /api/");
    });

    it("should reference sitemap", () => {
      expect(robotsTxt).toMatch(/Sitemap:/);
      expect(robotsTxt).toContain("sitemap.xml");
    });
  });

  describe("Cookie Consent Component", () => {
    const cookieConsentFile = fs.readFileSync(
      path.join(__dirname, "../client/src/components/CookieConsent.tsx"),
      "utf-8"
    );

    it("should exist as a component file", () => {
      expect(cookieConsentFile).toBeTruthy();
    });

    it("should have Arabic and English text", () => {
      expect(cookieConsentFile).toContain("سياسة ملفات تعريف الارتباط");
      expect(cookieConsentFile).toContain("Cookie Policy");
    });

    it("should have accept and essential-only options", () => {
      expect(cookieConsentFile).toContain("موافق");
      expect(cookieConsentFile).toContain("الضرورية فقط");
    });

    it("should link to privacy policy", () => {
      expect(cookieConsentFile).toContain("/privacy-policy");
    });

    it("should use localStorage to persist consent", () => {
      expect(cookieConsentFile).toContain("localStorage");
    });
  });

  describe("SEO Component", () => {
    const seoFile = fs.readFileSync(
      path.join(__dirname, "../client/src/components/SEO.tsx"),
      "utf-8"
    );

    it("should exist as a component file", () => {
      expect(seoFile).toBeTruthy();
    });

    it("should use react-helmet-async", () => {
      expect(seoFile).toContain("react-helmet-async");
    });

    it("should support title and description props", () => {
      expect(seoFile).toContain("title");
      expect(seoFile).toContain("description");
    });
  });

  describe("Privacy Policy Page", () => {
    const privacyPage = fs.readFileSync(
      path.join(__dirname, "../client/src/pages/PrivacyPolicy.tsx"),
      "utf-8"
    );

    it("should exist", () => {
      expect(privacyPage).toBeTruthy();
    });

    it("should reference Saudi PDPL", () => {
      // Check for reference to Saudi data protection
      expect(privacyPage).toMatch(/نظام حماية البيانات الشخصية|PDPL|الهيئة السعودية/i);
    });
  });

  describe("FAL Number in Footer", () => {
    const footerFile = fs.readFileSync(
      path.join(__dirname, "../client/src/components/Footer.tsx"),
      "utf-8"
    );

    it("should read FAL number from settings", () => {
      expect(footerFile).toContain("fal_number");
    });

    it("should display FAL license badge when available", () => {
      expect(footerFile).toContain("رخصة فال");
      expect(footerFile).toContain("Fal License");
    });

    it("should reference REGA licensing", () => {
      expect(footerFile).toContain("الهيئة العامة للعقار");
      expect(footerFile).toContain("Licensed by REGA");
    });
  });

  describe("IqarLicense Page Dynamic Values", () => {
    const iqarPage = fs.readFileSync(
      path.join(__dirname, "../client/src/pages/IqarLicense.tsx"),
      "utf-8"
    );

    it("should use dynamic FAL number from settings", () => {
      expect(iqarPage).toContain("falNumber");
      expect(iqarPage).toContain("useSiteConfig");
    });

    it("should use dynamic CR number from settings", () => {
      expect(iqarPage).toContain("crNumber");
    });

    it("should not have hardcoded placeholder numbers", () => {
      expect(iqarPage).not.toContain("1010XXXXXX");
      expect(iqarPage).not.toMatch(/XXXXXXXXXX/);
    });
  });

  describe("Admin Settings Company Tab", () => {
    const settingsFile = fs.readFileSync(
      path.join(__dirname, "../client/src/pages/admin/Settings.tsx"),
      "utf-8"
    );

    it("should have company tab trigger", () => {
      expect(settingsFile).toContain('value="company"');
    });

    it("should have FAL number input field", () => {
      expect(settingsFile).toContain("fal_number");
      expect(settingsFile).toContain("رقم رخصة فال");
    });

    it("should have CR number input field", () => {
      expect(settingsFile).toContain("cr_number");
      expect(settingsFile).toContain("رقم السجل التجاري");
    });

    it("should have company name fields in Arabic and English", () => {
      expect(settingsFile).toContain("company_name");
      expect(settingsFile).toContain("company_name_en");
    });

    it("should save company settings as a group", () => {
      expect(settingsFile).toContain('group: "company"');
    });
  });
});
