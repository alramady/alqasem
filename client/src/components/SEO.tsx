import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

interface SEOProps {
  titleAr?: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  image?: string;
  url?: string;
  type?: string;
  noindex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const SITE_NAME_AR = "شركة القاسم العقارية";
const SITE_NAME_EN = "Al-Qasim Real Estate";
const DEFAULT_DESC_AR = "شركة القاسم العقارية - التسويق العقاري بطريقة عصرية. إيجارات، بيع وشراء شقق وفلل، إدارة أملاك، استثمار عقاري في الرياض والمملكة العربية السعودية.";
const DEFAULT_DESC_EN = "Al-Qasim Real Estate - Modern real estate marketing. Rentals, buying and selling apartments and villas, property management, and real estate investment in Riyadh, Saudi Arabia.";

export default function SEO({
  titleAr,
  titleEn,
  descriptionAr,
  descriptionEn,
  image,
  url,
  type = "website",
  noindex = false,
  jsonLd,
}: SEOProps) {
  const { isAr } = useLanguage();
  const { settings } = useSiteConfig();

  const ogImage = image || settings.ogImage || settings.hero_image || "";
  const currentUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  const title = isAr
    ? titleAr ? `${titleAr} | ${SITE_NAME_AR}` : `${SITE_NAME_AR} | شركة محمد بن عبد الرحمن القاسم العقارية`
    : titleEn ? `${titleEn} | ${SITE_NAME_EN}` : `${SITE_NAME_EN} | Mohammed bin Abdulrahman Al-Qasim Real Estate`;

  const description = isAr
    ? descriptionAr || DEFAULT_DESC_AR
    : descriptionEn || DEFAULT_DESC_EN;

  const jsonLdArray = jsonLd
    ? Array.isArray(jsonLd) ? jsonLd : [jsonLd]
    : [];

  // Always include Organization schema
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": isAr ? "شركة محمد بن عبد الرحمن القاسم العقارية" : "Mohammed bin Abdulrahman Al-Qasim Real Estate",
    "alternateName": isAr ? "القاسم العقارية" : "Al-Qasim Real Estate",
    "url": typeof window !== "undefined" ? window.location.origin : "",
    "logo": settings.logo || "",
    "telephone": settings.phone || "920001911",
    "email": settings.email || "info@alqasem.com.sa",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": isAr ? "الرياض" : "Riyadh",
      "addressCountry": "SA",
      "streetAddress": settings.address || "",
    },
    "sameAs": [
      settings.instagram,
      settings.twitter,
      settings.tiktok,
      settings.linkedin,
      settings.snapchat,
    ].filter(Boolean),
    "areaServed": {
      "@type": "Country",
      "name": isAr ? "المملكة العربية السعودية" : "Saudi Arabia",
    },
  };

  return (
    <Helmet>
      <html lang={isAr ? "ar" : "en"} dir={isAr ? "rtl" : "ltr"} />
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:locale" content={isAr ? "ar_SA" : "en_US"} />
      <meta property="og:locale:alternate" content={isAr ? "en_US" : "ar_SA"} />
      <meta property="og:site_name" content={isAr ? SITE_NAME_AR : SITE_NAME_EN} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Canonical */}
      <link rel="canonical" href={currentUrl} />

      {/* Keywords */}
      <meta name="keywords" content={isAr
        ? "عقارات الرياض, شقق للبيع, فلل للبيع, أراضي للبيع, إيجار شقق, القاسم العقارية, عقارات السعودية, استثمار عقاري, إدارة أملاك, تسويق عقاري, وساطة عقارية, رخصة فال"
        : "Riyadh real estate, apartments for sale, villas for sale, land for sale, rental apartments, Al-Qasim Real Estate, Saudi real estate, property investment, property management, real estate marketing, real estate brokerage, Fal license"
      } />

      {/* Geo Tags */}
      <meta name="geo.region" content="SA-01" />
      <meta name="geo.placename" content={isAr ? "الرياض" : "Riyadh"} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(orgSchema)}
      </script>
      {jsonLdArray.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

/** Generate JSON-LD for a property listing */
export function propertyJsonLd(property: any, isAr: boolean) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": isAr ? property.title : (property.titleEn || property.title),
    "description": isAr ? property.description : (property.descriptionEn || property.description),
    "url": typeof window !== "undefined" ? `${window.location.origin}/properties/${property.id}` : "",
    "image": property.images?.[0] || "",
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": "SAR",
      "availability": "https://schema.org/InStock",
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": isAr ? property.city : (property.cityEn || property.city),
      "addressRegion": isAr ? property.district : (property.districtEn || property.district),
      "addressCountry": "SA",
    },
    ...(property.latitude && property.longitude ? {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": property.latitude,
        "longitude": property.longitude,
      }
    } : {}),
    "numberOfRooms": property.rooms,
    "floorSize": {
      "@type": "QuantitativeValue",
      "value": property.area,
      "unitCode": "MTK",
    },
  };
}

/** Generate BreadcrumbList JSON-LD */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url,
    })),
  };
}
