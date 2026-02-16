import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Find all img tags without loading attribute
const result = execSync(
  `grep -rln "<img " client/src/ | grep -v node_modules`,
  { cwd: '/home/ubuntu/alqasim-realestate', encoding: 'utf-8' }
).trim().split('\n');

// Files where hero/above-fold images should NOT be lazy loaded
const SKIP_LAZY = new Set([
  'client/src/components/HeroSection.tsx', // Above fold hero image
  'client/src/components/AdminLayout.tsx', // Small logo, always visible
  'client/src/components/Footer.tsx', // Small logo
]);

let totalFixed = 0;

for (const file of result) {
  if (!file) continue;
  const fullPath = `/home/ubuntu/alqasim-realestate/${file}`;
  let content = readFileSync(fullPath, 'utf-8');
  
  // Skip files where we don't want lazy loading
  if (SKIP_LAZY.has(file)) continue;
  
  // Add loading="lazy" to img tags that don't have it
  const before = content;
  content = content.replace(/<img\s+(?![^>]*loading=)/g, '<img loading="lazy" ');
  
  if (content !== before) {
    writeFileSync(fullPath, content);
    const count = (content.match(/loading="lazy"/g) || []).length - (before.match(/loading="lazy"/g) || []).length;
    console.log(`✅ ${file}: added ${count} lazy loading attributes`);
    totalFixed += count;
  }
}

console.log(`\nTotal: ${totalFixed} images now have lazy loading`);
