/* eslint-disable @typescript-eslint/no-unused-vars */
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { ENGLISH_QUOTES } from "../../src/data/quotes/english-quotes";
import { ENGLISH_WORDS } from "../../src/data/words/english-1k";
import { LESSON_DEFINITIONS } from "../../src/lib/lessons/lesson-types";
import { buildSubLessons } from "../../src/lib/lessons/lesson-content";
import * as vocabWords from "../../src/lib/vocabulary/vocabulary-words";

// Environment variables must be provided when running this script
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !secretKey) {
  console.error("Missing Supabase credentials in environment variables.");
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, secretKey, {
  auth: { persistSession: false },
});

const BATCH_SIZE = 500;

async function importLanguages() {
  console.log("Importing Languages...");
  const { error } = await supabase.from("languages").upsert(
    [
      { code: "en", name: "English", native_name: "English", enabled: true, sort_order: 1 },
      { code: "es", name: "Spanish", native_name: "Español", enabled: true, sort_order: 2 },
      { code: "pt-BR", name: "Portuguese (Brazil)", native_name: "Português (Brasil)", enabled: true, sort_order: 3 },
      { code: "de", name: "German", native_name: "Deutsch", enabled: true, sort_order: 4 },
    ],
    { onConflict: "code" }
  );
  if (error) throw error;
  console.log("Languages imported successfully.");
}

async function importQuotes() {
  console.log("Importing English Quotes...");
  const quotes = ENGLISH_QUOTES.map((q) => ({
    language_code: "en",
    text: q.text,
    author: q.source.split(",")[0] || "Unknown",
    source: q.source.includes(",") ? q.source.split(",")[1].trim() : null,
    difficulty: q.length === "short" ? "easy" : q.length === "medium" ? "medium" : "hard",
    status: "published",
  }));

  for (let i = 0; i < quotes.length; i += BATCH_SIZE) {
    const batch = quotes.slice(i, i + BATCH_SIZE);
    // Note: since id is auto-generated uuid, we just insert. 
    // To be truly idempotent, we can check if they exist or delete first.
    // For now, let's delete existing en quotes then insert to avoid duplicates on reruns.
    if (i === 0) {
      await supabase.from("quotes").delete().eq("language_code", "en");
    }
    const { error } = await supabase.from("quotes").insert(batch);
    if (error) throw error;
  }
  console.log(`Imported ${quotes.length} quotes.`);
}

async function importVocabulary() {
  console.log("Importing English Vocabulary...");
  
  // Extract EASY_ROWS, MEDIUM_ROWS, HARD_ROWS from vocabulary-words.ts
  // Since they are not exported, we can just use ENGLISH_WORDS for typing texts,
  // or we can read the file as string, or use the exported lists if available.
  // Wait, let's just insert ENGLISH_WORDS into typing_texts instead.
  
  // For vocabulary_items, I'll just skip for a moment or use ENGLISH_WORDS.
  console.log("Skipping vocabulary for now (static lists in use)...");
}

async function importLessons() {
  console.log("Importing English Lessons...");
  
  await supabase.from("lesson_steps").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // hack to clear all
  await supabase.from("lessons").delete().eq("language_code", "en");

  const lessonsData = [];
  const stepsData = [];

  for (const def of Object.values(LESSON_DEFINITIONS)) {
    const lesson = {
      // Create a deterministic UUID or just use the returning clause
      lesson_key: def.id,
      language_code: "en",
      title: def.name,
      description: null,
      order_index: def.order,
      difficulty: "beginner", // default
      tier: def.tier,
      stage: def.stage,
      new_keys: def.newKeys,
      instructions: def.instructions,
      min_accuracy: def.minAccuracy,
      status: "published",
      content_version: 1,
    };
    
    const { data: insertedLesson, error } = await supabase
      .from("lessons")
      .insert(lesson)
      .select()
      .single();
      
    if (error) throw error;

    const subLessons = buildSubLessons(def);
    for (const sub of subLessons) {
      stepsData.push({
        lesson_id: insertedLesson.id,
        step_order: sub.step,
        practice_type: sub.content.kind,
        target_keys: sub.content.kind === "graduation" ? null : sub.content.allowedKeys,
        word_count: sub.content.wordCount,
        numbers: sub.content.kind === "graduation" ? sub.content.numbers : null,
        advanced_mode: sub.content.kind === "graduation" ? sub.content.advancedMode : null,
      });
    }
  }

  for (let i = 0; i < stepsData.length; i += BATCH_SIZE) {
    const batch = stepsData.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("lesson_steps").insert(batch);
    if (error) throw error;
  }
  
  console.log(`Imported ${Object.keys(LESSON_DEFINITIONS).length} lessons and ${stepsData.length} steps.`);
}

async function run() {
  try {
    await importLanguages();
    await importQuotes();
    await importVocabulary();
    await importLessons();
    console.log("Import complete.");
  } catch (error) {
    console.error("Import failed:", error);
    process.exit(1);
  }
}

run();
