#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const GUIDES_DIR = path.resolve(process.cwd(), "public", "guides");
const TARGET_KB = 80;
const MAX_KB = 100;
const MAX_WIDTH = 1600;

function getAllImageFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of list) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(getAllImageFiles(fullPath));
    } else if (/\.(png|jpe?g|webp)$/i.test(file.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function optimizeImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const initialStat = fs.statSync(filePath);
  const initialKb = (initialStat.size / 1024).toFixed(1);

  let targetPath = filePath;
  if (ext !== ".webp") {
    targetPath = filePath.replace(/\.[^.]+$/, ".webp");
  }

  // Try standard quality 82 first
  const tmpPath = targetPath + ".tmp.webp";
  try {
    execSync(
      `convert "${filePath}" -resize "${MAX_WIDTH}x>" -quality 82 -define webp:method=6 "${tmpPath}"`,
      { stdio: "pipe" }
    );
    let newStat = fs.statSync(tmpPath);
    let newKb = newStat.size / 1024;

    // If still over target, try quality 76
    if (newKb > TARGET_KB) {
      execSync(
        `convert "${filePath}" -resize "${MAX_WIDTH}x>" -quality 76 -define webp:method=6 "${tmpPath}"`,
        { stdio: "pipe" }
      );
      newStat = fs.statSync(tmpPath);
      newKb = newStat.size / 1024;
    }

    // Replace original
    if (targetPath !== filePath) {
      fs.unlinkSync(filePath);
    }
    fs.renameSync(tmpPath, targetPath);

    const finalKb = (newStat.size / 1024).toFixed(1);
    const savings = ((1 - newStat.size / initialStat.size) * 100).toFixed(0);

    return {
      file: path.relative(GUIDES_DIR, targetPath),
      initialKb,
      finalKb,
      savings: `${savings}%`,
      overTarget: newKb > TARGET_KB,
      overMax: newKb > MAX_KB,
    };
  } catch (err) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    return {
      file: path.relative(GUIDES_DIR, filePath),
      error: err.message,
    };
  }
}

console.log(`\n========================================`);
console.log(`HeroTyping Guide Image Optimizer`);
console.log(`Scanning: ${GUIDES_DIR}`);
console.log(`Targets: <${TARGET_KB} KB preferred, max ${MAX_KB} KB`);
console.log(`========================================\n`);

if (!fs.existsSync(GUIDES_DIR)) {
  console.error(`Guides directory does not exist: ${GUIDES_DIR}`);
  process.exit(1);
}

const images = getAllImageFiles(GUIDES_DIR);
if (images.length === 0) {
  console.log("No images found in public/guides/ to optimize.\n");
  process.exit(0);
}

const results = [];
for (const img of images) {
  results.push(optimizeImage(img));
}

console.log(
  `| ${"File".padEnd(55)} | ${"Initial".padStart(8)} | ${"Optimized".padStart(10)} | ${"Saved".padStart(6)} | Status |`
);
console.log(`|${"-".repeat(57)}|${"-".repeat(10)}|${"-".repeat(12)}|${"-".repeat(8)}|--------|`);

let overMaxCount = 0;
for (const r of results) {
  if (r.error) {
    console.log(`| ${r.file.padEnd(55)} | ERROR: ${r.error} |`);
    continue;
  }
  const status = r.overMax ? "EXCEEDS 100KB" : r.overTarget ? "Warning >80KB" : "Optimal";
  if (r.overMax) overMaxCount++;
  console.log(
    `| ${r.file.padEnd(55)} | ${(r.initialKb + " KB").padStart(8)} | ${(r.finalKb + " KB").padStart(10)} | ${r.savings.padStart(6)} | ${status} |`
  );
}

console.log(`\nOptimization Complete. Total images processed: ${results.length}.`);
if (overMaxCount > 0) {
  console.warn(`WARNING: ${overMaxCount} image(s) exceed the 100 KB ceiling.`);
} else {
  console.log(`All images within target specifications (<100 KB).\n`);
}
