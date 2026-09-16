# ThunderTyping — Master Image Prompt Batch

Four Flow batches of 24 = **96 AI-generated images**. Everything else is drawn in
code as SVG (see "Tier B" below). Read the Style Bible once, then run the batches
in order — batch 1 must come first because it establishes the characters that
later batches reference.

---

## Asset tiering — read this before generating anything

**Tier A — AI-generated in Flow (96 images, listed in this file).**
Characters, enemies, bosses, environments, menu/victory/defeat key art. These are
few, large, emotionally important, and lazy-loadable.

**Tier B — drawn in code as SVG, NOT generated (do not put these in Flow).**
Spell icons, relic icons, card illustrations, upgrade icons, status-effect icons,
buff/debuff badges, energy pips, rank pips, card frames, UI chrome.

Why Tier B is not AI art, in order of importance:

1. **Count.** The spec implies ~40 spells, ~30 relics, ~50 cards, ~40 upgrades.
   That is ~160 more images. At the current 133KB average that is another 21MB.
2. **Consistency.** 160 independently generated icons will not share a visual
   language. We already proved this: Falling Words returned three different
   characters across its cover, character and defeat art.
3. **Recolour.** Each game already overrides `--accent` on its route. An SVG icon
   inherits that automatically and works across all five site themes. A PNG
   cannot.
4. **Bytes.** An inline SVG sigil is ~400 bytes and needs no network request.

A card's illustration is therefore a procedurally-composed SVG sigil (a shape
grammar: rune ring + element glyph + rarity frame), not a painting. This looks
*more* premium than mixed-quality AI icons, not less.

---

## Flow workflow — lessons already learned on this project

- **24 per batch.** Flow refuses more. Each batch below is exactly 24.
- **Watermark.** Flow bakes a small sparkle into a corner even when it reports no
  visible watermark. Verified previously at roughly x1264–1303 / y651–688 on
  landscape output. Remove with `ffmpeg delogo` before converting to WebP.
- **Naming.** Flow does not name files usefully. The `FILE:` line in every prompt
  below is the name to save as. Keep it exact — the loader in
  `src/lib/games/game-art-assets.ts` resolves art by `<id>-<role>.webp`.
- **Character consistency.** Generate batch 1 assets 01–05 FIRST as reference
  sheets, then use Flow's Characters feature to pin them before generating any
  later asset that shows the same character. Do not rely on prompt text alone for
  consistency — that is exactly what failed last time.
- **Convert after download:** `cwebp -q 84`. Target under 180KB per image.

---

## STYLE BIBLE — prepend this to every Flow batch

> **Shared art direction for all images in this set.**
> Painterly stylised dark fantasy, semi-realistic proportions, cinematic
> key-light with strong coloured rim-lighting, deep shadow, high contrast.
> Rendered like premium 2D key art for a commercial browser game — think
> hand-painted concept art, not photoreal, not flat vector, not chibi, not anime.
> Visible brushwork in shadow, crisp rendered edges on focal forms.
> Palette is desaturated cool near-black base (#0b0d12 to #161a23) with ONE
> saturated accent hue per game carrying all the emotional weight, plus warm
> highlight sparingly for contrast. Materials read clearly: worn leather, pitted
> iron, woven cloth, cracked stone, molten glass, arcane light.
> Composition leaves the centre or lower third calmer for UI overlay.
> No text, no letters, no numbers, no logos, no watermarks, no UI elements, no
> frames or borders in the image.
> Consistent world: all four games share one universe and one rendering style;
> only the accent hue and setting change.

**Per-game accent hue** (already wired to `--accent` in code):

| Game | Accent | Hex | Mood |
|---|---|---|---|
| Spellbound | Arcane violet | `#a855f7` | Occult, scholarly, ominous |
| Typing Survivor | Ember orange | `#f97316` | Desperate, hot, kinetic |
| Ghost Racer | Spectral cyan | `#22d3ee` | Cold, fast, electric |
| Card Battle | Blood crimson + old gold | `#dc2626` / `#d4a13a` | Ritual, opulent, tense |

---

# GAME 1 — SPELLBOUND (Batch 1 of 4)

Accent: arcane violet `#a855f7`. Setting: a collapsing arcane library-dungeon
where language itself is the magic. Generate 01–05 first as character sheets.

**ASSET 001** — FILE: `spellbound-char-apprentice.webp` — 3:4 portrait
> Character reference sheet, three views (front, three-quarter, back) of a young
> apprentice mage, early twenties, androgynous, patched indigo robe over simple
> linen, ink-stained fingers, a satchel of loose parchment, no hat. Nervous but
> determined posture, shoulders slightly forward. Faint violet glyph-light leaking
> between the fingers of one hand. Neutral dark grey backdrop, even lighting for
> reference use, full body, consistent proportions across all three views.

**ASSET 002** — FILE: `spellbound-char-battlemage.webp` — 3:4 portrait
> Character reference sheet, three views, of a battlemage: broad-shouldered,
> forties, scarred jaw, half-plate armour of blackened steel over a torn violet
> tabard, a heavy spellbook chained to the hip, gauntlet crackling with contained
> lightning. Grounded, wide, aggressive stance. Neutral dark grey backdrop, even
> reference lighting, full body.

**ASSET 003** — FILE: `spellbound-char-rogue-mage.webp` — 3:4 portrait
> Character reference sheet, three views, of a rogue mage: lean, hooded, wrapped
> lower face, dark leathers with violet thread stitching, twin short blades that
> glow faintly along the fuller, pouches of powdered reagent. Coiled, low, ready
> posture. Neutral dark grey backdrop, even reference lighting, full body.

**ASSET 004** — FILE: `spellbound-char-chronomancer.webp` — 3:4 portrait
> Character reference sheet, three views, of a chronomancer: tall, ageless,
> silver-white hair, layered robes whose hem blurs into motion-trails, a broken
> orrery of brass rings orbiting one shoulder, one eye clouded white. Serene,
> upright, still posture. Neutral dark grey backdrop, even reference lighting,
> full body.

**ASSET 005** — FILE: `spellbound-char-void-mage.webp` — 3:4 portrait
> Character reference sheet, three views, of a void mage: gaunt, barefoot, ragged
> black robes fraying into smoke at the edges, no visible face inside the hood
> except two points of violet light, hands blackened to the elbow. Unsettling,
> slightly floating posture. Neutral dark grey backdrop, even reference lighting,
> full body.

**ASSET 006** — FILE: `spellbound-enemy-inkwraith.webp` — 1:1 square
> A hostile ink wraith: a hovering mass of spilled black ink holding a vaguely
> humanoid shape, torn parchment fragments orbiting it, a single violet eye-glow
> at its core. Mid-lunge, trailing ink droplets. Dark stone-library backdrop,
> heavily blurred. Full creature visible, centred.

**ASSET 007** — FILE: `spellbound-enemy-grimoire.webp` — 1:1 square
> A hostile animated grimoire: a heavy leather tome grown a hinged jaw of iron
> staples, pages fanned like wings, chain dangling, violet light spilling from
> between its pages. Snapping forward aggressively. Blurred dark library backdrop.

**ASSET 008** — FILE: `spellbound-enemy-scribe.webp` — 1:1 square
> A hostile corrupted scribe: a skeletal robed figure with a quill driven through
> its skull, one arm replaced by a bundle of writing reeds, violet ichor dripping
> from its sleeves. Shambling forward, head tilted. Blurred dark library backdrop.

**ASSET 009** — FILE: `spellbound-enemy-sentinel.webp` — 1:1 square
> A hostile stone sentinel: a squat armless golem of shelving-stone and mortar,
> a glowing violet rune-slot where a face would be, mossy and cracked. Braced
> defensively, low to the ground. Blurred dark library backdrop.

**ASSET 010** — FILE: `spellbound-elite-archivist.webp` — 1:1 square
> An elite enemy, the Bound Archivist: a tall robed figure bound in chains of
> glowing violet script, six spectral arms each holding a different tome, face
> hidden by a hanging iron mask. Imposing, arms spread wide. Blurred dark
> library backdrop, stronger rim-light than common enemies.

**ASSET 011** — FILE: `spellbound-elite-cipher.webp` — 1:1 square
> An elite enemy, the Living Cipher: a shifting humanoid built entirely from
> interlocking rotating rune-plates, gaps showing violet void between them,
> reassembling itself mid-motion. Blurred dark library backdrop, strong rim-light.

**ASSET 012** — FILE: `spellbound-boss-iron-golem.webp` — 16:9 landscape
> Boss key art: the Iron Golem, a colossal siege-construct of riveted black iron
> and chained stone, one arm a wrecking-fist, furnace-glow of violet fire visible
> through the seams of its chest. Low camera angle looking up, emphasising mass
> and slowness. Ruined library hall behind, pillars broken. Dust in the light
> shafts. Lower third kept calmer for UI.

**ASSET 013** — FILE: `spellbound-boss-word-eater.webp` — 16:9 landscape
> Boss key art: the Word Eater, a vast lamprey-like maw of concentric ringed
> teeth made of torn pages, suspended in mid-air, sucking a spiral of glowing
> violet letters into itself, the letters visibly fraying and blanking as they
> enter. Surrounding shelves half-erased into white void. Low camera, awe and
> dread. Lower third calmer.

**ASSET 014** — FILE: `spellbound-boss-mirror-mage.webp` — 16:9 landscape
> Boss key art: the Mirror Mage, an elegant figure in a silvered mask standing
> before a wall of tall cracked mirrors, each reflection echoing a slightly
> different pose a half-beat behind. Cold violet and silver palette, symmetrical
> composition. Reflections recede into darkness. Lower third calmer.

**ASSET 015** — FILE: `spellbound-boss-void-king.webp` — 16:9 landscape
> Boss key art: the Void King, an enormous seated silhouette on a throne built of
> collapsed bookshelves, crowned with a ring of dead stars, body a hole in reality
> edged with violet fracture-light, reality bending visibly around him. Extreme
> scale, the viewer positioned far below. Dramatic god-rays. Lower third calmer.

**ASSET 016** — FILE: `spellbound-bg-dungeon.webp` — 16:9 landscape
> Environment background: a vaulted arcane library-dungeon corridor, endless
> shelves receding into violet gloom, floating candlelit tomes, cracked flagstone
> floor, dust motes in shafts of light. No characters. Composition deliberately
> empty in the centre for gameplay overlay, detail pushed to the edges.

**ASSET 017** — FILE: `spellbound-bg-treasure.webp` — 16:9 landscape
> Environment background: a small vaulted treasure vault, an open iron-bound
> chest spilling coins, rings and a single glowing violet relic, gold light
> bouncing onto wet stone walls. Warm gold against cool violet. No characters.
> Centre kept calm for overlay.

**ASSET 018** — FILE: `spellbound-bg-shop.webp` — 16:9 landscape
> Environment background: a cramped arcane curiosity shop inside the dungeon,
> hanging lanterns, shelves of jarred reagents and bottled light, a worn counter,
> a beaded curtain. Warm inviting pocket of light in a cold place. No shopkeeper
> figure. Centre calm for overlay.

**ASSET 019** — FILE: `spellbound-bg-event.webp` — 16:9 landscape
> Environment background: a cursed shrine chamber, a cracked obelisk carved with
> violet runes standing in a shallow pool of black water, offerings scattered,
> two braziers with violet flame. Ominous, still, ritual. No characters. Centre
> calm for overlay.

**ASSET 020** — FILE: `spellbound-hero.webp` — 16:9 landscape
> Main menu key art: the apprentice from asset 001 seen from behind, small in
> frame, standing at the threshold of a vast collapsing library that spirals
> upward into darkness, violet script streaming off the shelves and swirling
> around them like a vortex. Epic scale, single figure, strong silhouette,
> cinematic. Left third kept calm for a title overlay.

**ASSET 021** — FILE: `spellbound-select.webp` — 16:9 landscape
> Character-select backdrop: an empty circular ritual chamber floor of inlaid
> violet runework, five unlit pedestals arranged in an arc, soft volumetric haze,
> shallow depth of field. No characters at all — figures will be composited on
> top. Very calm composition, even lighting across the arc.

**ASSET 022** — FILE: `spellbound-victory.webp` — 16:9 landscape
> Victory scene: a lone mage silhouette standing on a rise of shattered stone,
> arm raised, a column of brilliant violet-white light breaking through a
> collapsed ceiling, defeated construct debris scattered below, dust glittering.
> Triumphant, warm highlight cutting the cold palette. Lower third calm.

**ASSET 023** — FILE: `spellbound-defeat.webp` — 16:9 landscape
> Defeat scene: a dropped spellbook lying open in a puddle, pages dissolving into
> drifting violet embers that rise and go out, a fallen staff, encroaching
> darkness at the frame edges, one dying candle. Melancholy, quiet, not gory.
> Lower third calm.

**ASSET 024** — FILE: `spellbound-map.webp` — 16:9 landscape
> Floor-map backdrop: an aged parchment map surface, burnt and water-stained
> edges, faint violet ink contours suggesting branching corridors, a brass
> compass rose in one corner, lying on a dark wood table lit by candlelight. No
> readable text, no legible letters, no route markers — nodes are drawn in code
> on top. Flat even lighting, minimal centre detail.

---

# GAME 2 — TYPING SURVIVOR (Batch 2 of 4)

Accent: ember orange `#f97316`. Setting: a besieged frontier waystation at dusk,
endless horde. Same rendering style, hotter palette.

**ASSET 025** — FILE: `survivor-char-warden.webp` — 3:4 portrait
> Character reference sheet, three views, of the Warden: heavyset veteran guard,
> fifties, banded armour over chainmail, a tower shield slung on the back, grey
> beard, burn scar across one forearm. Immovable, planted stance. Neutral dark
> grey backdrop, even reference lighting, full body.

**ASSET 026** — FILE: `survivor-char-ranger.webp` — 3:4 portrait
> Character reference sheet, three views, of the Ranger: wiry, hooded, oilcloth
> cloak, quiver of ember-tipped arrows, leather bracers, a hunting knife. Light
> on the feet, weight back. Neutral dark grey backdrop, even reference lighting,
> full body.

**ASSET 027** — FILE: `survivor-char-pyromancer.webp` — 3:4 portrait
> Character reference sheet, three views, of the Pyromancer: shaven-headed,
> soot-streaked, sleeveless heat-resistant leathers, forearms wrapped in
> scorched bandages, carrying a censer of live coals on a chain. Restless,
> off-balance, forward-leaning. Neutral dark grey backdrop, even lighting,
> full body.

**ASSET 028** — FILE: `survivor-char-duelist.webp` — 3:4 portrait
> Character reference sheet, three views, of the Duelist: elegant, precise, high
> collar, fitted dark coat with ember piping, a single slim rapier, one glove
> removed. Poised, side-on, weight on the front foot. Neutral dark grey backdrop,
> even reference lighting, full body.

**ASSET 029** — FILE: `survivor-enemy-swarmling.webp` — 1:1 square
> A hostile swarmling: a small hunched scavenger creature, mangy, too many teeth,
> ember light in its eyes, running low on all fours. Built to be read instantly
> at small size and in large numbers — strong simple silhouette, minimal internal
> detail. Blurred dark battlefield backdrop.

**ASSET 030** — FILE: `survivor-enemy-brute.webp` — 1:1 square
> A hostile brute: a hulking slab-muscled creature dragging a length of chain,
> iron plate riveted directly into its shoulder, small head, enormous arms.
> Heavy forward stomp. Strong readable silhouette. Blurred dark battlefield
> backdrop.

**ASSET 031** — FILE: `survivor-enemy-slinger.webp` — 1:1 square
> A hostile ranged slinger: a stooped robed creature whirling a sling loaded with
> a burning ember stone, trailing sparks, face wrapped in rags. Mid-throw.
> Strong readable silhouette. Blurred dark battlefield backdrop.

**ASSET 032** — FILE: `survivor-enemy-stalker.webp` — 1:1 square
> A hostile fast stalker: a long-limbed lean predator, skin stretched over
> bone, sprinting at full extension, motion blur on the trailing limbs, ember
> eye-shine. Strong readable silhouette. Blurred dark battlefield backdrop.

**ASSET 033** — FILE: `survivor-enemy-bloater.webp` — 1:1 square
> A hostile exploder: a bloated distended creature, skin split to show glowing
> orange pressure building beneath, arms too small, staggering. Visually telegraphs
> "about to explode". Strong readable silhouette. Blurred dark backdrop.

**ASSET 034** — FILE: `survivor-enemy-bulwark.webp` — 1:1 square
> A hostile shielder: a squat creature crouched behind an enormous salvaged iron
> door used as a shield, only its legs and one eye visible past the edge.
> Visually telegraphs "blocks damage". Strong silhouette. Blurred dark backdrop.

**ASSET 035** — FILE: `survivor-elite-warchief.webp` — 1:1 square
> An elite enemy, the Warchief: a towering armoured horde-leader with a horned
> helm, a banner of flayed hide strapped to its back, twin cleavers, ember-lit
> war paint. Roaring, arms wide. Blurred dark battlefield backdrop, strong
> rim-light, noticeably grander than common enemies.

**ASSET 036** — FILE: `survivor-elite-hexer.webp` — 1:1 square
> An elite enemy, the Hexer: a stilt-limbed shaman on bone stilts, a mask of
> welded keys, trailing smoking censers, hunched and gesturing. Blurred dark
> battlefield backdrop, strong rim-light.

**ASSET 037** — FILE: `survivor-boss-siegebeast.webp` — 16:9 landscape
> Boss key art: the Siege Beast, a quadrupedal armoured monstrosity the size of a
> house, a howdah of scrap iron strapped to its back, tusks capped in metal,
> breath steaming in the cold. Low camera, enormous scale, the waystation wall
> tiny behind it. Ember firelight from below. Lower third calm for UI.

**ASSET 038** — FILE: `survivor-boss-plaguemother.webp` — 16:9 landscape
> Boss key art: the Plague Mother, a vast bloated sessile creature fused into the
> ground, birthing smaller swarmlings from split sacs along her flanks, orange
> glow pulsing under translucent skin. Grotesque but not gory. Wide establishing
> composition. Lower third calm.

**ASSET 039** — FILE: `survivor-boss-ashen-knight.webp` — 16:9 landscape
> Boss key art: the Ashen Knight, a tall silent armoured figure standing alone in
> the centre of a burning field, greatsword point-down in the earth, armour
> cracked and glowing orange along the fractures, cape of ash. Still, patient,
> menacing. Symmetrical hero framing. Lower third calm.

**ASSET 040** — FILE: `survivor-bg-waystation.webp` — 16:9 landscape
> Environment background: the courtyard of a fortified frontier waystation at
> dusk, palisade walls, watchtower, scattered braziers, churned mud, supply
> crates. Empty of characters. Centre deliberately open for the arena, detail at
> the edges.

**ASSET 041** — FILE: `survivor-bg-ashfields.webp` — 16:9 landscape
> Environment background: open ash fields under a burnt orange sky, skeletal dead
> trees, drifting ash, a distant burning treeline on the horizon. Empty of
> characters. Centre open and uncluttered for gameplay.

**ASSET 042** — FILE: `survivor-bg-quarry.webp` — 16:9 landscape
> Environment background: a flooded stone quarry at night, terraced cut walls,
> standing black water, abandoned scaffolding, ember braziers reflecting on the
> surface. Empty of characters. Centre open.

**ASSET 043** — FILE: `survivor-bg-bridge.webp` — 16:9 landscape
> Environment background: a long stone bridge over a chasm filled with orange
> volcanic glow from far below, broken guard rails, chains hanging, heat haze.
> Empty of characters. Centre open.

**ASSET 044** — FILE: `survivor-hero.webp` — 16:9 landscape
> Main menu key art: four survivors standing back-to-back in a tight defensive
> ring at the centre of frame, a vast horde silhouette closing in from every
> direction in the dark, ember light from a single guttering brazier between
> them. Desperate last-stand energy. Strong central silhouette group, left third
> calm for title overlay.

**ASSET 045** — FILE: `survivor-select.webp` — 16:9 landscape
> Character-select backdrop: the inside of an armoury tent, weapon racks, hanging
> lanterns, a scarred wooden table, four empty standing spaces. No characters at
> all. Calm even composition for compositing figures on top.

**ASSET 046** — FILE: `survivor-upgrade.webp` — 16:9 landscape
> Upgrade-choice backdrop: a quiet moment between waves — a campfire in close
> foreground darkness, warm orange bounce light, blurred ruined wall behind, three
> empty flat areas of frame where cards will be composited. Very low detail in the
> upper two thirds, strongly blurred.

**ASSET 047** — FILE: `survivor-victory.webp` — 16:9 landscape
> Victory scene: dawn breaking over the waystation wall, the horde reduced to
> smoking heaps, a single survivor seated on the parapet with weapon across the
> knees, first warm sunlight cutting the orange murk. Exhausted relief, not
> celebration. Lower third calm.

**ASSET 048** — FILE: `survivor-defeat.webp` — 16:9 landscape
> Defeat scene: a dropped shield half-buried in ash, a guttering torch beside it
> going out, the horde's silhouettes advancing past in the blurred background,
> embers drifting upward. Sombre, restrained, no gore. Lower third calm.

---

# GAME 3 — GHOST RACER (Batch 3 of 4)

Accent: spectral cyan `#22d3ee`. Setting: night circuits raced against spectral
echoes of other riders. Reads as *racing* first, spectral second.

**ASSET 049** — FILE: `racer-char-veteran.webp` — 3:4 portrait
> Character reference sheet, three views, of a veteran racer: forties, weathered,
> scarred knuckles, worn cyan-striped racing leathers, helmet held under one arm,
> short greying hair. Confident, relaxed stance. Neutral dark grey backdrop, even
> reference lighting, full body.

**ASSET 050** — FILE: `racer-char-rookie.webp` — 3:4 portrait
> Character reference sheet, three views, of a rookie racer: late teens, wiry,
> oversized hand-me-down leathers taped at the cuffs, helmet with a cracked
> visor, eager grin. Restless, weight shifting. Neutral dark grey backdrop, even
> lighting, full body.

**ASSET 051** — FILE: `racer-char-phantom.webp` — 3:4 portrait
> Character reference sheet, three views, of the Phantom: a racer rendered as a
> semi-transparent cyan spectral echo, form made of layered motion-trails and
> after-images, helmet visor a solid plate of cold light, no visible face.
> Neutral dark grey backdrop, even lighting, full body, translucency clearly
> readable.

**ASSET 052** — FILE: `racer-char-champion.webp` — 3:4 portrait
> Character reference sheet, three views, of the reigning champion: tall,
> immaculate, custom leathers in black and old silver with cyan piping, gloved
> hands, mirrored full-face helmet worn (never removed). Arrogant, still posture.
> Neutral dark grey backdrop, even lighting, full body.

**ASSET 053** — FILE: `racer-bike-standard.webp` — 16:9 landscape
> A racing machine in profile: a low-slung fictional single-rider vehicle, part
> motorcycle part magnetic sled, exposed mechanical spine, cyan light strip along
> the underside, worn racing livery, no rider. Clean side-on three-quarter view,
> neutral dark backdrop, even product-style lighting for compositing.

**ASSET 054** — FILE: `racer-bike-phantom.webp` — 16:9 landscape
> The same racing machine silhouette as the previous asset but rendered as a
> spectral ghost version: translucent cyan, edges dissolving into motion-trails,
> interior structure faintly visible through the bodywork, no rider. Same camera
> angle and framing for exact overlay. Neutral dark backdrop.

**ASSET 055** — FILE: `racer-bg-neoncity.webp` — 16:9 landscape
> Track environment: a night circuit threading between rain-wet city towers,
> reflective road surface, cyan and magenta signage bokeh far behind, barriers
> and catch-fencing. Empty road, no vehicles. Strong sense of speed in the
> perspective. Centre road surface kept clean for gameplay overlay.

**ASSET 056** — FILE: `racer-bg-coastal.webp` — 16:9 landscape
> Track environment: a cliffside coastal circuit at night, black sea below, moon
> low on the horizon, guard rails, spray in the air, cyan course-marker lights
> receding into the distance. Empty road, no vehicles. Centre clean.

**ASSET 057** — FILE: `racer-bg-tunnel.webp` — 16:9 landscape
> Track environment: a long underground tunnel section, repeating cyan light
> rings overhead compressing into the distance, wet concrete, tyre marks. Empty
> road, no vehicles. Extreme one-point perspective for speed. Centre clean.

**ASSET 058** — FILE: `racer-bg-desert.webp` — 16:9 landscape
> Track environment: a desert salt-flat circuit at night under a huge star field,
> cyan marker pylons stretching to the horizon, dust drifting low across the
> surface. Empty road, no vehicles. Vast and lonely. Centre clean.

**ASSET 059** — FILE: `racer-start.webp` — 16:9 landscape
> Start-line scene: a low dramatic camera between two waiting machines on a
> floodlit grid, heat shimmer, a hanging start gantry above, crowd silhouettes
> blurred far behind the fencing. Tension before launch. No readable text or
> numbers anywhere. Centre kept calm for a countdown overlay.

**ASSET 060** — FILE: `racer-finish.webp` — 16:9 landscape
> Finish-line scene: a machine crossing under a lit finish gantry at speed, hard
> motion blur on the environment, sparks off the underside, confetti of cyan
> light particles. Explosive energy. No readable text or chequered-flag pattern.
> Lower third calm.

**ASSET 061** — FILE: `racer-victory.webp` — 16:9 landscape
> Victory scene: a rider standing on the machine's seat, helmet raised
> overhead in one fist, backlit by floodlights with lens flare, cyan smoke
> drifting across the frame. Pure arcade triumph. Lower third calm.

**ASSET 062** — FILE: `racer-defeat.webp` — 16:9 landscape
> Defeat scene: a rider slumped forward over the handlebars at the roadside,
> helmet still on, the spectral cyan ghost machine already far ahead and
> dissolving into the dark. Near-miss disappointment, not disaster. Lower third
> calm.

**ASSET 063** — FILE: `racer-rank-bronze.webp` — 1:1 square
> A league emblem: a heraldic badge cast in pitted worn bronze, a stylised wing
> and wheel motif, riveted border, subtle patina. Centred, symmetrical, isolated
> on a flat near-black background, even lighting. No text, no numerals.

**ASSET 064** — FILE: `racer-rank-silver.webp` — 1:1 square
> A league emblem in the same heraldic family and identical framing as the bronze
> badge, cast in polished silver with sharper edges and an added laurel element.
> Centred, symmetrical, flat near-black background, even lighting. No text.

**ASSET 065** — FILE: `racer-rank-gold.webp` — 1:1 square
> A league emblem in the same heraldic family and identical framing, cast in warm
> gold with enamel inlay and a small crown element above the wing. Centred,
> symmetrical, flat near-black background, even lighting. No text.

**ASSET 066** — FILE: `racer-rank-legend.webp` — 1:1 square
> A league emblem in the same heraldic family and identical framing, but forged
> from dark metal shot through with living cyan spectral light, the wing
> dissolving into motion-trails, faint aura. Clearly the apex of the set.
> Centred, flat near-black background. No text.

**ASSET 067** — FILE: `racer-hero.webp` — 16:9 landscape
> Main menu key art: two machines side by side at speed on a night circuit — one
> solid and real, one a translucent cyan ghost overlapping it almost exactly, the
> ghost a fraction ahead. The core idea of the game in one image. Heavy motion
> blur, rain streaks, dramatic low camera. Left third calm for title overlay.

**ASSET 068** — FILE: `racer-daily.webp` — 16:9 landscape
> Daily-race backdrop: an empty floodlit starting grid photographed from high
> above at a steep angle, wet tarmac, painted lane markings abstracted, cyan
> light pooling. No vehicles, no characters, no text. Very calm and graphic —
> this sits behind a lot of UI.

**ASSET 069** — FILE: `racer-leaderboard.webp` — 16:9 landscape
> Leaderboard backdrop: a darkened trophy hall, rows of indistinct silhouetted
> trophies and helmets on shelves receding into shadow, a single cyan spotlight
> from above, heavy vignette. Deliberately low contrast and out of focus — pure
> backdrop. No text.

**ASSET 070** — FILE: `racer-pb.webp` — 16:9 landscape
> Personal-best celebration art: a single machine cresting a rise with all four
> contact points off the ground, silhouetted against an enormous cyan light burst,
> debris and light particles radiating outward. Peak triumphant moment. Centre
> bright, edges dark. No text.

**ASSET 071** — FILE: `racer-ghost-vfx.webp` — 16:9 landscape
> A visual-effects reference sheet on a flat near-black background: six separate
> spectral cyan trail and after-image effects arranged in a grid — a motion smear,
> a particle dissolve, an edge-glow outline, a speed-line burst, a light bloom,
> and a scanline shimmer. No characters, no vehicles, no text. Even lighting,
> clearly separated cells.

**ASSET 072** — FILE: `racer-select.webp` — 16:9 landscape
> Racer-select backdrop: a dim garage interior, machines under dust sheets,
> toolboxes, a work lamp, an open roller door showing night road beyond. No
> characters. Calm even composition for compositing figures on top.

---

# GAME 4 — TYPING CARD BATTLE (Batch 4 of 4)

Accent: blood crimson `#dc2626` with old gold `#d4a13a`. Setting: a ritual duel
beneath an opulent decaying opera house. Richer and more ornate than the others.

**ASSET 073** — FILE: `cards-char-gambler.webp` — 3:4 portrait
> Character reference sheet, three views, of the Gambler: sharp-dressed, thirties,
> crimson waistcoat, gold pocket-watch chain, sleeves rolled, a fan of blank cards
> held loosely in one hand, knowing half-smile. Relaxed, confident. Neutral dark
> grey backdrop, even reference lighting, full body.

**ASSET 074** — FILE: `cards-char-alchemist.webp` — 3:4 portrait
> Character reference sheet, three views, of the Alchemist: stooped, goggled,
> stained apron over a high-collared coat, bandolier of glass vials with crimson
> and green contents, gloved to the elbow. Fidgeting, asymmetric posture. Neutral
> dark grey backdrop, even lighting, full body.

**ASSET 075** — FILE: `cards-char-inquisitor.webp` — 3:4 portrait
> Character reference sheet, three views, of the Inquisitor: severe, upright,
> long crimson-lined black coat, gold clasps, a censer on a chain, hair scraped
> back, gaunt face. Rigid, formal, unmoving. Neutral dark grey backdrop, even
> lighting, full body.

**ASSET 076** — FILE: `cards-enemy-cutpurse.webp` — 1:1 square
> A hostile cutpurse: a scrawny grinning thief in patched finery, too many rings,
> a curved knife held reversed, crouched mid-step. Blurred dark opera-house
> backdrop. Full figure, centred, strong silhouette.

**ASSET 077** — FILE: `cards-enemy-brawler.webp` — 1:1 square
> A hostile brawler: a thick-necked bare-knuckle fighter in a torn crimson sash,
> broken nose, fists wrapped in bloodied cloth, shoulders squared. Blurred dark
> opera-house backdrop. Strong silhouette.

**ASSET 078** — FILE: `cards-enemy-poisoner.webp` — 1:1 square
> A hostile poisoner: a veiled figure in layered green-black silks, a ring that
> dispenses powder, one hand cupped over a smoking vial. Blurred dark opera-house
> backdrop. Strong silhouette.

**ASSET 079** — FILE: `cards-enemy-zealot.webp` — 1:1 square
> A hostile zealot: a robed fanatic with crimson handprints daubed on the robe,
> eyes bound with cloth, carrying a heavy iron bell. Blurred dark opera-house
> backdrop. Strong silhouette.

**ASSET 080** — FILE: `cards-enemy-marionette.webp` — 1:1 square
> A hostile marionette: a life-sized puppet of lacquered wood and gold joints
> hanging from taut strings that vanish upward into darkness, painted smile,
> limbs at unnatural angles. Blurred dark opera-house backdrop. Strong
> silhouette.

**ASSET 081** — FILE: `cards-enemy-usher.webp` — 1:1 square
> A hostile usher: a tall gaunt figure in a moth-eaten crimson uniform with gold
> braid, face entirely smooth and featureless, holding a shuttered lantern.
> Blurred dark opera-house backdrop. Strong silhouette.

**ASSET 082** — FILE: `cards-boss-ringmaster.webp` — 16:9 landscape
> Boss key art: the Ringmaster, a theatrical towering figure in a crimson tailcoat
> and tall gold-banded hat, arms thrown wide mid-flourish on a stage, spotlight
> from directly above, an audience of featureless silhouettes watching from the
> dark. Showmanship and menace. Lower third calm for UI.

**ASSET 083** — FILE: `cards-boss-collector.webp` — 16:9 landscape
> Boss key art: the Collector, a hunched figure whose coat is sewn entirely from
> hundreds of cards, seated behind a vast desk stacked with ledgers and specimen
> jars, gold pince-nez catching the light, hands steepled. Claustrophobic,
> obsessive, warm lamplight. Lower third calm.

**ASSET 084** — FILE: `cards-boss-crimson-choir.webp` — 16:9 landscape
> Boss key art: the Crimson Choir, five identical robed singers standing in a row
> on a ruined stage, mouths open impossibly wide, sound rendered as visible
> crimson shockwave rings distorting the air and cracking the boards. Symmetrical,
> unsettling, operatic scale. Lower third calm.

**ASSET 085** — FILE: `cards-bg-stage.webp` — 16:9 landscape
> Environment background: the stage of a decaying opera house seen from the
> performer's position, torn crimson curtains, footlights, empty gilded boxes
> receding into darkness. Empty of characters. Centre open for gameplay overlay.

**ASSET 086** — FILE: `cards-bg-foyer.webp` — 16:9 landscape
> Environment background: a grand decaying foyer, sweeping double staircase,
> cracked marble, a fallen chandelier resting on its side still faintly lit, gold
> leaf peeling. Empty of characters. Centre open.

**ASSET 087** — FILE: `cards-bg-catacomb.webp` — 16:9 landscape
> Environment background: flooded catacombs beneath the opera house, brick
> vaulting, standing black water reflecting crimson lantern light, alcoves of
> stacked bones. Empty of characters. Centre open.

**ASSET 088** — FILE: `cards-bg-boxes.webp` — 16:9 landscape
> Environment background: the private viewing boxes high above the stage,
> velvet seats, brass rail, heavy drapes, looking out over a dark auditorium.
> Empty of characters. Centre open.

**ASSET 089** — FILE: `cards-map.webp` — 16:9 landscape
> Route-map backdrop: an ornate theatre programme spread open on dark velvet,
> gold filigree border, foxed and water-stained paper, a wax seal in one corner.
> No readable text, no legible letters, no route nodes — those are drawn in code
> on top. Flat even lighting, minimal centre detail.

**ASSET 090** — FILE: `cards-shop.webp` — 16:9 landscape
> Environment: a backstage curiosity dealer's alcove, a velvet-draped table of
> oddities, hanging brass scales, a cracked mirror, warm lamplight against deep
> shadow. No shopkeeper figure. Centre calm for overlay.

**ASSET 091** — FILE: `cards-event.webp` — 16:9 landscape
> Event illustration: a crimson-draped table bearing three face-down cards under
> a single hanging bulb, a spilled glass, deep surrounding darkness. Ambiguous
> risk-and-reward mood. No characters, no readable text. Centre calm.

**ASSET 092** — FILE: `cards-cardback.webp` — 2:3 portrait
> A playing-card back design: ornate symmetrical gold filigree on deep crimson,
> a central heraldic sigil of a stylised quill crossed with a blade, fine
> guilloche border, subtle wear at the corners. Perfectly centred and
> symmetrical, flat straight-on view, no perspective, no text, no numerals.
> Fills the entire frame edge to edge.

**ASSET 093** — FILE: `cards-relic-display.webp` — 16:9 landscape
> Relic-display backdrop: an empty glass specimen case on a velvet cushion under
> a narrow spotlight, brass fittings, dust in the beam, everything else in deep
> shadow. Deliberately empty — relic art is composited in. Very calm, centred,
> low detail.

**ASSET 094** — FILE: `cards-hero.webp` — 16:9 landscape
> Main menu key art: two duellists seated opposite each other at a small round
> table on the opera-house stage, cards mid-flight and glowing crimson between
> them, spotlight from above carving them out of total darkness, audience unseen.
> High drama, strong central composition. Left third calm for title overlay.

**ASSET 095** — FILE: `cards-victory.webp` — 16:9 landscape
> Victory scene: a winning hand of glowing cards fanned out and rising into the
> air, crimson and gold light radiating outward, defeated opponent's cards
> scattering to ash below, falling gold confetti. Triumphant and opulent. No
> readable text or numerals on any card. Lower third calm.

**ASSET 096** — FILE: `cards-defeat.webp` — 16:9 landscape
> Defeat scene: a single card lying face down on a wet stage floor, a spotlight
> narrowing to nothing around it, the rest of the deck scattered and dissolving
> into crimson embers, curtain falling in the background. Quiet finality. Lower
> third calm.

---

## After generation — processing checklist

1. Remove the Flow sparkle watermark from every file (`ffmpeg delogo`).
2. Convert to WebP at `-q 84`.
3. Rename to the exact `FILE:` name from each prompt.
4. Drop into `public/games/`.
5. Verify total added weight stays under ~12MB; if over, re-encode the 16:9
   backgrounds at `-q 78` first since they sit behind heavy overlays anyway.
