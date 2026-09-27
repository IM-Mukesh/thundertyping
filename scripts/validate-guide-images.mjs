#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const GUIDES_DIR = path.resolve(ROOT_DIR, "public", "guides");
const REGISTRY_FILE = path.resolve(ROOT_DIR, "src", "lib", "guides", "guide-registry.ts");
const MAX_KB = 100;

function parseGuideRegistry(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const entries = [];
  const matches = [
    ...content.matchAll(
      /slug:\s*"([^"]+)",[\s\S]*?category:\s*"([^"]+)",[\s\S]*?heroImage:\s*"([^"]+)"/g
    ),
  ];

  for (const m of matches) {
    entries.push({
      slug: m[1],
      category: m[2],
      heroImage: m[3],
      filename: path.basename(m[3]),
    });
  }
  return entries;
}

function getAllDiskFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of list) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(getAllDiskFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

console.log(`\n======================================================`);
console.log(`HeroTyping Guide Image Asset Validation`);
console.log(`======================================================\n`);

// 1. Check for flat images directly in public/guides/
const flatEntries = fs.readdirSync(GUIDES_DIR, { withFileTypes: true });
const flatFiles = flatEntries.filter((e) => e.isFile());

if (flatFiles.length > 0) {
  console.error(`FAIL: Flat image files detected directly in public/guides/:`);
  for (const f of flatFiles) {
    console.error(`  - public/guides/${f.name}`);
  }
} else {
  console.log(`✓ Directory Hierarchy: No flat image files directly in public/guides/ root.`);
}

// 2. Validate all guides declared in registry
const registeredGuides = parseGuideRegistry(REGISTRY_FILE);
console.log(`\nEvaluating ${registeredGuides.length} Guide Visual Assets from guide-registry.ts:\n`);

console.log(
  `| ${"Article Slug".padEnd(42)} | ${"Image Filename".padEnd(36)} | ${"Size".padStart(8)} | Status |`
);
console.log(`|${"-".repeat(44)}|${"-".repeat(38)}|${"-".repeat(10)}|--------|`);

let readyCount = 0;
let missingCount = 0;
let overMaxCount = 0;

for (const guide of registeredGuides) {
  const fullPath = path.join(ROOT_DIR, "public", guide.heroImage.replace(/^\//, ""));

  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    const kb = (stat.size / 1024).toFixed(1);
    if (stat.size / 1024 > MAX_KB) {
      overMaxCount++;
      console.log(`| ${guide.slug.padEnd(42)} | ${guide.filename.padEnd(36)} | ${(kb + " KB").padStart(8)} | EXCEEDS 100KB |`);
    } else {
      readyCount++;
      console.log(`| ${guide.slug.padEnd(42)} | ${guide.filename.padEnd(36)} | ${(kb + " KB").padStart(8)} | READY |`);
    }
  } else {
    missingCount++;
    console.log(`| ${guide.slug.padEnd(42)} | ${guide.filename.padEnd(36)} | ${"---".padStart(8)} | MISSING ON DISK |`);
  }
}

// 3. Scan existing files on disk for size ceilings
const allDiskFiles = getAllDiskFiles(GUIDES_DIR);
console.log(`\nExisting Files on Disk Audit:`);
console.log(`Total guide visual files on disk: ${allDiskFiles.length}`);

let totalKb = 0;
for (const f of allDiskFiles) {
  const s = fs.statSync(f);
  totalKb += s.size / 1024;
}
console.log(`Total disk footprint: ${totalKb.toFixed(1)} KB`);
console.log(`Average file size: ${(totalKb / (allDiskFiles.length || 1)).toFixed(1)} KB`);

console.log(`\nValidation Summary:`);
console.log(`- Ready / On Disk: ${readyCount}`);
console.log(`- Missing on Disk: ${missingCount}`);
console.log(`- Over Size Limit (>100 KB): ${overMaxCount}`);
console.log(`- Flat Root Violations: ${flatFiles.length}`);

if (flatFiles.length > 0 || overMaxCount > 0 || missingCount > 0) {
  console.error(`\nValidation finished with errors.\n`);
  process.exit(1);
} else {
  console.log(`\nValidation successful. Image asset system strictly aligned.\n`);
  process.exit(0);
}
