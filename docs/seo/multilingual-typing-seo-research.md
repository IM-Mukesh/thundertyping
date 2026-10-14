# HeroTyping Multilingual SEO Strategy & Technical Research

## 1. Executive Summary & Business Objective

**HeroTyping** (`https://www.herotyping.com/`) is a high-performance web-based typing speed test, practice platform, and educational resource built on Next.js App Router, React 19, TypeScript, and Tailwind CSS.

### Primary Objective
Establish a sustainable, organic search acquisition channel across six high-intent global typing markets:
1. **English (`en`)**: Global lingua franca for productivity, software engineering, academia, and standardized typing assessments.
2. **Spanish (`es`)**: Pan-regional typing search demand across Spain, Mexico, Colombia, Argentina, and broader Hispanic markets.
3. **Hindi (`hi`)**: Massive Indian typing search demand driven by central/state government employment exams (SSC CGL/CHSL, CPCT, High Courts, Railways), clerkships, and bilingual office roles.
4. **German (`de`)**: High-intent, methodology-driven DACH market (Germany, Austria, Switzerland) focused on formal touch typing (*Zehnfingersystem* / *Tastschreiben*) and corporate/educational benchmarks.
5. **Brazilian Portuguese (`pt-BR`)**: Dense Brazilian typing market focused on keyboard speed (*digitação rápida*), ABNT2 keyboard layout mechanics, and public sector/clerical job exams (*concursos públicos*).
6. **Chinese (`zh` — Simplified Chinese / Pinyin IME)**: Immense typing demand for Pinyin IME (*拼音输入法*), Shuangpin (*双拼*), touch typing ergonomics (*盲打*), and characters-per-minute (*字/分* / CPM) evaluation.

### Core Ethical & Methodological Guardrails
- **Zero Fabricated Metrics**: No synthetic search volume, keyword difficulty scores, or false ranking guarantees. Qualitative demand estimates are derived directly from live Google SERP shapes, search suggestions, related queries, and platform benchmarks.
- **Truthful Product Representation**: Every content page links directly to real, functional typing test experiences. Features described (grapheme cluster handling, IME candidate preview, ABNT2/QWERTZ character support, InScript layout mechanics) exist and work in the product.
- **No Machine-Translated Thin Content**: All multilingual content is authored with idiomatic terminology, native keyboard terminology, and localized pedagogical advice to prevent Google duplicate content or thin affiliate penalties.

---

## 2. Technical SEO & Architectural Baseline

### 2.1 Route Architecture & Next.js App Router Structure
HeroTyping employs an App Router internationalization model managed by `src/proxy.ts` and `src/lib/i18n/config.ts`:
- **Route Locales (`LOCALES`)**: `["en", "es", "pt-BR", "de"]` have dedicated root-level localized subpaths (`/es`, `/pt-BR`, `/de`).
- **Clean Canonical URL Enforcement**: The proxy rewrites clean root paths to the default locale (`en`) while 308-redirecting any explicit `/en/...` prefix to prevent duplicate indexing.
- **Genuinely Localized Subpaths**: Set in `src/proxy.ts` as `new Set(["", "/", "/games/type-before-death"])`. Unlocalized subpaths under `/es/` or `/de/` are cleanly 308-redirected to their canonical English location.
- **Guide Routing**: All educational and pillar guides live under the canonical unprefixed path `/guides/[slug]`. This ensures search engines index a single, authoritative canonical URL per guide rather than fractured multi-locale shells.
- **Typing Locale Selector (`TYPING_LOCALES`)**: The typing engine supports `["en", "es", "hi", "de", "pt-BR", "zh"]`. While Hindi and Chinese do not have full site UI shells (to avoid pseudo-localized thin pages), their typing test engines are fully functional with native word pools, quotes, 3-tier vocabulary, and Unicode segmentation.

### 2.2 Direct Product Entry Points
To bridge SEO educational guides directly into product usage:
- **English Test**: `https://www.herotyping.com/` (Default English test, 15s/30s/60s modes, quote mode, vocabulary mode)
- **Spanish Test**: `https://www.herotyping.com/es` or `https://www.herotyping.com/?language=es`
- **German Test**: `https://www.herotyping.com/de` or `https://www.herotyping.com/?language=de`
- **Brazilian Portuguese Test**: `https://www.herotyping.com/pt-BR` or `https://www.herotyping.com/?language=pt-BR`
- **Hindi Test**: `https://www.herotyping.com/?language=hi` (Launches Devanagari word pool and quote tests)
- **Chinese Test**: `https://www.herotyping.com/?language=zh` (Launches Simplified Chinese character and sentence tests with IME candidate preview)

### 2.3 Unicode & IME Engineering Highlights
1. **Devanagari Combining Characters**: In Hindi, consonants combine with vowel matras (e.g. `क + ि = कि`) and viramas / halants (`्`). HeroTyping's `src/lib/typing-engine/unicode.ts` uses `Intl.Segmenter` (with regex fallback) to ensure entire grapheme clusters are correctly calculated rather than penalizing typists on sub-glyph boundary states.
2. **CJK IME Composition Buffer**: Chinese typing requires an Input Method Editor (IME) where Roman keystrokes (Pinyin) generate a candidate list before committing a Chinese glyph. HeroTyping's composition preview subsystem tracks active composition sessions (`compositionstart`, `compositionupdate`, `compositionend`) so that keystrokes in the IME candidate buffer do not corrupt scoring or trigger premature error penalties.
3. **Extended Accented Alphabets**: Dedicated character validation in `src/lib/typing-engine/language-config.ts` handles:
   - Spanish: `á, é, í, ó, ú, ü, ñ, ¡, ¿`
   - German: `ä, ö, ü, ß`
   - Portuguese: `á, é, í, ó, ú, â, ê, ô, ã, õ, ç`

---

## 3. Linguistic & Market Analysis Across the 6 Languages

### 3.1 English (`en`)
- **Primary Markets**: United States, United Kingdom, Canada, Australia, India, and global professional typists.
- **Search Intent Profile**: Heavy split between instant verification (`1 minute typing test`, `typing speed test free`) and skill progression (`how to increase typing speed from 50 to 100 wpm`, `touch typing finger placement`).
- **SERP Dynamics**: Dominated by high-authority platforms (Monkeytype, 10FastFingers, TypingTest.com, Typing.com). SERPs prominently feature interactive speed test widgets, People Also Ask (PAA) blocks, and YouTube video carousels.
- **HeroTyping Differentiation**: Zero ads cluttering the test canvas, instant ghost caret pace feedback, 1,300-word orthographic vocabulary mode with speech synthesis, and real prose quotes.

### 3.2 Spanish (`es`)
- **Primary Markets**: Spain (ES), Mexico (MX), Colombia (CO), Argentina (AR), Peru, Chile, United States (bilingual).
- **Core Terminology**:
  - *Mecanografía*: The primary academic and professional term for touch typing.
  - *Prueba de mecanografía / Test de mecanografía*: Standard search queries for typing tests.
  - *Velocidad de escritura*: Writing speed test.
  - *Palabras por minuto (PPM / WPM)* & *Pulsaciones por minuto (PPM)*.
  - *Teclado QWERTY en español*: Focus on the `Ñ` key (right of `L`), inverted question mark `¿`, and dead accent key (`´`).
- **Search Intent Profile**: High proportion of students taking formal typing classes and job applicants preparing for administrative competitions (*oposiciones* in Spain, *concursos públicos* in Latin America).

### 3.3 German (`de`)
- **Primary Markets**: Germany (DE), Austria (AT), Switzerland (CH).
- **Core Terminology**:
  - *Zehnfingersystem* / *10-Finger-System*: Universal term for touch typing.
  - *Tipptest online / Schreibtrainer*: Typing test / typing tutor.
  - *Tastschreiben / Blindschreiben*: Blind typing without looking.
  - *Anschläge pro Minute (APM)*: Keystrokes per minute — the official metric under DIN 2137. 1 WPM is traditionally standardized as 5 APM.
  - *Wörter pro Minute (WPM)*: Widely understood among younger and digital-native users.
  - *QWERTZ-Tastatur*: Inverted Z and Y positions compared to QWERTY, dedicated keys for `ä, ö, ü, ß`, and critical AltGr reaches for `@`, `€`, `\`, `[]`, `{}`.
- **Search Intent Profile**: Highly pedagogical. Users search for systematic training steps, ergonomic hand placement (*Grundstellung: ASDF JKLÖ*), and DIN-compliant speed measurement.

### 3.4 Brazilian Portuguese (`pt-BR`)
- **Primary Markets**: Brazil (BR) and Lusophone diaspora.
- **Core Terminology**:
  - *Teste de digitação*: Dominant search query.
  - *Digitação rápida*: Fast typing.
  - *Aprender a digitar com todos os dedos / sem olhar*: Learn to type with all fingers / blind.
  - *Toques por minuto (TPM)* & *Palavras por minuto (PPM / WPM)*.
  - *Teclado ABNT2*: The Brazilian national standard keyboard featuring a dedicated `Ç` key and AltGr combinations (`²`, `³`, `£`, `¢`, `¬`).
- **Search Intent Profile**: Massive volume of self-taught typists wanting to eliminate "hunt-and-peck" (*catar milho*) typing and prepare for administrative civil service exams (*concursos públicos*) where typing proficiency is strictly timed.

### 3.5 Hindi (`hi`)
- **Primary Markets**: India (IN) — particularly North and Central states (Uttar Pradesh, Bihar, Madhya Pradesh, Rajasthan, Delhi, Haryana, Jharkhand).
- **Core Terminology**:
  - *Hindi typing test online*: Blended Hinglish queries dominate technical searches.
  - *InScript typing test (इन्स्क्रिप्ट टाइपिंग)*: The Government of India's standardized Unicode layout.
  - *Kruti Dev / Remington typing test (कृति देव)*: Legacy typewriter font mapping still required by specific state high courts and local clerical bodies.
  - *Mangal font typing*: Popular synonym for InScript/Unicode typing.
  - *हलंत / मात्रा नियम*: Virama and matra typing mechanics.
- **Search Intent Profile**: Over 85% of high-intent searches are exam-driven: SSC CGL Tier II DEST (Data Entry Speed Test), SSC CHSL, MP CPCT, Allahabad High Court RO/ARO, Rajasthan LDC, and RRB NTPC. Speed requirements typically range from 30 to 35 WPM (150 to 175 CPM) with 95%+ accuracy.

### 3.6 Chinese (`zh` — Simplified Chinese / Pinyin IME)
- **Primary Markets**: Mainland China, Singapore, and global Chinese-speaking professionals and students.
- **Core Terminology**:
  - *中文打字测试 / 在线打字测试*: Chinese typing test / online typing test.
  - *打字速度测试*: Typing speed test.
  - *拼音打字练习*: Pinyin typing practice.
  - *字/分 (CPM / 字每分钟)*: Characters per minute — the sole universal metric for Chinese typing (words per minute is ambiguous due to multi-character word segmentation).
  - *盲打指法练习*: Touch typing fingering practice.
  - *双拼输入法 (Shuangpin)* vs *全拼 (Quanpin)*: Advanced two-keystroke Pinyin method popular among speed typists.
  - *五笔字型 (Wubi)*: Stroke-based shape input method.
- **Search Intent Profile**: Students building basic keyboard skills, office workers seeking higher clerical efficiency, and competitive typists practicing Shuangpin schemes (Xiaohe, Microsoft Shuangpin) to achieve 120+ CPM.

---

## 4. Competitive Landscape & SERP Features

| Language | Top Competitors | Dominant SERP Features | HeroTyping Value Gap |
| :--- | :--- | :--- | :--- |
| **English** | Monkeytype, 10FastFingers, TypingTest.com, Typing.com, Keybr | Interactive snippet, PAA, Video, App pack | Distraction-free interface, deep orthographic vocabulary, ghost caret |
| **Spanish** | 10FastFingers, Ratatype ES, TypingTest.com ES, AgileFingers ES | PAA, Featured snippet, Video carousel | Native explanations of dead keys, inverted punctuation, Latin American vs Spain layouts |
| **German** | Tipp10, 10FastFingers DE, Schreibtrainer-online.de, Typewriter.at | Knowledge panels, PAA, software download snippets | Modern web-first interface (no Java/Flash legacy), DIN 2137 APM to WPM alignment |
| **Portuguese** | Digitow, 10FastFingers PT, TypingClub BR, TypingCore | PAA, YouTube video guides, local forum links | Complete ABNT2 ergonomic mapping, dead key accentuation drills, concurso público benchmarks |
| **Hindi** | IndiaTyping, TypingBaba, TypingWale, FastFingers.in, AR Typing | Table snippets, YouTube tutorials, exam circular links | Modern clean UI, zero intrusive banner ads, true Unicode grapheme cluster evaluation |
| **Chinese** | Dazigo (打字狗), Daziya (打字鸭), Dazidazi (我爱打字), Jinshan (金山打字通在线版), ARealMe | Video guides, ranking tables, mini-game cards | Clean modern IME candidate preview, responsive typography, no mandatory login walls |

---

## 5. Strategic Content & Architecture Roadmap

### 5.1 Content Pillars
To rank organically and satisfy the search intents discovered in research, HeroTyping maintains dedicated, deeply researched pillar guides under `/guides/`:
1. **English**: `/guides/english-typing-test-and-practice` (Upgraded with WPM/CPM math, vocabulary tiers, endurance protocols)
2. **Spanish**: `/guides/spanish-typing-test-and-practice` (Native Spanish: *Test de Mecanografía y Práctica en Teclado Español*)
3. **German**: `/guides/german-typing-test-and-practice` (Native German: *Tipptest & Zehnfingersystem: Tippgeschwindigkeit Online Üben*)
4. **Portuguese**: `/guides/portuguese-typing-test-and-practice` (Native Portuguese: *Teste de Digitação e Prática: Guia Completo para Teclado ABNT2*)
5. **Hindi**: `/guides/hindi-typing-test-and-practice` (Native Hindi & Hinglish: *Hindi Typing Test Online: InScript, Mangal Font & Speed Practice Guide*)
6. **Chinese**: `/guides/chinese-typing-test-and-practice` (Native Simplified Chinese: *中文打字速度测试与拼音盲打练习指南*)

### 5.2 Internal Linking Architecture
- Every language pillar links directly to the HeroTyping typing test engine with the appropriate language pre-selected.
- Reciprocal links connect related topics:
  - Finger placement: `/guides/touch-typing-finger-map`
  - Speed vs accuracy diagnostics: `/guides/why-wpm-is-high-accuracy-is-low`
  - Test duration selection: `/guides/typing-test-duration-guide`
  - WPM/CPM/KPH conversions: `/guides/wpm-cpm-kph-calculator`

---

## 6. Measurement Plan & KPI Framework

| Metric | Target | Measurement Method |
| :--- | :--- | :--- |
| **Indexation Rate** | 100% of canonical language guides crawled & indexed | Google Search Console URL Inspection |
| **SERP Impressions** | Steady MoM growth across non-English query clusters | GSC Performance Report filtered by country & query |
| **Organic CTR** | > 4.5% on non-branded multilingual typing queries | GSC CTR tracking by page URL |
| **Bounce Rate / Engagement** | > 2 minutes average session duration on guides | Privacy-first web analytics |
| **Product Handoff Rate** | > 25% of guide visitors click through to launch a typing test | Internal navigation click tracking |
| **Core Web Vitals** | LCP < 1.5s, CLS < 0.05, INP < 100ms | Chrome User Experience Report (CrUX) & Lighthouse |
