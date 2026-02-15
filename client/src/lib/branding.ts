/**
 * Centralized branding constants.
 * All logo/favicon/OG image URLs are managed here as defaults.
 * At runtime, these are overridden by DB settings from the admin panel.
 *
 * To change logos:
 * 1. Admin Panel → الإعدادات → الهوية البصرية → upload new logos
 * 2. OR update these defaults for the fallback values
 */

// Main site logo (Navbar + Footer)
export const DEFAULT_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/BEtRgbusNNpRjAtj.png";

// Admin panel logo (sidebar, login page, forgot/reset password)
export const DEFAULT_ADMIN_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331132774/BEtRgbusNNpRjAtj.png";

// Favicon (browser tab icon)
export const DEFAULT_FAVICON = "";

// Open Graph image (social media sharing)
export const DEFAULT_OG_IMAGE = "";

// Company name
export const COMPANY_NAME_AR = "شركة محمد بن عبد الرحمن القاسم العقارية";
export const COMPANY_NAME_EN = "Al-Qasim Real Estate";

/**
 * Settings keys used in the DB for branding.
 * These match the keys stored in the `settings` table.
 */
export const BRANDING_KEYS = {
  LOGO: "logo",
  ADMIN_LOGO: "adminLogo",
  FAVICON: "favicon",
  OG_IMAGE: "ogImage",
} as const;
