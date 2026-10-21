// Educational SEO content sections for all 9 HeroTyping games.
// Provides crawlable server-rendered HTML detailing game mechanics,
// cognitive typing skills trained, and tactical strategies (250-350 words each).

import Link from "next/link";
import { type GameId } from "@/lib/games/game-types";

export interface GameSeoContentData {
  name: string;
  headline: string;
  overview: string;
  mechanics: string;
  skillsTrained: string;
  strategy: string;
}

export const GAME_SEO_DATA: Partial<Record<GameId, GameSeoContentData>> = {
  "falling-words": {
    "name": "Falling Words",
    "headline": "How Falling Words Arcade Typing Works",
    "overview": "Falling Words is HeroTyping's classic descending-text survival challenge. Words drop vertically from the top of the arcade cabinet at accelerating speeds. Your objective is to type each word completely before it makes contact with the bottom boundary line, destroying the threat and earning score multipliers.",
    "mechanics": "Every correct character stroke locks onto the descending word with the highest priority—the one closest to the impact line. Typing cleanly clears the target immediately and advances your combo streak. A single spelling mistake breaks your active combo and temporarily halts your weapon discharge, forcing you to use backspace to repair the error while the word continues its descent.",
    "skillsTrained": "This mode trains rapid peripheral word recognition and immediate reflex actuation under pressure. Unlike static prose tests where you can pause to think, falling words forces you to digest entire word chunks (orthographic processing) in a single visual glance. It directly exercises your eye-hand coordination, teaching you to look at the screen rather than your hands.",
    "strategy": "Focus on vertical danger priority rather than short-word convenience: always eliminate the lowest word first, even if a shorter word appears near the top. Maintain floating wrists and avoid panic-sprinting, as a typo on a fast-falling word is difficult to recover from before ground impact. Use the spacebar or Enter key cadence to reset your hand rhythm between targets."
  },
  "word-rain": {
    "name": "Word Rain",
    "headline": "Mastering Word Rain High-Speed Precision",
    "overview": "Word Rain is a relentless, single-life survival typing game designed for typists seeking unforgiving accuracy training. A torrential downpour of vocabulary cascades across multiple lanes simultaneously. With only one life available, a single ground collision ends your run immediately.",
    "mechanics": "Words fall in parallel vertical columns across the entire display width. Typing the initial letter of any visible word snaps your targeting reticle to that specific lane. Completing the word vaporizes it instantly with an acoustic confirmation. As elapsed time increases, fall velocities climb and multi-syllable vocabulary appears, demanding continuous vigilance. Audio cues signal when raindrops cross into the warning perimeter, allowing auditory monitoring alongside visual scanning.",
    "skillsTrained": "Word Rain builds extraordinary visual scanning stamina and lateral peripheral awareness. Because words spawn across multiple columns, your eyes must scan horizontally while your fingers execute rapid vertical reaches across the home, top, and bottom keyboard rows. It completely eliminates hunt-and-peck habits by penalizing visual hesitation with an instant game over. Practicing in high-pressure rainfall conditions rapidly builds finger automaticity, ensuring you never look down at your keyboard.",
    "strategy": "Prioritize lane management and scan the bottom third of the cabinet constantly. When multiple words approach the danger threshold, execute the word closest to the baseline first. Keep your breathing steady and avoid tensing your forearm muscles during intense rainfall phases, as isometric tension impairs fine-motor keystroke precision."
  },
  "word-blaster": {
    "name": "Word Blaster",
    "headline": "Tactical Asteroid Defense in Word Blaster",
    "overview": "Word Blaster transforms touch typing into an action-packed space defense simulation. Incoming space debris and armored meteoroids drift toward your planetary defense grid across three primary sectors. Type the inscribed command words to charge plasma lasers and obliterate threats before hull integrity fails.",
    "mechanics": "Threats approach at varying angles and velocities. Standard asteroids require a single clean word to destroy, while armored debris requires consecutive words or longer technical phrases. Typing accurate characters powers up your defensive shields; consecutive clean completions trigger multi-target shockwave pulses that clear nearby hazards. Destroying consecutive waves charges your orbital railgun, unleashing automated defensive volleys during critical moments.",
    "skillsTrained": "Word Blaster specifically conditions high-speed alphanumeric accuracy and burst-speed acceleration. Switching between varying word lengths trains your cognitive motor buffer to adapt dynamically from rapid three-letter combinations to complex seven-letter sequences without cognitive stutter or loss of rhythm. Training with varied vocabulary lengths builds cognitive agility, allowing effortless transitions between short and complex terms.",
    "strategy": "Watch the sector threat meters and target cluster formations early. Firing at words when they first enter orbit gives you maximum margin for error recovery. If an armored asteroid enters critical proximity, maintain calm, metronomic keystroke cadence rather than frantically mashing keys, which triggers laser overheating."
  },
  "boss-battle": {
    "name": "Boss Battle",
    "headline": "Conquering Tactical Boss Battle Typing Phases",
    "overview": "Boss Battle pits your typing speed and stamina against massive multi-phase titans. Each boss possesses unique attack patterns, shielded phases, and devastating telegraphed special abilities that must be countered with swift, accurate typing sequences before the countdown expires.",
    "mechanics": "Combat proceeds through distinct escalation tiers: minion waves, armor-stripping phases, and timed sentence execution windows. Typing correct words inflicts direct physical damage to the boss's health bar. When the boss initiates an ultimate attack, you enter a high-pressure interrupt phase where a flawless phrase must be typed within a strict timer. Each boss phase features distinct typing modifiers, including inverted word order, speed requirements, and shielding barriers.",
    "skillsTrained": "This RPG-style typing mode trains mental composure under extreme performance pressure. Typing against an aggressive boss with visual countdown timers replicates the psychological stress of competitive typing exams and real-time transcription, training you to maintain 98%+ precision when your adrenaline spikes. Managing multi-phase encounters develops emotional poise and fine-motor control under strict, high-stakes time constraints.",
    "strategy": "Conserve your focus during basic attack phases and prepare for the red-telegraphed interrupt windows. When an interrupt sentence appears, read the entire phrase before your first keystroke to prime your motor memory. Settle into a rhythm rather than over-sprinting, as a typo during an interrupt phase causes severe retaliatory boss damage."
  },
  "combo-rush": {
    "name": "Combo Rush",
    "headline": "Igniting Overdrive in Combo Rush",
    "overview": "Combo Rush is an adrenaline-fueled score-attack game where clean cadence keeps a shrinking survival clock alive. Every completed word buys back time, raises the Rush tier, and pushes the player toward a short Overdrive window.",
    "mechanics": "The clock drains continuously and accelerates as more words are cleared. Clean words build a combo multiplier up to 1.6x for score and time refunds; one wrong letter resets the streak, while Space skips the current word for a fixed time cost. Five clean clears fill Overdrive, which halves clock drain and boosts clear score by 1.5x for six seconds before the meter must be rebuilt.",
    "skillsTrained": "Combo Rush trains consistent keystroke cadence and eliminates the common burst-and-stall habit. Because maintaining the multiplier requires uninterrupted output without pauses, it trains your brain to pipeline incoming words in parallel with motor execution, expanding your eye-hand cognitive span. Eliminating pauses between words develops natural eye-hand pipelining, transforming discrete keystrokes into fluid language flow.",
    "strategy": "Prioritize accuracy above raw speed: a steady streak keeps both the score multiplier and the survival clock working for you. Use the look-ahead queue to prepare the next word, skip only when the current word is genuinely dangerous, and use the six-second Overdrive window to convert a clean burst into a score lead."
  },
  "ghost-racer": {
    "name": "Ghost Racer",
    "headline": "High-Speed Night Racing in Ghost Racer",
    "overview": "Ghost Racer drops you onto a neon-lit midnight circuit competing head-to-head against four AI rival vehicles and your personal best ghost car. Your typing speed directly governs your vehicle's throttle, turning raw WPM and accuracy into pure track velocity.",
    "mechanics": "Type the continuous stream of race commentary and track navigation text. Every correctly typed word accelerates your engine through higher gear shifts, boosting top speed. Errors cause engine misfires and braking penalties, causing rivals to overtake you on hairpin turns and straightaways. Drafting behind rival neon cars grants slipstream speed bonuses when typing matching vocabulary without errors.",
    "skillsTrained": "Ghost Racer develops sustained paragraph stamina and realistic speed endurance. By visualizing your performance as a car moving relative to competitive benchmarks, it teaches you how small accuracy dips dramatically affect your overall average speed compared to steady, error-free cruising. Racing against ghost benchmarks establishes realistic pacing expectations, teaching sustainable speed over reckless sprints.",
    "strategy": "Treat the race like professional driving: smooth is fast. Avoid aggressive sprints that lead to typos on punctuation or capital letters, as braking penalties cost seconds on the track. Settle into a high-efficiency cruising speed on long straights and maintain absolute accuracy through technical corner sequences."
  },
  "fruit-fury": {
    "name": "Fruit Fury",
    "headline": "Fast-Paced Single-Letter Reflexes in Fruit Fury",
    "overview": "Fruit Fury is a fast-paced reflex arcade game inspired by mobile slicing classics. Fresh fruits inscribed with individual letters and numbers are launched into the air in soaring parabolic arcs. Type the corresponding keys to slice fruits before they fall off-screen, while strictly avoiding explosive bombs.",
    "mechanics": "Fruits launch rapidly from the bottom of the cabinet in unpredictable clusters. Pressing the matching key immediately triggers a ninja blade slice across that fruit. Black skull bombs occasionally launch alongside fruits; pressing a bomb's designated letter detonates the explosive and penalizes your score and life count.",
    "skillsTrained": "Fruit Fury isolates single-key tactile reflexes and selective inhibitory motor control. It forces typists to overcome hunt-and-peck latency by demanding sub-200-millisecond key actuation purely by touch. It also trains cognitive inhibition—the ability to rapidly stop an initiated keystroke upon recognizing a hazardous bomb symbol.",
    "strategy": "Anchor your hands securely on the home row (ASDF JKL;) and let your peripheral vision register incoming letter locations. Never spam keys blindly: verify that a flying object is a fruit rather than a bomb before flexing the finger. Focus on slicing fruits at the peak of their parabolic arc where vertical velocity is lowest."
  },
  "rakshasa-war": {
    "name": "Typebound: The Last Dawn",
    "headline": "Dark-Fantasy Typing Combat in Typebound",
    "overview": "Typebound: The Last Dawn is HeroTyping's epic 3D tactical combat campaign. Command a lone keyboard warrior defending eight fallen kingdoms against legions of armored revenants, flying wraiths, and undead warlords across escalating battlefields.",
    "mechanics": "Type an approaching enemy's initial letter to lock targeting, then execute its assigned combat word to deliver sword strikes and magical projectiles. Defeating adversaries charges your combat energy meter, unlocking powerful specials: Shockwave (1), Frost Nova (2), and Emberstorm (3). Boss encounters culminate in dramatic multi-phase execution sentences. Elemental runes dropped by vanquished commanders replenish mana reserves, enabling strategic activation of battlefield abilities.",
    "skillsTrained": "Typebound develops tactical prioritization and complex multi-row keyboard dexterity under pressure. Players must evaluate conflicting threats—such as fast runners versus armored brutes—and choose optimal typing order while managing special ability hotkeys on the number row. Managing hotkeys alongside rapid alphanumeric typing develops complete full-keyboard dexterity and tactical presence.",
    "strategy": "Identify high-threat enemy archetypes immediately upon spawning. Eliminate ranged necromancers and charging wraiths first to preserve your health pool. Save special combat energy for dense swarms or boss shield phases, and maintain clean typing rhythm to build maximum score multipliers."
  },
  "type-before-death": {
    "name": "Type Before Death",
    "headline": "Surviving the Horde in Type Before Death",
    "overview": "Type Before Death is a cinematic zombie survival typing experience set within a collapsing procedural metropolis. As the final barricade defender, you must type rapidly and accurately to convert words into rifle rounds, shotgun blasts, and artillery strikes against swarming undead legions.",
    "mechanics": "Zombies advance down urban corridors in three escalating waves. Each threat displays a tactical word: type the first letter to engage, then complete the word cleanly to neutralize the target. Continuous accuracy builds your Overdrive meter, while frequent typos overheat your weapon and cause critical mechanical jams. Tactical ammunition crates appear periodically; typing their bonus phrases clears the entire active defense lane instantly.",
    "skillsTrained": "This survival shooter trains cold-blooded typing accuracy under extreme survival pressure. It forces typists to maintain relaxed muscle posture and steady breathing while grotesque monsters sprint toward the screen, developing an unshakeable focus applicable to high-stakes typing tests. Surviving relentless zombie hordes trains physical relaxation techniques, preventing wrist fatigue during extended typing sessions.",
    "strategy": "Target sprint runners and toxic spitters first, as they reach the barricade before slow brutes. When weapon heat rises, slow down slightly to guarantee 100% precision on the next two words to vent heat safely. Select field upgrades that complement your natural typing strengths, such as expanded combo windows."
  }
};

export function GameSeoSection({ gameId, locale = "en" }: { gameId: GameId; locale?: string }) {
  const data = GAME_SEO_DATA[gameId];
  if (!data) return null;

  const homeHref = locale === "en" ? "/" : `/${locale}`;
  const lessonsHref = locale === "en" ? "/lessons" : `/${locale}/lessons`;
  const gamesHref = locale === "en" ? "/games" : `/${locale}/games`;
  const speedGuideHref = locale === "en" ? "/guides/how-to-improve-typing-speed" : `/${locale}/guides/how-to-improve-typing-speed`;

  return (
    <section className="mt-14 w-full max-w-4xl border-t border-border/70 pt-10 text-sub">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-xl font-black uppercase tracking-tight text-foreground sm:text-2xl">
            {data.headline}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-sub/90">
            {data.overview}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border/60 bg-sub-alt/10 p-5 text-xs leading-relaxed text-sub">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground mb-2">
              Arcade Mechanics &amp; Rules
            </h3>
            <p>{data.mechanics}</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-sub-alt/10 p-5 text-xs leading-relaxed text-sub">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground mb-2">
              Typing Skills Trained
            </h3>
            <p>{data.skillsTrained}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-sub-alt/10 p-5 text-xs leading-relaxed text-sub">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground mb-2">
            High-Score Keyboard Strategy
          </h3>
          <p>{data.strategy}</p>
        </div>

        <div className="rounded-xl border border-border/40 bg-sub-alt/5 p-4 text-xs text-sub">
          <p>
            Looking to sharpen your core fundamentals before setting a new arcade high score? Practice targeted drills in our{" "}
            <Link href={lessonsHref} className="text-accent underline underline-offset-2 hover:text-foreground">
              touch typing lessons
            </Link>
            , benchmark your raw WPM on the{" "}
            <Link href={homeHref} className="text-accent underline underline-offset-2 hover:text-foreground">
              free typing test
            </Link>
            , explore techniques in the{" "}
            <Link href={speedGuideHref} className="text-accent underline underline-offset-2 hover:text-foreground">
              typing speed guide
            </Link>
            , or discover more challenges in the{" "}
            <Link href={gamesHref} className="text-accent underline underline-offset-2 hover:text-foreground">
              typing arcade hub
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
