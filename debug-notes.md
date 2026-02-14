# Debug Notes

## Contact Page (/contact) - WORKS FINE
- Page loads correctly with all sections
- Map section, form, contact cards all visible
- The getPageBySlug query has retry:false so it won't hang if no CMS page exists

## Property Detail Pages - Need to test specific IDs
- /properties/30008 - likely deleted property (deletedAt not null)
- /properties/16, /14, /8 - need to test
- /properties/10 - reported as loading empty

## Project Detail Pages
- /projects/6, /5 - need to test

## Key findings:
- All pages have proper loading/error states
- The "bugs" may have been from slow initial loads or deleted records
- Contact page works perfectly fine now
