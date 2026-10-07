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
  const registryStart = content.indexOf("export const GUIDE_REGISTRY");
  if (registryStart === -1) return [];
  const equalsPos = content.indexOf("=", registryStart);
  if (equalsPos === -1) return [];
  const arrayStart = content.indexOf("[", equalsPos);
  if (arrayStart === -1) return [];

  let depth = 0;
  let arrayEnd = -1;
  for (let i = arrayStart; i < content.length; i++) {
    if (content[i] === "[") depth++;
    else if (content[i] === "]") {
      depth--;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }
  if (arrayEnd === -1) return [];

  const arrayContent = content.slice(arrayStart + 1, arrayEnd);
  const objects = [];
  let objStart = -1;
  let objDepth = 0;

  for (let i = arrayContent.length; i < arrayContent.length; i++) {
    // safety
  }
  for (let i = 0; i < arrayContent.length; i++) {
    const char = arrayContent[i];
    if (char === "{") {
      if (objDepth === 0) objStart = i;
      objDepth++;
    } else if (char === "}") {
      objDepth--;
      if (objDepth === 0 && objStart !== -1) {
        objects.push(arrayContent.slice(objStart, i + 1));
        objStart = -1;
      }
    }
  }

  const entries = [];
  for (const block of objects) {
    const slugMatch = block.match(/slug:\s*"([^"]+)"/);
    const catMatch = block.match(/category:\s*"([^"]+)"/);
    const heroMatch = block.match(/heroImage:\s*"([^"]+)"/);
    const articleImagesMatch = block.match(/articleImages:\s*\[([\s\S]*?)\]/);
    let articleImages = [];
    if (articleImagesMatch) {
      articleImages = [...articleImagesMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    }

    if (slugMatch) {
      entries.push({
        slug: slugMatch[1],
        category: catMatch ? catMatch[1] : undefined,
        heroImage: heroMatch ? heroMatch[1] : undefined,
        filename: heroMatch ? path.basename(heroMatch[1]) : "(no hero image)",
        articleImages,
      });
    }
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
  if (!guide.heroImage) {
    console.log(`| ${guide.slug.padEnd(42)} | ${"(no hero image)".padEnd(36)} | ${"---".padStart(8)} | NO HERO DECLARED |`);
  } else {
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

  if (guide.articleImages && guide.articleImages.length > 0) {
    for (const artImg of guide.articleImages) {
      const artPath = path.join(ROOT_DIR, "public", artImg.replace(/^\//, ""));
      if (fs.existsSync(artPath)) {
        const stat = fs.statSync(artPath);
        if (stat.size / 1024 > MAX_KB) {
          overMaxCount++;
          console.log(`| ${guide.slug.padEnd(42)} | ${path.basename(artImg).padEnd(36)} | ${((stat.size / 1024).toFixed(1) + " KB").padStart(8)} | EXCEEDS 100KB (ART) |`);
        }
      } else {
        missingCount++;
        console.log(`| ${guide.slug.padEnd(42)} | ${path.basename(artImg).padEnd(36)} | ${"---".padStart(8)} | MISSING ARTICLE IMG |`);
      }
    }
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
