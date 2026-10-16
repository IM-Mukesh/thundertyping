// Structured educational SEO content for all 28 HeroTyping lessons.
// Provides finger map biomechanics, 3 common mistakes, 3-step practice sequence,
// pass criteria, and click-worthy meta descriptions for search crawlers.

export interface LessonSeoData {
  id: string;
  slug: string;
  name: string;
  keys: string[];
  metaDescription: string;
  summary: string;
  fingerMap: string;
  mistakes: string[];
  sequence: string[];
  passCriteria: string;
}

export const LESSON_SEO_DATA: Record<string, LessonSeoData> = {
  "home-row-f-j": {
  "id": "home-row-left",
  "slug": "home-row-f-j",
  "name": "Home Row: F & J Anchors",
  "keys": [
    "f",
    "j",
    " "
  ],
  "metaDescription": "Master touch typing anchors F and J on HeroTyping. Learn tactile homing bumps, correct index finger placement, and essential home row positioning.",
  "summary": "Establish the definitive tactile foundation for all touch typing by calibrating your index fingers to the physical homing nibs on F and J. These two reference anchors provide spatial orientation for every subsequent key reach.",
  "fingerMap": "Rest your left index finger gently on F and your right index finger on J. Standard keyboards feature raised tactile ridges or nibs molded into these two keycaps. Your thumbs float lightly above the spacebar without exerting downward pressure. Maintain neutral wrist alignment straight with your forearms, keeping palms hovering slightly above the desk surface rather than resting heavily on the desk edge.",
  "mistakes": [
    "Glancing down at hands rather than relying on tactile bumps to verify home position, which delays muscle memory development.",
    "Resting wrists or palm heels heavily on the desk edge, restricting tendon glide and inducing early hand fatigue.",
    "Striking the spacebar with index fingers instead of utilizing a gentle, downward thumb tap with either hand."
  ],
  "sequence": [
    "Tactile Calibration: Close your eyes, place hands in your lap, and bring index fingers up to locate F and J purely by feel in under one second.",
    "Isolation Drills: Execute rhythmic alternating taps (f j f j) focusing on clean key actuation, minimal finger travel, and crisp release without wrist bobbing.",
    "Flow & Space Integration: Type alternating anchor combinations with spacebar cadence (f f space j j space, fjf jfj) until rhythm feels effortless and unhesitating."
  ],
  "passCriteria": "Achieve at least 95% accuracy across all drill steps. You must demonstrate instantaneous anchor recovery by touch alone within one second, maintaining relaxed shoulder posture and floating wrists throughout."
},
  "home-row-left": {
  "id": "home-row-left",
  "slug": "home-row-f-j",
  "name": "Home Row: F & J Anchors",
  "keys": [
    "f",
    "j",
    " "
  ],
  "metaDescription": "Master touch typing anchors F and J on HeroTyping. Learn tactile homing bumps, correct index finger placement, and essential home row positioning.",
  "summary": "Establish the definitive tactile foundation for all touch typing by calibrating your index fingers to the physical homing nibs on F and J. These two reference anchors provide spatial orientation for every subsequent key reach.",
  "fingerMap": "Rest your left index finger gently on F and your right index finger on J. Standard keyboards feature raised tactile ridges or nibs molded into these two keycaps. Your thumbs float lightly above the spacebar without exerting downward pressure. Maintain neutral wrist alignment straight with your forearms, keeping palms hovering slightly above the desk surface rather than resting heavily on the desk edge.",
  "mistakes": [
    "Glancing down at hands rather than relying on tactile bumps to verify home position, which delays muscle memory development.",
    "Resting wrists or palm heels heavily on the desk edge, restricting tendon glide and inducing early hand fatigue.",
    "Striking the spacebar with index fingers instead of utilizing a gentle, downward thumb tap with either hand."
  ],
  "sequence": [
    "Tactile Calibration: Close your eyes, place hands in your lap, and bring index fingers up to locate F and J purely by feel in under one second.",
    "Isolation Drills: Execute rhythmic alternating taps (f j f j) focusing on clean key actuation, minimal finger travel, and crisp release without wrist bobbing.",
    "Flow & Space Integration: Type alternating anchor combinations with spacebar cadence (f f space j j space, fjf jfj) until rhythm feels effortless and unhesitating."
  ],
  "passCriteria": "Achieve at least 95% accuracy across all drill steps. You must demonstrate instantaneous anchor recovery by touch alone within one second, maintaining relaxed shoulder posture and floating wrists throughout."
},
  "home-row-d-k": {
  "id": "home-row-right",
  "slug": "home-row-d-k",
  "name": "Home Row: D & K Middle Fingers",
  "keys": [
    "d",
    "k",
    "f",
    "j",
    " "
  ],
  "metaDescription": "Learn home row D and K middle finger typing mechanics on HeroTyping. Build muscle memory, eliminate finger lifting, and master foundational 4-key flow.",
  "summary": "Expand your home row base by activating the left middle finger on D and the right middle finger on K while preserving steady index finger anchors. This establishes the core four-finger cluster responsible for the central home row zone.",
  "fingerMap": "Your left middle finger curves to rest on D directly to the left of F, while your right middle finger rests on K directly to the right of J. Keep all knuckles arched in a natural open-hand curve, as if lightly holding a tennis ball. Both index fingers must stay lightly anchored on their homing nibs without tensing or floating upward during middle finger strikes.",
  "mistakes": [
    "Lifting index fingers into the air whenever pressing D or K, which destabilizes your spatial hand orientation and forces visual searching.",
    "Flattening the middle fingers straight across the keycaps rather than keeping the distal interphalangeal joints gently arched for optimal leverage.",
    "Reaching for D with the index finger due to residual hunt-and-peck motor habits instead of trusting the dedicated middle finger pathway."
  ],
  "sequence": [
    "Four-Finger Alignment: Verify your four-finger foundation (D, F on the left hand; J, K on the right hand) with eyes fixed firmly on the screen.",
    "Paired Finger Strikes: Practice paired alternating strikes (d k d k, f d j k) maintaining equal acoustic loudness and keypress pressure across both hands.",
    "Cadence & Word Syllables: Drill four-key alternating patterns (df jk, fkd jdf, ddf kkj) at a steady metronomic tempo until transitions feel completely seamless and natural."
  ],
  "passCriteria": "Attain 94%+ accuracy across all drill blocks without a single glance at the keyboard. Ensure keystroke latency between D and K is within 40 milliseconds of your baseline F and J speed, with zero wrist deviation."
},
  "home-row-right": {
  "id": "home-row-right",
  "slug": "home-row-d-k",
  "name": "Home Row: D & K Middle Fingers",
  "keys": [
    "d",
    "k",
    "f",
    "j",
    " "
  ],
  "metaDescription": "Learn home row D and K middle finger typing mechanics on HeroTyping. Build muscle memory, eliminate finger lifting, and master foundational 4-key flow.",
  "summary": "Expand your home row base by activating the left middle finger on D and the right middle finger on K while preserving steady index finger anchors. This establishes the core four-finger cluster responsible for the central home row zone.",
  "fingerMap": "Your left middle finger curves to rest on D directly to the left of F, while your right middle finger rests on K directly to the right of J. Keep all knuckles arched in a natural open-hand curve, as if lightly holding a tennis ball. Both index fingers must stay lightly anchored on their homing nibs without tensing or floating upward during middle finger strikes.",
  "mistakes": [
    "Lifting index fingers into the air whenever pressing D or K, which destabilizes your spatial hand orientation and forces visual searching.",
    "Flattening the middle fingers straight across the keycaps rather than keeping the distal interphalangeal joints gently arched for optimal leverage.",
    "Reaching for D with the index finger due to residual hunt-and-peck motor habits instead of trusting the dedicated middle finger pathway."
  ],
  "sequence": [
    "Four-Finger Alignment: Verify your four-finger foundation (D, F on the left hand; J, K on the right hand) with eyes fixed firmly on the screen.",
    "Paired Finger Strikes: Practice paired alternating strikes (d k d k, f d j k) maintaining equal acoustic loudness and keypress pressure across both hands.",
    "Cadence & Word Syllables: Drill four-key alternating patterns (df jk, fkd jdf, ddf kkj) at a steady metronomic tempo until transitions feel completely seamless and natural."
  ],
  "passCriteria": "Attain 94%+ accuracy across all drill blocks without a single glance at the keyboard. Ensure keystroke latency between D and K is within 40 milliseconds of your baseline F and J speed, with zero wrist deviation."
},
  "home-row-s-l": {
  "id": "home-row-combined",
  "slug": "home-row-s-l",
  "name": "Home Row: S & L Ring Fingers",
  "keys": [
    "s",
    "l",
    "d",
    "k",
    "f",
    "j",
    " "
  ],
  "metaDescription": "Develop ring finger independence on home row S and L keys. HeroTyping tutorials to overcome ring-middle finger tethering and build smooth typing cadence.",
  "summary": "Cultivate neurological finger independence on S and L, overcoming the anatomical extensor tendon tethering between the ring and middle fingers. This unlocks fluid lateral hand coordination and smooth multi-finger transitions.",
  "fingerMap": "Place your left ring finger onto S and your right ring finger onto L. The human hand shares common extensor tendons between the ring and middle fingers (the juncturae tendinum), making isolated ring finger movement feel unnatural at first. Combat this natural anatomical resistance by keeping your wrists stationary and initiating keystrokes purely from the metacarpophalangeal knuckles with gentle, deliberate intent.",
  "mistakes": [
    "Sympathetic twitching or lifting of the adjacent middle finger when attempting to strike S or L independently, signaling unnecessary isometric muscle tension.",
    "Tilting or rolling the entire hand outward toward the pinky edge to press S or L instead of articulating cleanly from the finger knuckle.",
    "Applying excessive downward muscular force on S and L to compensate for natural extensor tendon resistance, leading to early hand fatigue."
  ],
  "sequence": [
    "Independence Activation: Gently alternate between middle and ring fingers on each hand (d s d s, k l k l) at a slow, deliberate pace until movement feels isolated.",
    "Six-Key Spatial Drills: Type progressive inward and outward home-row sequences (s d f, l k j, s f l j) ensuring continuous rhythmic cadence without hesitations.",
    "Cross-Hand Word Combinations: Practice common English syllables combining S, D, F, J, K, and L (flask, falls, lads, salad) without breaking tactile contact with your anchors."
  ],
  "passCriteria": "Complete the module with 93%+ accuracy. Demonstrate total suppression of sympathetic middle-finger lifting, keeping both index anchors stable within 2 millimeters of their home positions at all times."
},
  "home-row-combined": {
  "id": "home-row-combined",
  "slug": "home-row-s-l",
  "name": "Home Row: S & L Ring Fingers",
  "keys": [
    "s",
    "l",
    "d",
    "k",
    "f",
    "j",
    " "
  ],
  "metaDescription": "Develop ring finger independence on home row S and L keys. HeroTyping tutorials to overcome ring-middle finger tethering and build smooth typing cadence.",
  "summary": "Cultivate neurological finger independence on S and L, overcoming the anatomical extensor tendon tethering between the ring and middle fingers. This unlocks fluid lateral hand coordination and smooth multi-finger transitions.",
  "fingerMap": "Place your left ring finger onto S and your right ring finger onto L. The human hand shares common extensor tendons between the ring and middle fingers (the juncturae tendinum), making isolated ring finger movement feel unnatural at first. Combat this natural anatomical resistance by keeping your wrists stationary and initiating keystrokes purely from the metacarpophalangeal knuckles with gentle, deliberate intent.",
  "mistakes": [
    "Sympathetic twitching or lifting of the adjacent middle finger when attempting to strike S or L independently, signaling unnecessary isometric muscle tension.",
    "Tilting or rolling the entire hand outward toward the pinky edge to press S or L instead of articulating cleanly from the finger knuckle.",
    "Applying excessive downward muscular force on S and L to compensate for natural extensor tendon resistance, leading to early hand fatigue."
  ],
  "sequence": [
    "Independence Activation: Gently alternate between middle and ring fingers on each hand (d s d s, k l k l) at a slow, deliberate pace until movement feels isolated.",
    "Six-Key Spatial Drills: Type progressive inward and outward home-row sequences (s d f, l k j, s f l j) ensuring continuous rhythmic cadence without hesitations.",
    "Cross-Hand Word Combinations: Practice common English syllables combining S, D, F, J, K, and L (flask, falls, lads, salad) without breaking tactile contact with your anchors."
  ],
  "passCriteria": "Complete the module with 93%+ accuracy. Demonstrate total suppression of sympathetic middle-finger lifting, keeping both index anchors stable within 2 millimeters of their home positions at all times."
},
  "home-row-a-semicolon": {
  "id": "home-row-words",
  "slug": "home-row-a-semicolon",
  "name": "Home Row: A & Semicolon Pinkies",
  "keys": [
    "a",
    ";",
    "s",
    "d",
    "f",
    "j",
    "k",
    "l",
    " "
  ],
  "metaDescription": "Master home row outer edges with A and semicolon pinky typing drills. Build pinky endurance, prevent hand twisting, and complete the 8-finger anchor.",
  "summary": "Complete the entire eight-finger home row foundation by training the left pinky on A and the right pinky on semicolon with proper biomechanics. This establishes full horizontal coverage of the foundational guide row.",
  "fingerMap": "Place your left pinky on A and your right pinky on the semicolon key (;). Because the pinky finger possesses the shortest skeletal reach and smallest muscular group, typists often unconsciously twist their entire wrists outward (ulnar deviation) to strike these keys. Maintain your wrist in strict neutral alignment and depress A and semicolon with light, vertical finger flexion rather than swinging hands.",
  "mistakes": [
    "Swiveling wrists outward toward desk edges (ulnar deviation) to reach A and semicolon instead of curling the pinky downward naturally.",
    "Overstriking A and semicolon with excessive arm weight because the pinky feels weaker than adjacent fingers, slowing return speed.",
    "Abandoning the right pinky anchor entirely and ignoring semicolon in favor of resting on L, leading to asymmetric hand positioning."
  ],
  "sequence": [
    "Pinky Calibration: Execute isolated taps on A with left pinky and semicolon with right pinky, feeling lateral key boundaries without hand movement.",
    "Full Home Row Scale: Type the complete eight-key home row spectrum sequentially from left to right (a s d f j k l ;) and reverse (; l k j f d s a) at an even tempo.",
    "Full Home-Row Vocabulary: Drill genuine English home-row words (all, fall, ask, flash, salad, alas, salsa) ensuring even pacing and identical keypress volume across all eight fingers."
  ],
  "passCriteria": "Achieve 92%+ accuracy across all drill steps. Maintain neutral wrist alignment with zero outward hand rotation, confirming that all eight fingers rest securely on their respective home keys at the end of each sequence."
},
  "home-row-words": {
  "id": "home-row-words",
  "slug": "home-row-a-semicolon",
  "name": "Home Row: A & Semicolon Pinkies",
  "keys": [
    "a",
    ";",
    "s",
    "d",
    "f",
    "j",
    "k",
    "l",
    " "
  ],
  "metaDescription": "Master home row outer edges with A and semicolon pinky typing drills. Build pinky endurance, prevent hand twisting, and complete the 8-finger anchor.",
  "summary": "Complete the entire eight-finger home row foundation by training the left pinky on A and the right pinky on semicolon with proper biomechanics. This establishes full horizontal coverage of the foundational guide row.",
  "fingerMap": "Place your left pinky on A and your right pinky on the semicolon key (;). Because the pinky finger possesses the shortest skeletal reach and smallest muscular group, typists often unconsciously twist their entire wrists outward (ulnar deviation) to strike these keys. Maintain your wrist in strict neutral alignment and depress A and semicolon with light, vertical finger flexion rather than swinging hands.",
  "mistakes": [
    "Swiveling wrists outward toward desk edges (ulnar deviation) to reach A and semicolon instead of curling the pinky downward naturally.",
    "Overstriking A and semicolon with excessive arm weight because the pinky feels weaker than adjacent fingers, slowing return speed.",
    "Abandoning the right pinky anchor entirely and ignoring semicolon in favor of resting on L, leading to asymmetric hand positioning."
  ],
  "sequence": [
    "Pinky Calibration: Execute isolated taps on A with left pinky and semicolon with right pinky, feeling lateral key boundaries without hand movement.",
    "Full Home Row Scale: Type the complete eight-key home row spectrum sequentially from left to right (a s d f j k l ;) and reverse (; l k j f d s a) at an even tempo.",
    "Full Home-Row Vocabulary: Drill genuine English home-row words (all, fall, ask, flash, salad, alas, salsa) ensuring even pacing and identical keypress volume across all eight fingers."
  ],
  "passCriteria": "Achieve 92%+ accuracy across all drill steps. Maintain neutral wrist alignment with zero outward hand rotation, confirming that all eight fingers rest securely on their respective home keys at the end of each sequence."
},
  "home-row-g-h": {
  "id": "top-row-left",
  "slug": "home-row-g-h",
  "name": "Home Row: G & H Center Reaches",
  "keys": [
    "g",
    "h",
    "a",
    "s",
    "d",
    "f",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Learn G and H horizontal index finger reaches on HeroTyping. Master center column extensions and instantaneous snaps back to home row anchors.",
  "summary": "Master horizontal index finger reaches into the keyboard center column for G and H, establishing rapid snap-back recovery to F and J anchors. This bridges the central gap between the left and right hand typing zones.",
  "fingerMap": "Reach your left index finger horizontally inward from F to strike G, and your right index finger horizontally inward from J to strike H. The remaining three fingers on each hand (ASD on the left, KL; on the right) must remain stationary in their home row pockets. The moment the key actuates, immediately snap your index finger back to its tactile home anchor on F or J without lingering.",
  "mistakes": [
    "Dragging the entire hand toward the center of the keyboard rather than pivoting purely from the index finger's knuckle, which disorients resting anchors.",
    "Leaving the index finger hovering or lingering over G or H instead of immediately returning to F or J, which delays subsequent letter execution.",
    "Crossing hands across the keyboard centerline, such as attempting to hit G with the right hand or H with the left hand."
  ],
  "sequence": [
    "Lateral Extension Warmup: Practice horizontal reaches (f-g-f and j-h-j) at a controlled tempo, noting the precise lateral travel distance required for actuation.",
    "Center-Column Isolation: Execute alternating center-reach bursts (f g f, j h j, g h g h) focusing on instant snap-back recovery to F and J anchors.",
    "Real-World Vocabulary Drills: Type common English words containing center reaches (half, glad, flag, dash, flash, glass, shall) with uninterrupted rhythmic flow."
  ],
  "passCriteria": "Attain 92%+ accuracy across all drill exercises. Your index fingers must return to F and J before the subsequent keystroke is initiated, with no lateral hand displacement or wrist dragging."
},
  "top-row-left": {
  "id": "top-row-left",
  "slug": "home-row-g-h",
  "name": "Home Row: G & H Center Reaches",
  "keys": [
    "g",
    "h",
    "a",
    "s",
    "d",
    "f",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Learn G and H horizontal index finger reaches on HeroTyping. Master center column extensions and instantaneous snaps back to home row anchors.",
  "summary": "Master horizontal index finger reaches into the keyboard center column for G and H, establishing rapid snap-back recovery to F and J anchors. This bridges the central gap between the left and right hand typing zones.",
  "fingerMap": "Reach your left index finger horizontally inward from F to strike G, and your right index finger horizontally inward from J to strike H. The remaining three fingers on each hand (ASD on the left, KL; on the right) must remain stationary in their home row pockets. The moment the key actuates, immediately snap your index finger back to its tactile home anchor on F or J without lingering.",
  "mistakes": [
    "Dragging the entire hand toward the center of the keyboard rather than pivoting purely from the index finger's knuckle, which disorients resting anchors.",
    "Leaving the index finger hovering or lingering over G or H instead of immediately returning to F or J, which delays subsequent letter execution.",
    "Crossing hands across the keyboard centerline, such as attempting to hit G with the right hand or H with the left hand."
  ],
  "sequence": [
    "Lateral Extension Warmup: Practice horizontal reaches (f-g-f and j-h-j) at a controlled tempo, noting the precise lateral travel distance required for actuation.",
    "Center-Column Isolation: Execute alternating center-reach bursts (f g f, j h j, g h g h) focusing on instant snap-back recovery to F and J anchors.",
    "Real-World Vocabulary Drills: Type common English words containing center reaches (half, glad, flag, dash, flash, glass, shall) with uninterrupted rhythmic flow."
  ],
  "passCriteria": "Attain 92%+ accuracy across all drill exercises. Your index fingers must return to F and J before the subsequent keystroke is initiated, with no lateral hand displacement or wrist dragging."
},
  "home-row-mastery": {
  "id": "top-row-right",
  "slug": "home-row-mastery",
  "name": "Consolidation: Home Row Mastery",
  "keys": [
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Consolidate your home row touch typing proficiency on HeroTyping. Build rhythmic speed, eliminate pauses, and achieve effortless ten-key automaticity.",
  "summary": "Integrate all ten home row keys into seamless, automated muscle memory, eliminating cognitive delays and establishing steady typing cadence. This milestone prepares your hands for vertical reaches across the entire keyboard.",
  "fingerMap": "All eight fingers rest comfortably in their home pockets: A, S, D, F for the left hand and J, K, L, ; for the right hand, with thumbs hovering over the spacebar. G and H are accessed by quick lateral index reaches. Maintain a light, floating posture where your hands remain relaxed, balanced, and free from isometric muscle tension or rigid wrist bracing.",
  "mistakes": [
    "Rushing familiar two-letter combinations and stumbling on less common sequences, creating uneven, burst-and-stall typing cadence that harms accuracy.",
    "Allowing fingers that are not actively typing to lift high into the air (flying fingers) rather than hovering calmly half a centimeter above their keys.",
    "Glancing downward at the keyboard whenever encountering an unfamiliar home-row word combination rather than trusting your tactile spatial map."
  ],
  "sequence": [
    "Full Spectrum Fluency: Type alternating left-hand and right-hand home row clusters (asdf hjkl, fdsa ;lkj) to warm up neuromuscular pathways and coordinate bilateral motor control.",
    "Complex Word Flow: Type rich home-row paragraphs and phrases (a sad lad had a glad flash; salads fall as flags sash) maintaining uniform keystroke latency throughout.",
    "Stamina Assessment: Complete a continuous two-minute home-row endurance drill without pausing, hesitating, or checking hand positions visually."
  ],
  "passCriteria": "Achieve a minimum of 25 WPM with 95%+ accuracy across the consolidation challenge. Retain smooth, metronomic cadence with zero visual glances and no wrist or shoulder fatigue."
},
  "top-row-right": {
  "id": "top-row-right",
  "slug": "home-row-mastery",
  "name": "Consolidation: Home Row Mastery",
  "keys": [
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Consolidate your home row touch typing proficiency on HeroTyping. Build rhythmic speed, eliminate pauses, and achieve effortless ten-key automaticity.",
  "summary": "Integrate all ten home row keys into seamless, automated muscle memory, eliminating cognitive delays and establishing steady typing cadence. This milestone prepares your hands for vertical reaches across the entire keyboard.",
  "fingerMap": "All eight fingers rest comfortably in their home pockets: A, S, D, F for the left hand and J, K, L, ; for the right hand, with thumbs hovering over the spacebar. G and H are accessed by quick lateral index reaches. Maintain a light, floating posture where your hands remain relaxed, balanced, and free from isometric muscle tension or rigid wrist bracing.",
  "mistakes": [
    "Rushing familiar two-letter combinations and stumbling on less common sequences, creating uneven, burst-and-stall typing cadence that harms accuracy.",
    "Allowing fingers that are not actively typing to lift high into the air (flying fingers) rather than hovering calmly half a centimeter above their keys.",
    "Glancing downward at the keyboard whenever encountering an unfamiliar home-row word combination rather than trusting your tactile spatial map."
  ],
  "sequence": [
    "Full Spectrum Fluency: Type alternating left-hand and right-hand home row clusters (asdf hjkl, fdsa ;lkj) to warm up neuromuscular pathways and coordinate bilateral motor control.",
    "Complex Word Flow: Type rich home-row paragraphs and phrases (a sad lad had a glad flash; salads fall as flags sash) maintaining uniform keystroke latency throughout.",
    "Stamina Assessment: Complete a continuous two-minute home-row endurance drill without pausing, hesitating, or checking hand positions visually."
  ],
  "passCriteria": "Achieve a minimum of 25 WPM with 95%+ accuracy across the consolidation challenge. Retain smooth, metronomic cadence with zero visual glances and no wrist or shoulder fatigue."
},
  "top-row-e-i": {
  "id": "top-row-combined",
  "slug": "top-row-e-i",
  "name": "Top Row: E & I Vowels",
  "keys": [
    "e",
    "i",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master top row vowels E and I on HeroTyping. Learn middle finger upward reach mechanics, tactile recovery, and high-frequency English syllable drills.",
  "summary": "Unlock the two most frequent vowels in the English language, E and I, by training upward middle finger reaches from your home row anchors. Mastering these two keys immediately increases the variety of real words you can type without looking.",
  "fingerMap": "Extend your left middle finger upward from D to strike E, and your right middle finger upward from K to strike I. The reach is an upward and slightly inward diagonal arc. Maintain index finger contact on F and J to preserve your spatial reference frame, and retract the middle finger immediately upon key activation so that home row positioning remains intact.",
  "mistakes": [
    "Lifting your entire hand off the keyboard and floating your wrist forward rather than flexing upward cleanly from the middle finger knuckle.",
    "Confusing E (left middle finger) with I (right middle finger) during rapid typing due to mirror-movement cognitive interference between hands.",
    "Striking E with the index finger because former hunt-and-peck typists heavily favor the index finger for top-row reaches, violating finger discipline."
  ],
  "sequence": [
    "Diagonal Reach Calibration: Execute slow, deliberate upward extensions (d-e-d and k-i-k) focusing on the exact angle and travel distance required for smooth actuation.",
    "Vowel Alternate Drills: Type high-frequency vowel pairings and alternating patterns (die, kid, lie, fed, side, file, life) at an even, controlled tempo.",
    "Sentence Integration: Drill realistic sentences rich in E and I (she likes fresh figs; he hides inside) focusing on uninterrupted rhythmic continuity and instant anchor return."
  ],
  "passCriteria": "Attain 93%+ accuracy on all exercise blocks. Middle fingers must reliably return to D and K after every strike, with index fingers remaining securely anchored on F and J throughout."
},
  "top-row-combined": {
  "id": "top-row-combined",
  "slug": "top-row-e-i",
  "name": "Top Row: E & I Vowels",
  "keys": [
    "e",
    "i",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master top row vowels E and I on HeroTyping. Learn middle finger upward reach mechanics, tactile recovery, and high-frequency English syllable drills.",
  "summary": "Unlock the two most frequent vowels in the English language, E and I, by training upward middle finger reaches from your home row anchors. Mastering these two keys immediately increases the variety of real words you can type without looking.",
  "fingerMap": "Extend your left middle finger upward from D to strike E, and your right middle finger upward from K to strike I. The reach is an upward and slightly inward diagonal arc. Maintain index finger contact on F and J to preserve your spatial reference frame, and retract the middle finger immediately upon key activation so that home row positioning remains intact.",
  "mistakes": [
    "Lifting your entire hand off the keyboard and floating your wrist forward rather than flexing upward cleanly from the middle finger knuckle.",
    "Confusing E (left middle finger) with I (right middle finger) during rapid typing due to mirror-movement cognitive interference between hands.",
    "Striking E with the index finger because former hunt-and-peck typists heavily favor the index finger for top-row reaches, violating finger discipline."
  ],
  "sequence": [
    "Diagonal Reach Calibration: Execute slow, deliberate upward extensions (d-e-d and k-i-k) focusing on the exact angle and travel distance required for smooth actuation.",
    "Vowel Alternate Drills: Type high-frequency vowel pairings and alternating patterns (die, kid, lie, fed, side, file, life) at an even, controlled tempo.",
    "Sentence Integration: Drill realistic sentences rich in E and I (she likes fresh figs; he hides inside) focusing on uninterrupted rhythmic continuity and instant anchor return."
  ],
  "passCriteria": "Attain 93%+ accuracy on all exercise blocks. Middle fingers must reliably return to D and K after every strike, with index fingers remaining securely anchored on F and J throughout."
},
  "top-row-r-u": {
  "id": "top-row-words",
  "slug": "top-row-r-u",
  "name": "Top Row: R & U Index Reaches",
  "keys": [
    "r",
    "u",
    "e",
    "i",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master R and U top row index finger reaches. Learn upward diagonal extensions, rapid anchor recovery, and high-frequency English word patterns.",
  "summary": "Train upward index finger extensions to R and U, expanding your high-speed reach capacity while maintaining rock-solid home row anchors. R and U unlock essential English consonant blends and frequent verbal prefixes across formal and casual writing.",
  "fingerMap": "Extend your left index finger diagonally upward and slightly leftward from F to strike R. Extend your right index finger diagonally upward and slightly leftward from J to strike U. Because index fingers possess the highest dexterity and range of motion, ensure the movement originates purely from the knuckle without lifting palms or shifting elbow positions.",
  "mistakes": [
    "Overextending the finger and accidentally clipping T instead of R, or Y instead of U due to imprecise angular extension during rapid reaches.",
    "Allowing middle and ring fingers to lift high off the home row when reaching upward with the index finger, losing spatial orientation.",
    "Failing to snap back to F and J before preparing for the subsequent keystroke, resulting in delayed subsequent strikes and sluggish typing cadence."
  ],
  "sequence": [
    "Index Reach Warmup: Practice clean upward extensions (f-r-f and j-u-j) ensuring crisp key contact, light actuation, and instant retraction to home anchors.",
    "Phoneme Drilling: Practice essential English digraphs and consonant blends (er, ur, re, ru, red, run, rude, fire, cure) at a steady, metronomic tempo.",
    "Multi-Row Sentence Practice: Type full phrases combining home row and top row keys (furry red rugs; sure rulers rule) maintaining consistent stroke timing across all letter transitions."
  ],
  "passCriteria": "Achieve at least 93% accuracy across all exercise steps. Demonstrate immediate snap-back recovery to F and J with zero forearm or elbow displacement during the reach."
},
  "top-row-words": {
  "id": "top-row-words",
  "slug": "top-row-r-u",
  "name": "Top Row: R & U Index Reaches",
  "keys": [
    "r",
    "u",
    "e",
    "i",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master R and U top row index finger reaches. Learn upward diagonal extensions, rapid anchor recovery, and high-frequency English word patterns.",
  "summary": "Train upward index finger extensions to R and U, expanding your high-speed reach capacity while maintaining rock-solid home row anchors. R and U unlock essential English consonant blends and frequent verbal prefixes across formal and casual writing.",
  "fingerMap": "Extend your left index finger diagonally upward and slightly leftward from F to strike R. Extend your right index finger diagonally upward and slightly leftward from J to strike U. Because index fingers possess the highest dexterity and range of motion, ensure the movement originates purely from the knuckle without lifting palms or shifting elbow positions.",
  "mistakes": [
    "Overextending the finger and accidentally clipping T instead of R, or Y instead of U due to imprecise angular extension during rapid reaches.",
    "Allowing middle and ring fingers to lift high off the home row when reaching upward with the index finger, losing spatial orientation.",
    "Failing to snap back to F and J before preparing for the subsequent keystroke, resulting in delayed subsequent strikes and sluggish typing cadence."
  ],
  "sequence": [
    "Index Reach Warmup: Practice clean upward extensions (f-r-f and j-u-j) ensuring crisp key contact, light actuation, and instant retraction to home anchors.",
    "Phoneme Drilling: Practice essential English digraphs and consonant blends (er, ur, re, ru, red, run, rude, fire, cure) at a steady, metronomic tempo.",
    "Multi-Row Sentence Practice: Type full phrases combining home row and top row keys (furry red rugs; sure rulers rule) maintaining consistent stroke timing across all letter transitions."
  ],
  "passCriteria": "Achieve at least 93% accuracy across all exercise steps. Demonstrate immediate snap-back recovery to F and J with zero forearm or elbow displacement during the reach."
},
  "top-row-t-y": {
  "id": "bottom-row-left",
  "slug": "top-row-t-y",
  "name": "Top Row: T & Y Upper Center",
  "keys": [
    "t",
    "y",
    "r",
    "u",
    "e",
    "i",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master top row T and Y long index reaches on HeroTyping. Learn upper-center diagonal extensions, anchor stabilization, and common English word flow.",
  "summary": "Conquer the longest index finger extensions on the top row, T and Y, combining upward reach with inward lateral travel without losing hand orientation. T is one of the most frequent consonants in the English language, making this a pivotal speed milestone.",
  "fingerMap": "Reach your left index finger diagonally upward and inward from F to strike T. Reach your right index finger diagonally upward and inward from J to strike Y. Because these keys require both vertical and horizontal extension, stabilize your hand with the resting fingers (ASD on the left, KL; on the right) without shifting your wrist position or lunging forward.",
  "mistakes": [
    "Reaching for Y with the left hand or T with the right hand, violating foundational keyboard hemisphere assignments and causing hand collisions.",
    "Lurching the whole hand forward into the keyboard rather than extending the index finger independently from the knuckle joint.",
    "Lingering on T or Y after actuation, which delays return to home row and creates severe lag on subsequent keystrokes."
  ],
  "sequence": [
    "Long Reach Warmup: Slowly alternate between anchors and upper-center keys (f-t-f and j-y-j) paying close attention to the compound diagonal travel distance.",
    "Alternate Hand Syllables: Practice common English patterns containing T and Y (the, try, yet, city, they, year, stay, rusty) with deliberate, balanced pacing.",
    "Prose Flow: Drill natural sentences emphasizing T and Y (they try to stay yet they rust; you tell the truth) maintaining smooth metronomic rhythm and instant recovery."
  ],
  "passCriteria": "Attain 92%+ accuracy across all drill exercises. Ensure the index finger immediately retracts to F or J after striking T or Y, with zero hand twisting or lateral elbow flare."
},
  "bottom-row-left": {
  "id": "bottom-row-left",
  "slug": "top-row-t-y",
  "name": "Top Row: T & Y Upper Center",
  "keys": [
    "t",
    "y",
    "r",
    "u",
    "e",
    "i",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master top row T and Y long index reaches on HeroTyping. Learn upper-center diagonal extensions, anchor stabilization, and common English word flow.",
  "summary": "Conquer the longest index finger extensions on the top row, T and Y, combining upward reach with inward lateral travel without losing hand orientation. T is one of the most frequent consonants in the English language, making this a pivotal speed milestone.",
  "fingerMap": "Reach your left index finger diagonally upward and inward from F to strike T. Reach your right index finger diagonally upward and inward from J to strike Y. Because these keys require both vertical and horizontal extension, stabilize your hand with the resting fingers (ASD on the left, KL; on the right) without shifting your wrist position or lunging forward.",
  "mistakes": [
    "Reaching for Y with the left hand or T with the right hand, violating foundational keyboard hemisphere assignments and causing hand collisions.",
    "Lurching the whole hand forward into the keyboard rather than extending the index finger independently from the knuckle joint.",
    "Lingering on T or Y after actuation, which delays return to home row and creates severe lag on subsequent keystrokes."
  ],
  "sequence": [
    "Long Reach Warmup: Slowly alternate between anchors and upper-center keys (f-t-f and j-y-j) paying close attention to the compound diagonal travel distance.",
    "Alternate Hand Syllables: Practice common English patterns containing T and Y (the, try, yet, city, they, year, stay, rusty) with deliberate, balanced pacing.",
    "Prose Flow: Drill natural sentences emphasizing T and Y (they try to stay yet they rust; you tell the truth) maintaining smooth metronomic rhythm and instant recovery."
  ],
  "passCriteria": "Attain 92%+ accuracy across all drill exercises. Ensure the index finger immediately retracts to F or J after striking T or Y, with zero hand twisting or lateral elbow flare."
},
  "top-row-w-o": {
  "id": "bottom-row-right",
  "slug": "top-row-w-o",
  "name": "Top Row: W & O Ring Reaches",
  "keys": [
    "w",
    "o",
    "t",
    "y",
    "r",
    "u",
    "e",
    "i",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master top row W and O ring finger typing mechanics on HeroTyping. Overcome ring finger stiffness, build upward reach fluency, and expand vocabulary.",
  "summary": "Train upward ring finger diagonal extensions to W and O, developing extensor flexibility and tactile accuracy on high-frequency English letterforms. This reach strengthens one of the naturally weaker fingers on each hand while expanding vocabulary.",
  "fingerMap": "Extend your left ring finger diagonally upward from S to strike W. Extend your right ring finger diagonally upward from L to strike O. Because the ring finger has limited natural mobility due to shared extensor tendons, execute this reach with a subtle forward hand tilt rather than straining the finger joint, while keeping the other fingers in close proximity to the home row.",
  "mistakes": [
    "Attempting to strike W with the middle finger or O with the middle finger due to weak ring finger confidence and poor neuromuscular habits.",
    "Lifting all other fingers high off the keyboard during the upward reach, completely losing tactile reference and spatial anchor orientation.",
    "Excessive downward force on key bottom-out, which can cause ring finger tendon irritation over extended typing practice sessions."
  ],
  "sequence": [
    "Ring Extension Calibration: Drill slow upward extensions (s-w-s and l-o-l) until the exact diagonal path becomes natural, relaxed, and effortless.",
    "High-Frequency Word Flow: Type rich English vocabulary featuring W and O (how, now, slow, wolf, grow, flow, world, down, allow) at a controlled, uniform tempo.",
    "Mixed-Row Combinations: Practice comprehensive sentences combining all learned keys (two slow wolves walk down the road) focusing on even keystroke rhythm across all finger pairs."
  ],
  "passCriteria": "Achieve 92%+ accuracy across all drill blocks. Ring fingers must retract smoothly to S and L, keeping keystroke latency consistent and preventing adjacent finger flare."
},
  "bottom-row-right": {
  "id": "bottom-row-right",
  "slug": "top-row-w-o",
  "name": "Top Row: W & O Ring Reaches",
  "keys": [
    "w",
    "o",
    "t",
    "y",
    "r",
    "u",
    "e",
    "i",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master top row W and O ring finger typing mechanics on HeroTyping. Overcome ring finger stiffness, build upward reach fluency, and expand vocabulary.",
  "summary": "Train upward ring finger diagonal extensions to W and O, developing extensor flexibility and tactile accuracy on high-frequency English letterforms. This reach strengthens one of the naturally weaker fingers on each hand while expanding vocabulary.",
  "fingerMap": "Extend your left ring finger diagonally upward from S to strike W. Extend your right ring finger diagonally upward from L to strike O. Because the ring finger has limited natural mobility due to shared extensor tendons, execute this reach with a subtle forward hand tilt rather than straining the finger joint, while keeping the other fingers in close proximity to the home row.",
  "mistakes": [
    "Attempting to strike W with the middle finger or O with the middle finger due to weak ring finger confidence and poor neuromuscular habits.",
    "Lifting all other fingers high off the keyboard during the upward reach, completely losing tactile reference and spatial anchor orientation.",
    "Excessive downward force on key bottom-out, which can cause ring finger tendon irritation over extended typing practice sessions."
  ],
  "sequence": [
    "Ring Extension Calibration: Drill slow upward extensions (s-w-s and l-o-l) until the exact diagonal path becomes natural, relaxed, and effortless.",
    "High-Frequency Word Flow: Type rich English vocabulary featuring W and O (how, now, slow, wolf, grow, flow, world, down, allow) at a controlled, uniform tempo.",
    "Mixed-Row Combinations: Practice comprehensive sentences combining all learned keys (two slow wolves walk down the road) focusing on even keystroke rhythm across all finger pairs."
  ],
  "passCriteria": "Achieve 92%+ accuracy across all drill blocks. Ring fingers must retract smoothly to S and L, keeping keystroke latency consistent and preventing adjacent finger flare."
},
  "top-row-q-p": {
  "id": "bottom-row-combined",
  "slug": "top-row-q-p",
  "name": "Top Row: Q & P Outer Pinkies",
  "keys": [
    "q",
    "p",
    "w",
    "o",
    "t",
    "y",
    "r",
    "u",
    "e",
    "i",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master top row outer pinky reaches Q and P on HeroTyping. Learn upward diagonal extensions, wrist stabilization, and full top-row keyboard coverage.",
  "summary": "Conquer the outermost top row keys, Q and P, using light upward pinky extensions while maintaining wrist stability and avoiding hand rotation. This completes top row coverage from edge to edge with proper biomechanics.",
  "fingerMap": "Extend your left pinky diagonally upward from A to strike Q. Extend your right pinky diagonally upward from the semicolon key (;) to strike P. Keep the movement light, agile, and vertical. Avoid swiveling your wrists outward (ulnar deviation), which places unnecessary strain on the wrist joint and destabilizes the remaining three fingers on the home row.",
  "mistakes": [
    "Rotating the wrist outward toward the edges of the keyboard (ulnar deviation) to reach P or Q instead of extending the pinky finger cleanly.",
    "Striking P with the ring finger because it feels stronger, disrupting the proper four-finger column assignment and causing confusion on O.",
    "Looking away from the screen to visually verify the position of P or Q before striking due to lack of peripheral spatial confidence."
  ],
  "sequence": [
    "Outer Reach Warmup: Practice slow, deliberate pinky extensions (a-q-a and ;-p-;) focusing on light touch, minimal motion, and instant anchor return.",
    "Common Syllables & Digraphs: Drill frequent English word patterns featuring P and Q (quick, quiet, paper, page, keep, apple, equip, power) at an even, controlled tempo.",
    "Sentence Integration: Type complete sentences across top and home rows (quick quiet puppies play with paper) maintaining relaxed, floating wrists and steady cadence."
  ],
  "passCriteria": "Attain 92%+ accuracy on all exercise steps. Keep wrists facing straight forward without lateral twisting, and ensure immediate return of pinkies to A and semicolon anchors."
},
  "bottom-row-combined": {
  "id": "bottom-row-combined",
  "slug": "top-row-q-p",
  "name": "Top Row: Q & P Outer Pinkies",
  "keys": [
    "q",
    "p",
    "w",
    "o",
    "t",
    "y",
    "r",
    "u",
    "e",
    "i",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master top row outer pinky reaches Q and P on HeroTyping. Learn upward diagonal extensions, wrist stabilization, and full top-row keyboard coverage.",
  "summary": "Conquer the outermost top row keys, Q and P, using light upward pinky extensions while maintaining wrist stability and avoiding hand rotation. This completes top row coverage from edge to edge with proper biomechanics.",
  "fingerMap": "Extend your left pinky diagonally upward from A to strike Q. Extend your right pinky diagonally upward from the semicolon key (;) to strike P. Keep the movement light, agile, and vertical. Avoid swiveling your wrists outward (ulnar deviation), which places unnecessary strain on the wrist joint and destabilizes the remaining three fingers on the home row.",
  "mistakes": [
    "Rotating the wrist outward toward the edges of the keyboard (ulnar deviation) to reach P or Q instead of extending the pinky finger cleanly.",
    "Striking P with the ring finger because it feels stronger, disrupting the proper four-finger column assignment and causing confusion on O.",
    "Looking away from the screen to visually verify the position of P or Q before striking due to lack of peripheral spatial confidence."
  ],
  "sequence": [
    "Outer Reach Warmup: Practice slow, deliberate pinky extensions (a-q-a and ;-p-;) focusing on light touch, minimal motion, and instant anchor return.",
    "Common Syllables & Digraphs: Drill frequent English word patterns featuring P and Q (quick, quiet, paper, page, keep, apple, equip, power) at an even, controlled tempo.",
    "Sentence Integration: Type complete sentences across top and home rows (quick quiet puppies play with paper) maintaining relaxed, floating wrists and steady cadence."
  ],
  "passCriteria": "Attain 92%+ accuracy on all exercise steps. Keep wrists facing straight forward without lateral twisting, and ensure immediate return of pinkies to A and semicolon anchors."
},
  "top-and-home-row-mastery": {
  "id": "bottom-row-words",
  "slug": "top-and-home-row-mastery",
  "name": "Consolidation: Top & Home Rows",
  "keys": [
    "q",
    "w",
    "e",
    "r",
    "t",
    "y",
    "u",
    "i",
    "o",
    "p",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Consolidate top and home row touch typing on HeroTyping. Build seamless row transitions, eliminate hesitations, and achieve 30+ WPM typing flow.",
  "summary": "Integrate all twenty keys across the top and home rows into a unified, fluid typing system, building high-speed row-transition automaticity. This enables typing the vast majority of standard English vocabulary without moving your hands to the bottom row.",
  "fingerMap": "All ten fingers operate across both the home row (ASDF JKL;) and the top row (QWERTYUIOP). Keep your hands balanced over the home row as your permanent gravitational center. Fingers venture upward to strike their designated top-row keys and immediately snap back to their home row resting positions without resting on upper keys.",
  "mistakes": [
    "Allowing hands to drift forward permanently into the top row instead of treating the home row as the default resting center for all fingers.",
    "Pausing before row transitions, creating noticeable speed spikes and dips between home-row words and top-row words that break overall typing cadence.",
    "Tensing the shoulders and upper back as speed increases, leading to muscle fatigue and reduced typing stamina over multi-minute practice sessions."
  ],
  "sequence": [
    "Row Transition Warmup: Practice vertical column runs (q-a, w-s, e-d, r-f, t-g, y-h, u-j, i-k, o-l, p-;) to reinforce spatial associations between rows.",
    "Prose Paragraph Drills: Type authentic multi-sentence English passages composed entirely of top and home row letters with smooth, unhesitating cadence.",
    "Cadence & Speed Test: Complete a three-minute continuous test maintaining steady, metronomic keystroke frequency regardless of word complexity or letter combinations."
  ],
  "passCriteria": "Achieve at least 30 WPM with 95%+ accuracy. Demonstrate seamless, unhesitating row transitions with zero visual checks and relaxed shoulder posture throughout the entire test. Passing this assessment certifies foundational touch typing competency across both primary upper tiers."
},
  "bottom-row-words": {
  "id": "bottom-row-words",
  "slug": "top-and-home-row-mastery",
  "name": "Consolidation: Top & Home Rows",
  "keys": [
    "q",
    "w",
    "e",
    "r",
    "t",
    "y",
    "u",
    "i",
    "o",
    "p",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Consolidate top and home row touch typing on HeroTyping. Build seamless row transitions, eliminate hesitations, and achieve 30+ WPM typing flow.",
  "summary": "Integrate all twenty keys across the top and home rows into a unified, fluid typing system, building high-speed row-transition automaticity. This enables typing the vast majority of standard English vocabulary without moving your hands to the bottom row.",
  "fingerMap": "All ten fingers operate across both the home row (ASDF JKL;) and the top row (QWERTYUIOP). Keep your hands balanced over the home row as your permanent gravitational center. Fingers venture upward to strike their designated top-row keys and immediately snap back to their home row resting positions without resting on upper keys.",
  "mistakes": [
    "Allowing hands to drift forward permanently into the top row instead of treating the home row as the default resting center for all fingers.",
    "Pausing before row transitions, creating noticeable speed spikes and dips between home-row words and top-row words that break overall typing cadence.",
    "Tensing the shoulders and upper back as speed increases, leading to muscle fatigue and reduced typing stamina over multi-minute practice sessions."
  ],
  "sequence": [
    "Row Transition Warmup: Practice vertical column runs (q-a, w-s, e-d, r-f, t-g, y-h, u-j, i-k, o-l, p-;) to reinforce spatial associations between rows.",
    "Prose Paragraph Drills: Type authentic multi-sentence English passages composed entirely of top and home row letters with smooth, unhesitating cadence.",
    "Cadence & Speed Test: Complete a three-minute continuous test maintaining steady, metronomic keystroke frequency regardless of word complexity or letter combinations."
  ],
  "passCriteria": "Achieve at least 30 WPM with 95%+ accuracy. Demonstrate seamless, unhesitating row transitions with zero visual checks and relaxed shoulder posture throughout the entire test. Passing this assessment certifies foundational touch typing competency across both primary upper tiers."
},
  "bottom-row-v-m": {
  "id": "numbers-low",
  "slug": "bottom-row-v-m",
  "name": "Bottom Row: V & M Index Curls",
  "keys": [
    "v",
    "m",
    "q",
    "w",
    "e",
    "r",
    "t",
    "y",
    "u",
    "i",
    "o",
    "p",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master bottom row downward index curls V and M on HeroTyping. Learn downward finger curling mechanics, anchor recovery, and English vocabulary drills.",
  "summary": "Initiate bottom row navigation by mastering downward index finger curls to V and M without dropping your wrists or losing home row anchors. This establishes the downward mobility patterns required for the entire lower keyboard tier.",
  "fingerMap": "Curl your left index finger downward and slightly rightward from F to strike V. Curl your right index finger downward and slightly leftward from J to strike M. The motion is an inward curling of the finger joints toward the palm. Avoid dropping your wrists onto the desk surface, which impedes the natural downward curling arc and strains forearm tendons.",
  "mistakes": [
    "Dropping wrists heavily onto the desk or laptop edge when reaching downward, which restricts finger tendon mobility and causes repetitive strain over time.",
    "Flattening the fingers rather than curling them, resulting in accidental strikes of adjacent keys like C, B, or N during downward reaches.",
    "Reaching for V or M with the thumb instead of the dedicated index finger, breaking standard touch typing conventions and slowing progression."
  ],
  "sequence": [
    "Downward Curl Warmup: Practice isolated finger curls (f-v-f and j-m-j) focusing on keeping the wrist elevated, floating, and relaxed above the desk surface.",
    "High-Frequency Syllables: Type essential English vocabulary containing V and M (move, view, make, five, warm, move, time, more, never) at an even, controlled tempo.",
    "Mixed-Row Phrases: Practice natural sentences spanning all three learned rows (every move makes more view; give them some warm milk) with smooth, continuous flow."
  ],
  "passCriteria": "Attain 92%+ accuracy across all drill exercises. Maintain elevated, floating wrists and ensure immediate return of index fingers to F and J anchors after each downward strike."
},
  "numbers-low": {
  "id": "numbers-low",
  "slug": "bottom-row-v-m",
  "name": "Bottom Row: V & M Index Curls",
  "keys": [
    "v",
    "m",
    "q",
    "w",
    "e",
    "r",
    "t",
    "y",
    "u",
    "i",
    "o",
    "p",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master bottom row downward index curls V and M on HeroTyping. Learn downward finger curling mechanics, anchor recovery, and English vocabulary drills.",
  "summary": "Initiate bottom row navigation by mastering downward index finger curls to V and M without dropping your wrists or losing home row anchors. This establishes the downward mobility patterns required for the entire lower keyboard tier.",
  "fingerMap": "Curl your left index finger downward and slightly rightward from F to strike V. Curl your right index finger downward and slightly leftward from J to strike M. The motion is an inward curling of the finger joints toward the palm. Avoid dropping your wrists onto the desk surface, which impedes the natural downward curling arc and strains forearm tendons.",
  "mistakes": [
    "Dropping wrists heavily onto the desk or laptop edge when reaching downward, which restricts finger tendon mobility and causes repetitive strain over time.",
    "Flattening the fingers rather than curling them, resulting in accidental strikes of adjacent keys like C, B, or N during downward reaches.",
    "Reaching for V or M with the thumb instead of the dedicated index finger, breaking standard touch typing conventions and slowing progression."
  ],
  "sequence": [
    "Downward Curl Warmup: Practice isolated finger curls (f-v-f and j-m-j) focusing on keeping the wrist elevated, floating, and relaxed above the desk surface.",
    "High-Frequency Syllables: Type essential English vocabulary containing V and M (move, view, make, five, warm, move, time, more, never) at an even, controlled tempo.",
    "Mixed-Row Phrases: Practice natural sentences spanning all three learned rows (every move makes more view; give them some warm milk) with smooth, continuous flow."
  ],
  "passCriteria": "Attain 92%+ accuracy across all drill exercises. Maintain elevated, floating wrists and ensure immediate return of index fingers to F and J anchors after each downward strike."
},
  "bottom-row-c-comma": {
  "id": "numbers-high",
  "slug": "bottom-row-c-comma",
  "name": "Bottom Row: C & Comma",
  "keys": [
    "c",
    ",",
    "v",
    "m",
    "q",
    "w",
    "e",
    "r",
    "t",
    "y",
    "u",
    "i",
    "o",
    "p",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master bottom row C and comma typing mechanics on HeroTyping. Learn middle finger downward curls, comma punctuation cadence, and word flow.",
  "summary": "Develop downward middle finger curling mechanics for C on the left hand and the comma key on the right hand, integrating essential punctuation into prose flow. This combines letter mastery with punctuation timing.",
  "fingerMap": "Curl your left middle finger downward and inward from D to strike C. Curl your right middle finger downward and inward from K to strike the comma (,). Because the comma is followed by a space in standard English typography, practice the comma-plus-space motion as a unified rhythmic pair: comma with right middle finger, space with thumb.",
  "mistakes": [
    "Striking C with the index finger due to persistent hunt-and-peck muscle memory instead of curling the middle finger into the bottom row.",
    "Forgetting to insert a space after the comma, or pausing excessively before resuming word typing, disrupting typing cadence.",
    "Tilting the left hand inward toward the keyboard center to reach C rather than curling downward directly from the D position.",
    "Applying excessive force on the comma key, leading to delayed return to home row."
  ],
  "sequence": [
    "Downward Middle Curl Warmup: Practice slow, deliberate downward reaches (d-c-d and k-,-k) keeping index anchors securely in place on F and J.",
    "Punctuation Pairings: Drill common English words and comma-punctuated clauses (come, city, call, clear, much, ice, yes, we can) with steady cadence.",
    "Clause-Structured Sentences: Type full sentences with natural punctuation breaks (come home, see the city, and call me) maintaining uninterrupted flow and rhythm."
  ],
  "passCriteria": "Achieve 92%+ accuracy across all drill steps. Demonstrate proper middle-finger actuation of C and seamless execution of the comma-plus-space sequence without pausing or visual searching."
},
  "numbers-high": {
  "id": "numbers-high",
  "slug": "bottom-row-c-comma",
  "name": "Bottom Row: C & Comma",
  "keys": [
    "c",
    ",",
    "v",
    "m",
    "q",
    "w",
    "e",
    "r",
    "t",
    "y",
    "u",
    "i",
    "o",
    "p",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master bottom row C and comma typing mechanics on HeroTyping. Learn middle finger downward curls, comma punctuation cadence, and word flow.",
  "summary": "Develop downward middle finger curling mechanics for C on the left hand and the comma key on the right hand, integrating essential punctuation into prose flow. This combines letter mastery with punctuation timing.",
  "fingerMap": "Curl your left middle finger downward and inward from D to strike C. Curl your right middle finger downward and inward from K to strike the comma (,). Because the comma is followed by a space in standard English typography, practice the comma-plus-space motion as a unified rhythmic pair: comma with right middle finger, space with thumb.",
  "mistakes": [
    "Striking C with the index finger due to persistent hunt-and-peck muscle memory instead of curling the middle finger into the bottom row.",
    "Forgetting to insert a space after the comma, or pausing excessively before resuming word typing, disrupting typing cadence.",
    "Tilting the left hand inward toward the keyboard center to reach C rather than curling downward directly from the D position.",
    "Applying excessive force on the comma key, leading to delayed return to home row."
  ],
  "sequence": [
    "Downward Middle Curl Warmup: Practice slow, deliberate downward reaches (d-c-d and k-,-k) keeping index anchors securely in place on F and J.",
    "Punctuation Pairings: Drill common English words and comma-punctuated clauses (come, city, call, clear, much, ice, yes, we can) with steady cadence.",
    "Clause-Structured Sentences: Type full sentences with natural punctuation breaks (come home, see the city, and call me) maintaining uninterrupted flow and rhythm."
  ],
  "passCriteria": "Achieve 92%+ accuracy across all drill steps. Demonstrate proper middle-finger actuation of C and seamless execution of the comma-plus-space sequence without pausing or visual searching."
},
  "bottom-row-x-period": {
  "id": "full-keyboard-words",
  "slug": "bottom-row-x-period",
  "name": "Bottom Row: X & Period",
  "keys": [
    "x",
    ".",
    "c",
    ",",
    "v",
    "m",
    "q",
    "w",
    "e",
    "r",
    "t",
    "y",
    "u",
    "i",
    "o",
    "p",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master bottom row X and period typing mechanics on HeroTyping. Learn ring finger downward curls, terminal punctuation cadence, and natural sentence flow.",
  "summary": "Conquer downward ring finger reaches to X on the left hand and the period key (.) on the right hand, mastering complete sentence termination. This bridges letter drills into full prose sentence structures across realistic multi-paragraph texts.",
  "fingerMap": "Curl your left ring finger downward and inward from S to strike X. Curl your right ring finger downward and inward from L to strike the period key (.). Maintain floating wrists and keep your index and middle fingers hovering calmly over their home keys. The period is followed by a spacebar actuation in standard typing cadence.",
  "mistakes": [
    "Striking X with the middle finger or index finger to avoid using the less confident ring finger, causing finger tangling.",
    "Stumbling on sentence boundaries by hesitating before or after the period-plus-space sequence, creating jerky typing rhythm.",
    "Overstriking the period key with excessive downward arm force, which slows down subsequent sentence initiation.",
    "Lifting hands off the keyboard during period actuation, losing home row orientation."
  ],
  "sequence": [
    "Ring Curl Calibration: Practice isolated downward ring reaches (s-x-s and l-.-l) paying close attention to clean key actuation and immediate retraction.",
    "Vocabulary & Terminal Drills: Type words featuring X alongside period-terminated short phrases (mix, next, extra, fox, relax, six. fix it.) with rhythmic precision.",
    "Multi-Sentence Flow: Type multi-sentence paragraphs (the fox was quick. she will fix the next box.) focusing on smooth, unhesitating sentence transitions."
  ],
  "passCriteria": "Attain 92%+ accuracy across all exercises. Ring fingers must curl cleanly to X and period without sympathetic hand rotation or delayed spacing cadence across all test blocks. Consistently check that your left ring finger returns to S before striking subsequent letters."
},
  "full-keyboard-words": {
  "id": "full-keyboard-words",
  "slug": "bottom-row-x-period",
  "name": "Bottom Row: X & Period",
  "keys": [
    "x",
    ".",
    "c",
    ",",
    "v",
    "m",
    "q",
    "w",
    "e",
    "r",
    "t",
    "y",
    "u",
    "i",
    "o",
    "p",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master bottom row X and period typing mechanics on HeroTyping. Learn ring finger downward curls, terminal punctuation cadence, and natural sentence flow.",
  "summary": "Conquer downward ring finger reaches to X on the left hand and the period key (.) on the right hand, mastering complete sentence termination. This bridges letter drills into full prose sentence structures across realistic multi-paragraph texts.",
  "fingerMap": "Curl your left ring finger downward and inward from S to strike X. Curl your right ring finger downward and inward from L to strike the period key (.). Maintain floating wrists and keep your index and middle fingers hovering calmly over their home keys. The period is followed by a spacebar actuation in standard typing cadence.",
  "mistakes": [
    "Striking X with the middle finger or index finger to avoid using the less confident ring finger, causing finger tangling.",
    "Stumbling on sentence boundaries by hesitating before or after the period-plus-space sequence, creating jerky typing rhythm.",
    "Overstriking the period key with excessive downward arm force, which slows down subsequent sentence initiation.",
    "Lifting hands off the keyboard during period actuation, losing home row orientation."
  ],
  "sequence": [
    "Ring Curl Calibration: Practice isolated downward ring reaches (s-x-s and l-.-l) paying close attention to clean key actuation and immediate retraction.",
    "Vocabulary & Terminal Drills: Type words featuring X alongside period-terminated short phrases (mix, next, extra, fox, relax, six. fix it.) with rhythmic precision.",
    "Multi-Sentence Flow: Type multi-sentence paragraphs (the fox was quick. she will fix the next box.) focusing on smooth, unhesitating sentence transitions."
  ],
  "passCriteria": "Attain 92%+ accuracy across all exercises. Ring fingers must curl cleanly to X and period without sympathetic hand rotation or delayed spacing cadence across all test blocks. Consistently check that your left ring finger returns to S before striking subsequent letters."
},
  "bottom-row-z-slash": {
  "id": "full-keyboard-punctuation",
  "slug": "bottom-row-z-slash",
  "name": "Bottom Row: Z & Slash",
  "keys": [
    "z",
    "/",
    "x",
    ".",
    "c",
    ",",
    "v",
    "m",
    "q",
    "w",
    "e",
    "r",
    "t",
    "y",
    "u",
    "i",
    "o",
    "p",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master bottom row outer pinky reaches Z and forward slash on HeroTyping. Learn downward pinky mechanics, technical punctuation, and wrist stability.",
  "summary": "Master the outermost bottom row keys, Z and forward slash (/), using controlled pinky curls without allowing wrist rotation or hand collapse. This gives your pinkies complete mastery of both top and bottom outer corners.",
  "fingerMap": "Curl your left pinky downward and inward from A to strike Z. Curl your right pinky downward and inward from the semicolon key (;) to strike the forward slash (/). Because the pinky is the shortest finger, resist the temptation to twist your wrists outward. Maintain a relaxed, neutral forearm angle and curl the pinky joint deliberately into the keycap.",
  "mistakes": [
    "Twisting the wrist outward (ulnar deviation) to reach Z or slash rather than articulating cleanly from the pinky knuckle joint.",
    "Reaching for Z with the ring finger, causing finger collision and misaligning the left hand from the home row.",
    "Looking down at the keyboard to visually locate Z or slash due to infrequent daily usage in casual typing."
  ],
  "sequence": [
    "Outer Pinky Curl Warmup: Practice slow, deliberate downward pinky curls (a-z-a and ;-/-;) focusing on light touch and instant recovery to home anchors.",
    "Technical & Word Drills: Type English vocabulary featuring Z and slash formatting (zero, zone, prize, size, freeze, and/or, yes/no) at an even, controlled tempo.",
    "Comprehensive Keyboard Sentences: Type full sentences integrating Z and slash (the crazy zebra froze in the zoo; check yes/no on the form) with steady rhythm."
  ],
  "passCriteria": "Achieve 92%+ accuracy across all drill steps. Maintain neutral wrist alignment with zero hand twisting, returning pinkies immediately to A and semicolon anchors. Developing pinky curl confidence prevents awkward hand twisting during complex prose."
},
  "full-keyboard-punctuation": {
  "id": "full-keyboard-punctuation",
  "slug": "bottom-row-z-slash",
  "name": "Bottom Row: Z & Slash",
  "keys": [
    "z",
    "/",
    "x",
    ".",
    "c",
    ",",
    "v",
    "m",
    "q",
    "w",
    "e",
    "r",
    "t",
    "y",
    "u",
    "i",
    "o",
    "p",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Master bottom row outer pinky reaches Z and forward slash on HeroTyping. Learn downward pinky mechanics, technical punctuation, and wrist stability.",
  "summary": "Master the outermost bottom row keys, Z and forward slash (/), using controlled pinky curls without allowing wrist rotation or hand collapse. This gives your pinkies complete mastery of both top and bottom outer corners.",
  "fingerMap": "Curl your left pinky downward and inward from A to strike Z. Curl your right pinky downward and inward from the semicolon key (;) to strike the forward slash (/). Because the pinky is the shortest finger, resist the temptation to twist your wrists outward. Maintain a relaxed, neutral forearm angle and curl the pinky joint deliberately into the keycap.",
  "mistakes": [
    "Twisting the wrist outward (ulnar deviation) to reach Z or slash rather than articulating cleanly from the pinky knuckle joint.",
    "Reaching for Z with the ring finger, causing finger collision and misaligning the left hand from the home row.",
    "Looking down at the keyboard to visually locate Z or slash due to infrequent daily usage in casual typing."
  ],
  "sequence": [
    "Outer Pinky Curl Warmup: Practice slow, deliberate downward pinky curls (a-z-a and ;-/-;) focusing on light touch and instant recovery to home anchors.",
    "Technical & Word Drills: Type English vocabulary featuring Z and slash formatting (zero, zone, prize, size, freeze, and/or, yes/no) at an even, controlled tempo.",
    "Comprehensive Keyboard Sentences: Type full sentences integrating Z and slash (the crazy zebra froze in the zoo; check yes/no on the form) with steady rhythm."
  ],
  "passCriteria": "Achieve 92%+ accuracy across all drill steps. Maintain neutral wrist alignment with zero hand twisting, returning pinkies immediately to A and semicolon anchors. Developing pinky curl confidence prevents awkward hand twisting during complex prose."
},
  "alphabet-complete-b-n": {
  "id": "graduation",
  "slug": "alphabet-complete-b-n",
  "name": "Alphabet Complete: B & N",
  "keys": [
    "b",
    "n",
    "z",
    "/",
    "x",
    ".",
    "c",
    ",",
    "v",
    "m",
    "q",
    "w",
    "e",
    "r",
    "t",
    "y",
    "u",
    "i",
    "o",
    "p",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Complete the entire alphabet on HeroTyping with B and N bottom row center reaches. Master long downward reaches and achieve full 26-letter keyboard fluency.",
  "summary": "Unlock the final two letters of the English alphabet, B and N, completing all 26 letter reaches across the three primary keyboard rows. This represents a major milestone: full touch typing coverage of all English text.",
  "fingerMap": "Extend your left index finger diagonally downward and rightward from F to strike B. Extend your right index finger diagonally downward and leftward from J to strike N. B and N represent the longest downward diagonal index reaches on the keyboard. Stabilize your hands with the remaining fingers resting lightly on the home row.",
  "mistakes": [
    "Reaching for B with the right hand instead of the left hand, creating cross-keyboard collisions and disorienting hand balance.",
    "Overextending the wrist forward into the keyboard rather than extending the index finger independently from its knuckle.",
    "Hesitating on B due to lack of spatial confidence, creating a noticeable stutter in typing rhythm during normal prose."
  ],
  "sequence": [
    "Center-Bottom Reach Warmup: Practice alternating downward reaches (f-b-f and j-n-j) to calibrate the exact diagonal travel distance and snap-back timing.",
    "High-Frequency English Digraphs: Drill ubiquitous letter combinations (an, in, on, en, be, by, bin, ban, band, been, bone) with steady metronomic cadence.",
    "Full Alphabet Pangrams: Type pangrams and comprehensive English prose containing all 26 letters (the quick brown fox jumps over the lazy dog) without looking down.",
    "Endurance Review: Complete a three-minute continuous typing drill across all 26 letters maintaining smooth, relaxed rhythm and consistent posture."
  ],
  "passCriteria": "Attain at least 32 WPM with 95%+ accuracy across the full 26-letter review. Demonstrate flawless hand hemisphere separation, striking B with the left index and N with the right index."
},
  "graduation": {
  "id": "graduation",
  "slug": "alphabet-complete-b-n",
  "name": "Alphabet Complete: B & N",
  "keys": [
    "b",
    "n",
    "z",
    "/",
    "x",
    ".",
    "c",
    ",",
    "v",
    "m",
    "q",
    "w",
    "e",
    "r",
    "t",
    "y",
    "u",
    "i",
    "o",
    "p",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    " "
  ],
  "metaDescription": "Complete the entire alphabet on HeroTyping with B and N bottom row center reaches. Master long downward reaches and achieve full 26-letter keyboard fluency.",
  "summary": "Unlock the final two letters of the English alphabet, B and N, completing all 26 letter reaches across the three primary keyboard rows. This represents a major milestone: full touch typing coverage of all English text.",
  "fingerMap": "Extend your left index finger diagonally downward and rightward from F to strike B. Extend your right index finger diagonally downward and leftward from J to strike N. B and N represent the longest downward diagonal index reaches on the keyboard. Stabilize your hands with the remaining fingers resting lightly on the home row.",
  "mistakes": [
    "Reaching for B with the right hand instead of the left hand, creating cross-keyboard collisions and disorienting hand balance.",
    "Overextending the wrist forward into the keyboard rather than extending the index finger independently from its knuckle.",
    "Hesitating on B due to lack of spatial confidence, creating a noticeable stutter in typing rhythm during normal prose."
  ],
  "sequence": [
    "Center-Bottom Reach Warmup: Practice alternating downward reaches (f-b-f and j-n-j) to calibrate the exact diagonal travel distance and snap-back timing.",
    "High-Frequency English Digraphs: Drill ubiquitous letter combinations (an, in, on, en, be, by, bin, ban, band, been, bone) with steady metronomic cadence.",
    "Full Alphabet Pangrams: Type pangrams and comprehensive English prose containing all 26 letters (the quick brown fox jumps over the lazy dog) without looking down.",
    "Endurance Review: Complete a three-minute continuous typing drill across all 26 letters maintaining smooth, relaxed rhythm and consistent posture."
  ],
  "passCriteria": "Attain at least 32 WPM with 95%+ accuracy across the full 26-letter review. Demonstrate flawless hand hemisphere separation, striking B with the left index and N with the right index."
},
  "shift-key-capitalization": {
  "id": "everyday-sentences",
  "slug": "shift-key-capitalization",
  "name": "Shift Mechanics & Capitalization",
  "keys": [
    "Shift",
    "A-Z",
    "a-z",
    ".",
    ",",
    " "
  ],
  "metaDescription": "Master opposite-hand Shift key typing mechanics on HeroTyping. Eliminate single-hand twisting, master capitalization, and build professional typing speed.",
  "summary": "Master professional opposite-hand Shift key mechanics, eliminating single-hand reaching errors and building seamless capitalization fluency. This is essential for professional speed, formal writing, and programming.",
  "fingerMap": "Always use the opposite-hand pinky to depress Shift: when capitalizing a left-hand letter (e.g. T, E, A), hold the right Shift key down with your right pinky; when capitalizing a right-hand letter (e.g. J, I, O), hold the left Shift key down with your left pinky. Maintain the three-step sequence: press Shift down, strike the letter with the opposite hand, release Shift smoothly.",
  "mistakes": [
    "Using the same hand for both Shift and the letter (e.g. left pinky on Shift and left index on T), which contorts the hand and causes frequent typos.",
    "Using Caps Lock for individual capital letters instead of mastering opposite-hand Shift mechanics, severely bottlenecking typing speed.",
    "Releasing Shift prematurely before the letter key has actuated, resulting in an unintended lowercase letter and disrupting flow.",
    "Hesitating on capitalization boundaries, causing significant pauses at the start of new sentences."
  ],
  "sequence": [
    "Opposite-Hand Shift Warmup: Practice alternating capital letters (RightShift+A, LeftShift+L, RightShift+F, LeftShift+J) feeling the coordinated bilateral timing.",
    "Proper Noun & Acronym Drills: Type realistic names, cities, and acronyms (London, Paris, New York, Tokyo, NASA, HTML, Alice, Bob) at an even tempo.",
    "Full Prose Capitalization: Type complete sentences with proper grammatical capitalization and punctuation (The President arrived in Washington on Monday.) without pausing."
  ],
  "passCriteria": "Achieve 94%+ accuracy on all capitalization exercises. Zero instances of same-hand Shift contortions, with smooth, unhesitating capital letter execution across all words. Clean Shift key coordination is essential for maintaining high net speed during mixed-case typing."
},
  "everyday-sentences": {
  "id": "everyday-sentences",
  "slug": "shift-key-capitalization",
  "name": "Shift Mechanics & Capitalization",
  "keys": [
    "Shift",
    "A-Z",
    "a-z",
    ".",
    ",",
    " "
  ],
  "metaDescription": "Master opposite-hand Shift key typing mechanics on HeroTyping. Eliminate single-hand twisting, master capitalization, and build professional typing speed.",
  "summary": "Master professional opposite-hand Shift key mechanics, eliminating single-hand reaching errors and building seamless capitalization fluency. This is essential for professional speed, formal writing, and programming.",
  "fingerMap": "Always use the opposite-hand pinky to depress Shift: when capitalizing a left-hand letter (e.g. T, E, A), hold the right Shift key down with your right pinky; when capitalizing a right-hand letter (e.g. J, I, O), hold the left Shift key down with your left pinky. Maintain the three-step sequence: press Shift down, strike the letter with the opposite hand, release Shift smoothly.",
  "mistakes": [
    "Using the same hand for both Shift and the letter (e.g. left pinky on Shift and left index on T), which contorts the hand and causes frequent typos.",
    "Using Caps Lock for individual capital letters instead of mastering opposite-hand Shift mechanics, severely bottlenecking typing speed.",
    "Releasing Shift prematurely before the letter key has actuated, resulting in an unintended lowercase letter and disrupting flow.",
    "Hesitating on capitalization boundaries, causing significant pauses at the start of new sentences."
  ],
  "sequence": [
    "Opposite-Hand Shift Warmup: Practice alternating capital letters (RightShift+A, LeftShift+L, RightShift+F, LeftShift+J) feeling the coordinated bilateral timing.",
    "Proper Noun & Acronym Drills: Type realistic names, cities, and acronyms (London, Paris, New York, Tokyo, NASA, HTML, Alice, Bob) at an even tempo.",
    "Full Prose Capitalization: Type complete sentences with proper grammatical capitalization and punctuation (The President arrived in Washington on Monday.) without pausing."
  ],
  "passCriteria": "Achieve 94%+ accuracy on all capitalization exercises. Zero instances of same-hand Shift contortions, with smooth, unhesitating capital letter execution across all words. Clean Shift key coordination is essential for maintaining high net speed during mixed-case typing."
},
  "number-row-4-7": {
  "id": "building-speed",
  "slug": "number-row-4-7",
  "name": "Number Row: 4 & 7",
  "keys": [
    "4",
    "7",
    "0-9",
    "a-z",
    " "
  ],
  "metaDescription": "Master number row touch typing for 4 and 7 on HeroTyping. Learn upward index finger extensions to the number row without glancing at your keyboard.",
  "summary": "Begin touch typing the top number row by mastering upward index finger extensions to 4 and 7 while anchoring firmly to the home row. This introduces vertical reaching beyond the top alphabet row into numeric data.",
  "fingerMap": "Reach your left index finger two rows upward and slightly rightward from F to strike 4. Reach your right index finger two rows upward and slightly leftward from J to strike 7. The number row requires a significant vertical extension. Keep your wrists level and floating, and return immediately to F and J upon key release.",
  "mistakes": [
    "Glancing down at the number row because numbers feel less spatially familiar than letters, which halts cognitive touch-typing flow.",
    "Moving the entire arm forward into the keyboard rather than extending cleanly from the knuckles, dislodging hand positioning.",
    "Leaving the index finger hovering near the number row instead of snapping back to home row anchors after actuation.",
    "Overextending the finger and accidentally striking 3 or 8."
  ],
  "sequence": [
    "Number Reach Calibration: Practice upward extensions (f-4-f and j-7-j) slowly, feeling the exact vertical distance and muscular extension.",
    "Alphanumeric Mix Drills: Type mixed words and numbers (4 days, 7 nights, 47 items, 74 points, call 47, room 74) at a controlled, deliberate tempo.",
    "Sentence Context: Type full prose sentences integrating 4 and 7 (There were 4 rooms and 7 doors on the 4th floor.) without looking down at the keyboard."
  ],
  "passCriteria": "Attain 92%+ accuracy across all drill exercises. Demonstrate confident blind reaches to 4 and 7 with immediate anchor recovery to F and J on every keystroke."
},
  "building-speed": {
  "id": "building-speed",
  "slug": "number-row-4-7",
  "name": "Number Row: 4 & 7",
  "keys": [
    "4",
    "7",
    "0-9",
    "a-z",
    " "
  ],
  "metaDescription": "Master number row touch typing for 4 and 7 on HeroTyping. Learn upward index finger extensions to the number row without glancing at your keyboard.",
  "summary": "Begin touch typing the top number row by mastering upward index finger extensions to 4 and 7 while anchoring firmly to the home row. This introduces vertical reaching beyond the top alphabet row into numeric data.",
  "fingerMap": "Reach your left index finger two rows upward and slightly rightward from F to strike 4. Reach your right index finger two rows upward and slightly leftward from J to strike 7. The number row requires a significant vertical extension. Keep your wrists level and floating, and return immediately to F and J upon key release.",
  "mistakes": [
    "Glancing down at the number row because numbers feel less spatially familiar than letters, which halts cognitive touch-typing flow.",
    "Moving the entire arm forward into the keyboard rather than extending cleanly from the knuckles, dislodging hand positioning.",
    "Leaving the index finger hovering near the number row instead of snapping back to home row anchors after actuation.",
    "Overextending the finger and accidentally striking 3 or 8."
  ],
  "sequence": [
    "Number Reach Calibration: Practice upward extensions (f-4-f and j-7-j) slowly, feeling the exact vertical distance and muscular extension.",
    "Alphanumeric Mix Drills: Type mixed words and numbers (4 days, 7 nights, 47 items, 74 points, call 47, room 74) at a controlled, deliberate tempo.",
    "Sentence Context: Type full prose sentences integrating 4 and 7 (There were 4 rooms and 7 doors on the 4th floor.) without looking down at the keyboard."
  ],
  "passCriteria": "Attain 92%+ accuracy across all drill exercises. Demonstrate confident blind reaches to 4 and 7 with immediate anchor recovery to F and J on every keystroke."
},
  "number-row-3-8": {
  "id": "numbers-and-words",
  "slug": "number-row-3-8",
  "name": "Number Row: 3 & 8",
  "keys": [
    "3",
    "8",
    "4",
    "7",
    "a-z",
    " "
  ],
  "metaDescription": "Master number row 3 and 8 middle finger typing on HeroTyping. Learn upward two-row middle finger reaches, tactile homing, and alphanumeric fluency.",
  "summary": "Extend middle finger reaches into the number row for 3 and 8, building accurate vertical travel paths while preserving index finger anchors. This enables rapid typing of addresses, quantities, and phone numbers.",
  "fingerMap": "Extend your left middle finger two rows upward from D to strike 3. Extend your right middle finger two rows upward from K to strike 8. Maintain your index fingers lightly anchored on F and J to prevent your entire hand from drifting forward out of position during the reach.",
  "mistakes": [
    "Striking 3 with the index finger instead of the dedicated middle finger due to lack of middle-finger vertical reach confidence.",
    "Floating the wrist forward, causing all fingers to lose home-row contact and forcing an awkward spatial reset.",
    "Pausing excessively before reaching for 3 or 8 due to lack of muscle memory, breaking the natural rhythm of the sentence.",
    "Striking 2 or 9 by mistake due to improper angular extension."
  ],
  "sequence": [
    "Middle Finger Number Warmup: Practice vertical extensions (d-3-d and k-8-k) keeping index fingers anchored on F and J at all times.",
    "Mixed Number Clusters: Type alternating numeric sequences and quantities (38, 83, 347, 874, 38 items, 83 miles, 38th street) with steady cadence.",
    "Alphanumeric Sentences: Type realistic sentences containing 3 and 8 (The train at platform 3 departs in 8 minutes with 38 cars.) without looking."
  ],
  "passCriteria": "Achieve 92%+ accuracy across all drill steps. Middle fingers must reach cleanly to 3 and 8 without disturbing index anchors on F and J or breaking typing rhythm. Developing vertical middle finger reach confidence eliminates the need to visually search for numbers."
},
  "numbers-and-words": {
  "id": "numbers-and-words",
  "slug": "number-row-3-8",
  "name": "Number Row: 3 & 8",
  "keys": [
    "3",
    "8",
    "4",
    "7",
    "a-z",
    " "
  ],
  "metaDescription": "Master number row 3 and 8 middle finger typing on HeroTyping. Learn upward two-row middle finger reaches, tactile homing, and alphanumeric fluency.",
  "summary": "Extend middle finger reaches into the number row for 3 and 8, building accurate vertical travel paths while preserving index finger anchors. This enables rapid typing of addresses, quantities, and phone numbers.",
  "fingerMap": "Extend your left middle finger two rows upward from D to strike 3. Extend your right middle finger two rows upward from K to strike 8. Maintain your index fingers lightly anchored on F and J to prevent your entire hand from drifting forward out of position during the reach.",
  "mistakes": [
    "Striking 3 with the index finger instead of the dedicated middle finger due to lack of middle-finger vertical reach confidence.",
    "Floating the wrist forward, causing all fingers to lose home-row contact and forcing an awkward spatial reset.",
    "Pausing excessively before reaching for 3 or 8 due to lack of muscle memory, breaking the natural rhythm of the sentence.",
    "Striking 2 or 9 by mistake due to improper angular extension."
  ],
  "sequence": [
    "Middle Finger Number Warmup: Practice vertical extensions (d-3-d and k-8-k) keeping index fingers anchored on F and J at all times.",
    "Mixed Number Clusters: Type alternating numeric sequences and quantities (38, 83, 347, 874, 38 items, 83 miles, 38th street) with steady cadence.",
    "Alphanumeric Sentences: Type realistic sentences containing 3 and 8 (The train at platform 3 departs in 8 minutes with 38 cars.) without looking."
  ],
  "passCriteria": "Achieve 92%+ accuracy across all drill steps. Middle fingers must reach cleanly to 3 and 8 without disturbing index anchors on F and J or breaking typing rhythm. Developing vertical middle finger reach confidence eliminates the need to visually search for numbers."
},
  "number-row-2-9": {
  "id": "longer-passages",
  "slug": "number-row-2-9",
  "name": "Number Row: 2 & 9",
  "keys": [
    "2",
    "9",
    "3",
    "8",
    "4",
    "7",
    "a-z",
    " "
  ],
  "metaDescription": "Master number row 2 and 9 ring finger reaches on HeroTyping. Learn upward two-row ring finger mechanics, alphanumeric combinations, and dates.",
  "summary": "Conquer upward ring finger reaches to 2 and 9 on the number row, developing tactile precision for dates, phone numbers, and financial data. This trains extensor control on the upper keyboard boundary.",
  "fingerMap": "Extend your left ring finger two rows upward from S to strike 2. Extend your right ring finger two rows upward from L to strike 9. Because ring fingers have limited independent mobility, execute this reach with a gentle, controlled hand forward motion while keeping the adjacent fingers close to home keys.",
  "mistakes": [
    "Using the middle finger to hit 2 or 9 because the ring finger feels uncoordinated, which disrupts adjacent finger assignments.",
    "Collapsing wrists onto the desk edge during the high reach, which restricts finger travel and places unnecessary tension on the forearm.",
    "Glancing at the keyboard to confirm the location of 2 or 9 before striking, resetting cognitive focus.",
    "Overstriking 2 or 9 with excessive force to compensate for ring finger weakness."
  ],
  "sequence": [
    "Ring Finger Number Calibration: Practice isolated upward reaches (s-2-s and l-9-l) at a slow, deliberate tempo to map the vertical travel.",
    "Date & Quantity Drills: Type realistic dates, years, and measurements (1929, 2029, 29 items, 92 miles, 29th, page 29, 292 words) with even pacing.",
    "Contextual Prose: Type full sentences containing 2 and 9 (In 1929, over 29 ships sailed across the 92 bays.) without breaking cadence."
  ],
  "passCriteria": "Attain 92%+ accuracy on all exercise blocks. Ring fingers must actuate 2 and 9 cleanly without hand twisting, returning immediately to S and L home positions. Maintaining floating wrists is especially critical during high two-row ring finger reaches."
},
  "longer-passages": {
  "id": "longer-passages",
  "slug": "number-row-2-9",
  "name": "Number Row: 2 & 9",
  "keys": [
    "2",
    "9",
    "3",
    "8",
    "4",
    "7",
    "a-z",
    " "
  ],
  "metaDescription": "Master number row 2 and 9 ring finger reaches on HeroTyping. Learn upward two-row ring finger mechanics, alphanumeric combinations, and dates.",
  "summary": "Conquer upward ring finger reaches to 2 and 9 on the number row, developing tactile precision for dates, phone numbers, and financial data. This trains extensor control on the upper keyboard boundary.",
  "fingerMap": "Extend your left ring finger two rows upward from S to strike 2. Extend your right ring finger two rows upward from L to strike 9. Because ring fingers have limited independent mobility, execute this reach with a gentle, controlled hand forward motion while keeping the adjacent fingers close to home keys.",
  "mistakes": [
    "Using the middle finger to hit 2 or 9 because the ring finger feels uncoordinated, which disrupts adjacent finger assignments.",
    "Collapsing wrists onto the desk edge during the high reach, which restricts finger travel and places unnecessary tension on the forearm.",
    "Glancing at the keyboard to confirm the location of 2 or 9 before striking, resetting cognitive focus.",
    "Overstriking 2 or 9 with excessive force to compensate for ring finger weakness."
  ],
  "sequence": [
    "Ring Finger Number Calibration: Practice isolated upward reaches (s-2-s and l-9-l) at a slow, deliberate tempo to map the vertical travel.",
    "Date & Quantity Drills: Type realistic dates, years, and measurements (1929, 2029, 29 items, 92 miles, 29th, page 29, 292 words) with even pacing.",
    "Contextual Prose: Type full sentences containing 2 and 9 (In 1929, over 29 ships sailed across the 92 bays.) without breaking cadence."
  ],
  "passCriteria": "Attain 92%+ accuracy on all exercise blocks. Ring fingers must actuate 2 and 9 cleanly without hand twisting, returning immediately to S and L home positions. Maintaining floating wrists is especially critical during high two-row ring finger reaches."
},
  "number-row-1-0": {
  "id": "mixed-practice",
  "slug": "number-row-1-0",
  "name": "Number Row: 1 & 0",
  "keys": [
    "1",
    "0",
    "2",
    "9",
    "3",
    "8",
    "4",
    "7",
    "a-z",
    " "
  ],
  "metaDescription": "Master number row 1 and 0 pinky reaches on HeroTyping. Learn outer number row touch typing, numeric combinations, and full ten-digit mastery.",
  "summary": "Master the outermost number row keys, 1 and 0, using controlled pinky reaches, unlocking complete ten-digit touch typing without visual reliance. This completes the full numeric range required for mathematical and accounting entry.",
  "fingerMap": "Reach your left pinky two rows upward from A to strike 1. Reach your right pinky two rows upward from the semicolon key (;) to strike 0. Keep your wrists straight and avoid outward twisting. Let your hand float slightly forward to accommodate the reach, and immediately reset back to home row.",
  "mistakes": [
    "Swiveling wrists outward to reach 1 or 0, which strains the wrist joint and misaligns all remaining fingers on the hand.",
    "Using the ring finger for 1 or 0 instead of the dedicated pinky finger, causing confusion on 2 and 9.",
    "Confusing the letter O with the digit 0, or lowercase l with digit 1 in typing cadence and finger selection.",
    "Pausing before striking 1 or 0 due to outer corner hesitation."
  ],
  "sequence": [
    "Pinky Number Reach Warmup: Practice slow, deliberate extensions (a-1-a and ;-0-;) focusing on light touch, minimal movement, and instant recovery.",
    "Full Ten-Digit Drills: Type complete phone numbers, zip codes, and serials (10, 100, 1000, 101, 2010, 1900, 10-digit code) with rhythmic accuracy.",
    "Contextual Alphanumeric Sentences: Type full sentences containing 1 and 0 (Order 101 contained 10 items priced at 10 dollars each.) without looking down."
  ],
  "passCriteria": "Achieve 92%+ accuracy across all drill exercises. Demonstrate clean pinky strikes on 1 and 0 with zero outward wrist rotation and instant home anchor recovery on every repetition."
},
  "mixed-practice": {
  "id": "mixed-practice",
  "slug": "number-row-1-0",
  "name": "Number Row: 1 & 0",
  "keys": [
    "1",
    "0",
    "2",
    "9",
    "3",
    "8",
    "4",
    "7",
    "a-z",
    " "
  ],
  "metaDescription": "Master number row 1 and 0 pinky reaches on HeroTyping. Learn outer number row touch typing, numeric combinations, and full ten-digit mastery.",
  "summary": "Master the outermost number row keys, 1 and 0, using controlled pinky reaches, unlocking complete ten-digit touch typing without visual reliance. This completes the full numeric range required for mathematical and accounting entry.",
  "fingerMap": "Reach your left pinky two rows upward from A to strike 1. Reach your right pinky two rows upward from the semicolon key (;) to strike 0. Keep your wrists straight and avoid outward twisting. Let your hand float slightly forward to accommodate the reach, and immediately reset back to home row.",
  "mistakes": [
    "Swiveling wrists outward to reach 1 or 0, which strains the wrist joint and misaligns all remaining fingers on the hand.",
    "Using the ring finger for 1 or 0 instead of the dedicated pinky finger, causing confusion on 2 and 9.",
    "Confusing the letter O with the digit 0, or lowercase l with digit 1 in typing cadence and finger selection.",
    "Pausing before striking 1 or 0 due to outer corner hesitation."
  ],
  "sequence": [
    "Pinky Number Reach Warmup: Practice slow, deliberate extensions (a-1-a and ;-0-;) focusing on light touch, minimal movement, and instant recovery.",
    "Full Ten-Digit Drills: Type complete phone numbers, zip codes, and serials (10, 100, 1000, 101, 2010, 1900, 10-digit code) with rhythmic accuracy.",
    "Contextual Alphanumeric Sentences: Type full sentences containing 1 and 0 (Order 101 contained 10 items priced at 10 dollars each.) without looking down."
  ],
  "passCriteria": "Achieve 92%+ accuracy across all drill exercises. Demonstrate clean pinky strikes on 1 and 0 with zero outward wrist rotation and instant home anchor recovery on every repetition."
},
  "number-row-5-6": {
  "id": "intermediate-checkpoint",
  "slug": "number-row-5-6",
  "name": "Numbers Complete: 5 & 6",
  "keys": [
    "5",
    "6",
    "0-9",
    "a-z",
    " "
  ],
  "metaDescription": "Complete full number row touch typing with 5 and 6 center reaches on HeroTyping. Master all ten digits and build high-speed numeric fluency.",
  "summary": "Conquer the center column number row reaches, 5 and 6, completing all ten digits across the number row with complete blind touch automaticity. This eliminates visual hunting for numbers once and for all across technical and casual documents.",
  "fingerMap": "Reach your left index finger upward and inward to strike 5. Reach your right index finger upward and inward to strike 6. Keys 5 and 6 require the longest compound reaches on the keyboard, combining two rows of vertical travel with inward lateral extension. Retain home row anchors and retract immediately upon key actuation.",
  "mistakes": [
    "Reaching for 6 with the left hand or 5 with the right hand, disrupting standard keyboard hemisphere assignment and causing finger tangling.",
    "Losing all spatial orientation during the long reach and struggling to find F and J afterwards, leading to subsequent typos.",
    "Glancing down at the keyboard to locate 5 and 6 instead of trusting the kinesthetic sense of diagonal travel.",
    "Lingering on 5 or 6, slowing down typing rhythm on subsequent letters."
  ],
  "sequence": [
    "Center Number Warmup: Practice compound index extensions (f-5-f and j-6-j) paying close attention to the diagonal travel angle and recovery path.",
    "Complete Numeric Sequences: Type full numeric series (12345 67890, 56, 65, 565, 656, 506, 605, 5678, 4567) at an even, controlled tempo.",
    "Realistic Data Entry Drills: Type authentic numerical records, timestamps, and currency values (May 5, 6:00 PM, $56.50, account 5601) with smooth flow."
  ],
  "passCriteria": "Attain at least 30 WPM with 94%+ accuracy across the complete ten-digit assessment. Retain rock-solid spatial orientation without a single glance at the keys throughout the entire drill."
},
  "intermediate-checkpoint": {
  "id": "intermediate-checkpoint",
  "slug": "number-row-5-6",
  "name": "Numbers Complete: 5 & 6",
  "keys": [
    "5",
    "6",
    "0-9",
    "a-z",
    " "
  ],
  "metaDescription": "Complete full number row touch typing with 5 and 6 center reaches on HeroTyping. Master all ten digits and build high-speed numeric fluency.",
  "summary": "Conquer the center column number row reaches, 5 and 6, completing all ten digits across the number row with complete blind touch automaticity. This eliminates visual hunting for numbers once and for all across technical and casual documents.",
  "fingerMap": "Reach your left index finger upward and inward to strike 5. Reach your right index finger upward and inward to strike 6. Keys 5 and 6 require the longest compound reaches on the keyboard, combining two rows of vertical travel with inward lateral extension. Retain home row anchors and retract immediately upon key actuation.",
  "mistakes": [
    "Reaching for 6 with the left hand or 5 with the right hand, disrupting standard keyboard hemisphere assignment and causing finger tangling.",
    "Losing all spatial orientation during the long reach and struggling to find F and J afterwards, leading to subsequent typos.",
    "Glancing down at the keyboard to locate 5 and 6 instead of trusting the kinesthetic sense of diagonal travel.",
    "Lingering on 5 or 6, slowing down typing rhythm on subsequent letters."
  ],
  "sequence": [
    "Center Number Warmup: Practice compound index extensions (f-5-f and j-6-j) paying close attention to the diagonal travel angle and recovery path.",
    "Complete Numeric Sequences: Type full numeric series (12345 67890, 56, 65, 565, 656, 506, 605, 5678, 4567) at an even, controlled tempo.",
    "Realistic Data Entry Drills: Type authentic numerical records, timestamps, and currency values (May 5, 6:00 PM, $56.50, account 5601) with smooth flow."
  ],
  "passCriteria": "Attain at least 30 WPM with 94%+ accuracy across the complete ten-digit assessment. Retain rock-solid spatial orientation without a single glance at the keys throughout the entire drill."
},
  "symbols-and-punctuation": {
  "id": "speed-endurance",
  "slug": "symbols-and-punctuation",
  "name": "Symbols & Practical Punctuation",
  "keys": [
    "!",
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "(",
    ")",
    "-",
    "_",
    "=",
    "+",
    "[",
    "]",
    "{",
    "}",
    ";",
    ":",
    "'",
    "\"",
    "?",
    "."
  ],
  "metaDescription": "Master Shift-number symbols and advanced punctuation on HeroTyping. Learn symbol touch typing for programming, finance, and technical writing.",
  "summary": "Master all Shift-number symbols and advanced punctuation marks, unlocking complete fluency for technical documentation, programming, and formal prose. This elevates everyday typing into professional technical competency.",
  "fingerMap": "Apply the Shift key with the opposite hand while reaching to the designated number or punctuation key. For example, to type ! (Shift+1), hold right Shift with your right pinky and reach left pinky to 1; to type ? (Shift+/), hold left Shift with your left pinky and reach right pinky to slash. Keep wrists relaxed and floating above the desk.",
  "mistakes": [
    "Using the same hand for both Shift and the symbol key, contorting the wrist and causing frequent reach errors and hand strain.",
    "Looking down at the keyboard to find obscure symbols like %, &, ^, or #, which breaks coding and typing concentration.",
    "Slowing down to an absolute halt whenever a symbol appears in normal text flow, causing severe burst-and-stall stuttering.",
    "Forgetting to release the Shift key immediately after symbol actuation."
  ],
  "sequence": [
    "Shift-Symbol Warmup: Practice paired symbol drills (! @ # $ % ^ & * ( )) using proper opposite-hand Shift mechanics on every stroke.",
    "Punctuation & Syntax Drills: Type mixed quotes, dashes, hyphens, and brackets (\"Hello!\", cost: $45.00, 100%, user@domain.com, [item-1]) with steady cadence.",
    "Technical Prose Integration: Type complete technical sentences rich in punctuation and symbols (Verify that user.email === \"test@example.com\" (status: 200) & exit.) without hesitation."
  ],
  "passCriteria": "Achieve 92%+ accuracy across all technical symbol exercises. Demonstrate consistent opposite-hand Shift execution on all punctuation reaches with zero hand contortions. Achieving symbol automaticity is a vital prerequisite for programming and technical documentation speed."
},
  "speed-endurance": {
  "id": "speed-endurance",
  "slug": "symbols-and-punctuation",
  "name": "Symbols & Practical Punctuation",
  "keys": [
    "!",
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "(",
    ")",
    "-",
    "_",
    "=",
    "+",
    "[",
    "]",
    "{",
    "}",
    ";",
    ":",
    "'",
    "\"",
    "?",
    "."
  ],
  "metaDescription": "Master Shift-number symbols and advanced punctuation on HeroTyping. Learn symbol touch typing for programming, finance, and technical writing.",
  "summary": "Master all Shift-number symbols and advanced punctuation marks, unlocking complete fluency for technical documentation, programming, and formal prose. This elevates everyday typing into professional technical competency.",
  "fingerMap": "Apply the Shift key with the opposite hand while reaching to the designated number or punctuation key. For example, to type ! (Shift+1), hold right Shift with your right pinky and reach left pinky to 1; to type ? (Shift+/), hold left Shift with your left pinky and reach right pinky to slash. Keep wrists relaxed and floating above the desk.",
  "mistakes": [
    "Using the same hand for both Shift and the symbol key, contorting the wrist and causing frequent reach errors and hand strain.",
    "Looking down at the keyboard to find obscure symbols like %, &, ^, or #, which breaks coding and typing concentration.",
    "Slowing down to an absolute halt whenever a symbol appears in normal text flow, causing severe burst-and-stall stuttering.",
    "Forgetting to release the Shift key immediately after symbol actuation."
  ],
  "sequence": [
    "Shift-Symbol Warmup: Practice paired symbol drills (! @ # $ % ^ & * ( )) using proper opposite-hand Shift mechanics on every stroke.",
    "Punctuation & Syntax Drills: Type mixed quotes, dashes, hyphens, and brackets (\"Hello!\", cost: $45.00, 100%, user@domain.com, [item-1]) with steady cadence.",
    "Technical Prose Integration: Type complete technical sentences rich in punctuation and symbols (Verify that user.email === \"test@example.com\" (status: 200) & exit.) without hesitation."
  ],
  "passCriteria": "Achieve 92%+ accuracy across all technical symbol exercises. Demonstrate consistent opposite-hand Shift execution on all punctuation reaches with zero hand contortions. Achieving symbol automaticity is a vital prerequisite for programming and technical documentation speed."
},
  "typing-flow-and-cadence": {
  "id": "precision-under-pressure",
  "slug": "typing-flow-and-cadence",
  "name": "High-Frequency Flow & Cadence",
  "keys": [
    "a-z",
    "A-Z",
    "0-9",
    "punctuation",
    " "
  ],
  "metaDescription": "Develop even typing cadence and eliminate burst-and-stall speed dips on HeroTyping. Master rhythmic pacing for high sustained WPM across all texts.",
  "summary": "Eliminate erratic burst-and-stall typing behavior by training even, metronomic keystroke cadence across high-frequency English n-grams and vocabulary. Smooth rhythm produces higher sustained net WPM than uncontrolled sprinting across all tests.",
  "fingerMap": "Maintain optimal ergonomic form across all rows: floating wrists, arched knuckles, light tactile anchors on F and J, and relaxed shoulders. Instead of rushing easy words and stumbling on difficult ones, aim for uniform inter-keystroke intervals (IKI) where every key actuates at a steady, rhythmic tempo like a metronome.",
  "mistakes": [
    "Bursting through familiar short words at maximum speed and slamming into sudden pauses on complex words (burst-and-stall pattern), which destroys typing flow.",
    "Over-correcting mistakes with frantic multi-character backspacing, wiping out rhythm and multiplying total error counts exponentially.",
    "Tensing the forearms, neck, and jaw during high-speed drills, inducing physical fatigue and causing erratic keystroke timing.",
    "Speeding up when nearing the end of a sentence, leading to sloppy terminal errors."
  ],
  "sequence": [
    "Metronomic Cadence Drills: Type high-frequency English bigrams and trigrams (th, he, in, er, an, the, and, ing, ion, tio) at a perfectly uniform tempo.",
    "Rhythm Stabilization Drills: Type alternating easy and complex words (the, individual, and, philosophical, with, infrastructure) maintaining identical pace throughout.",
    "Sustained Cadence Assessment: Complete a three-minute continuous typing test with a strict requirement to keep your consistency score above 85% on HeroTyping.",
    "Cadence Review: Analyze your keystroke latency graph to identify and smooth out remaining burst-and-stall spikes."
  ],
  "passCriteria": "Achieve at least 38 WPM with 96%+ accuracy and a consistency score above 80%. Retain steady rhythmic cadence with zero burst-and-stall fluctuations across diverse vocabulary."
},
  "precision-under-pressure": {
  "id": "precision-under-pressure",
  "slug": "typing-flow-and-cadence",
  "name": "High-Frequency Flow & Cadence",
  "keys": [
    "a-z",
    "A-Z",
    "0-9",
    "punctuation",
    " "
  ],
  "metaDescription": "Develop even typing cadence and eliminate burst-and-stall speed dips on HeroTyping. Master rhythmic pacing for high sustained WPM across all texts.",
  "summary": "Eliminate erratic burst-and-stall typing behavior by training even, metronomic keystroke cadence across high-frequency English n-grams and vocabulary. Smooth rhythm produces higher sustained net WPM than uncontrolled sprinting across all tests.",
  "fingerMap": "Maintain optimal ergonomic form across all rows: floating wrists, arched knuckles, light tactile anchors on F and J, and relaxed shoulders. Instead of rushing easy words and stumbling on difficult ones, aim for uniform inter-keystroke intervals (IKI) where every key actuates at a steady, rhythmic tempo like a metronome.",
  "mistakes": [
    "Bursting through familiar short words at maximum speed and slamming into sudden pauses on complex words (burst-and-stall pattern), which destroys typing flow.",
    "Over-correcting mistakes with frantic multi-character backspacing, wiping out rhythm and multiplying total error counts exponentially.",
    "Tensing the forearms, neck, and jaw during high-speed drills, inducing physical fatigue and causing erratic keystroke timing.",
    "Speeding up when nearing the end of a sentence, leading to sloppy terminal errors."
  ],
  "sequence": [
    "Metronomic Cadence Drills: Type high-frequency English bigrams and trigrams (th, he, in, er, an, the, and, ing, ion, tio) at a perfectly uniform tempo.",
    "Rhythm Stabilization Drills: Type alternating easy and complex words (the, individual, and, philosophical, with, infrastructure) maintaining identical pace throughout.",
    "Sustained Cadence Assessment: Complete a three-minute continuous typing test with a strict requirement to keep your consistency score above 85% on HeroTyping.",
    "Cadence Review: Analyze your keystroke latency graph to identify and smooth out remaining burst-and-stall spikes."
  ],
  "passCriteria": "Achieve at least 38 WPM with 96%+ accuracy and a consistency score above 80%. Retain steady rhythmic cadence with zero burst-and-stall fluctuations across diverse vocabulary."
},
  "paragraph-typing-stamina": {
  "id": "long-form-typing",
  "slug": "paragraph-typing-stamina",
  "name": "Natural Prose & Paragraph Stamina",
  "keys": [
    "full-keyboard"
  ],
  "metaDescription": "Build multi-minute typing endurance and cognitive stamina on HeroTyping. Prevent fatigue, sustain high accuracy, and master long-form prose typing.",
  "summary": "Build cognitive stamina and muscular endurance for long-form typing, sustaining high speed and near-perfect accuracy across multi-paragraph texts. This prepares you for workplace reports, essays, transcription, and professional certifications.",
  "fingerMap": "Maintain full ten-finger touch typing mechanics across all three keyboard rows, the number row, and modifier keys. Float your wrists smoothly above the desk, breathe evenly, and keep your gaze fixed 2 to 3 words ahead of your active typing cursor (eye-hand span) to process incoming text smoothly and preemptively.",
  "mistakes": [
    "Focusing exclusively on the immediate character being typed rather than scanning ahead 2–3 words in advance (short eye-hand span), causing micro-hesitations.",
    "Allowing posture to degrade over time, slumping shoulders forward and resting wrists heavily on the desk as fatigue sets in during longer tests.",
    "Letting accuracy drift downward as test duration increases, prioritizing speed over precision and accumulating compounding penalties.",
    "Holding breath during difficult passages, leading to muscular tension and reduced stamina."
  ],
  "sequence": [
    "Eye-Hand Span Training: Practice reading three words ahead while maintaining continuous, unhesitating typing output on descriptive prose passages.",
    "Five-Minute Endurance Run: Type authentic literature and historical prose continuously for five minutes without stopping or checking results midway.",
    "Fatigue Resistance Assessment: Complete a second endurance block immediately after a brief 30-second rest, maintaining within 2 WPM of your first block."
  ],
  "passCriteria": "Sustain at least 42 WPM with 96%+ accuracy across the full five-minute stamina test. Maintain proper ergonomic posture and consistent speed from the first sentence to the last with zero slump. Consistent breathing and relaxed shoulders prevent neck and upper back fatigue during multi-minute sessions."
},
  "long-form-typing": {
  "id": "long-form-typing",
  "slug": "paragraph-typing-stamina",
  "name": "Natural Prose & Paragraph Stamina",
  "keys": [
    "full-keyboard"
  ],
  "metaDescription": "Build multi-minute typing endurance and cognitive stamina on HeroTyping. Prevent fatigue, sustain high accuracy, and master long-form prose typing.",
  "summary": "Build cognitive stamina and muscular endurance for long-form typing, sustaining high speed and near-perfect accuracy across multi-paragraph texts. This prepares you for workplace reports, essays, transcription, and professional certifications.",
  "fingerMap": "Maintain full ten-finger touch typing mechanics across all three keyboard rows, the number row, and modifier keys. Float your wrists smoothly above the desk, breathe evenly, and keep your gaze fixed 2 to 3 words ahead of your active typing cursor (eye-hand span) to process incoming text smoothly and preemptively.",
  "mistakes": [
    "Focusing exclusively on the immediate character being typed rather than scanning ahead 2–3 words in advance (short eye-hand span), causing micro-hesitations.",
    "Allowing posture to degrade over time, slumping shoulders forward and resting wrists heavily on the desk as fatigue sets in during longer tests.",
    "Letting accuracy drift downward as test duration increases, prioritizing speed over precision and accumulating compounding penalties.",
    "Holding breath during difficult passages, leading to muscular tension and reduced stamina."
  ],
  "sequence": [
    "Eye-Hand Span Training: Practice reading three words ahead while maintaining continuous, unhesitating typing output on descriptive prose passages.",
    "Five-Minute Endurance Run: Type authentic literature and historical prose continuously for five minutes without stopping or checking results midway.",
    "Fatigue Resistance Assessment: Complete a second endurance block immediately after a brief 30-second rest, maintaining within 2 WPM of your first block."
  ],
  "passCriteria": "Sustain at least 42 WPM with 96%+ accuracy across the full five-minute stamina test. Maintain proper ergonomic posture and consistent speed from the first sentence to the last with zero slump. Consistent breathing and relaxed shoulders prevent neck and upper back fatigue during multi-minute sessions."
},
  "code-syntax-and-brackets": {
  "id": "numbers-and-symbols-mastery",
  "slug": "code-syntax-and-brackets",
  "name": "Code Syntax & Technical Formats",
  "keys": [
    "{",
    "}",
    "[",
    "]",
    "<",
    ">",
    "(",
    ")",
    "/",
    "\\",
    "|",
    "=",
    "+",
    "-",
    "_",
    ";",
    ":",
    "\"",
    "'",
    "`",
    "~",
    "a-z",
    "0-9"
  ],
  "metaDescription": "Master code syntax typing and programming bracket mechanics on HeroTyping. Learn camelCase, snake_case, curly braces, and code formatting fluency.",
  "summary": "Train specialized finger mechanics for software engineering and technical writing, mastering brackets, syntax operators, and coding case styles. This removes typing friction from writing code and command-line instructions.",
  "fingerMap": "Use dedicated finger paths for technical operators: right pinky for [ ] { } ' \" ; : = + - _, left pinky for ` ~ ! 1 Q A Z, and opposite-hand Shift modifiers. Maintain a relaxed hand frame that permits rapid switching between alphanumeric variable names and dense bracket structures without losing spatial orientation.",
  "mistakes": [
    "Stumbling on paired brackets ({}, [], ()) and pausing to visually search for the closing bracket, breaking programming thought flow.",
    "Straining the right pinky by stretching awkwardly for curly braces without slightly rotating the hand to provide natural reach extension.",
    "Loss of rhythm when transitioning between lowercase keywords and uppercase constants (e.g. const MAX_BUFFER_SIZE = 1024;) due to modifier confusion.",
    "Accidentally hitting Enter when attempting to reach for quotes or brackets."
  ],
  "sequence": [
    "Bracket & Delimiter Warmup: Practice alternating bracket and syntax pairs ({} [] () <> \"\" '' ``) with proper opposite-hand Shift execution on every character.",
    "Case Convention Drills: Type mixed programming naming conventions (camelCase, PascalCase, snake_case, CONSTANT_CASE, kebab-case) at a steady tempo.",
    "Authentic Code Snippet Drills: Type complete JavaScript, Python, and HTML code blocks with realistic indentation, brackets, and semicolons without glancing down."
  ],
  "passCriteria": "Achieve at least 35 WPM with 95%+ accuracy on authentic code passages. Demonstrate effortless reach execution on all bracket types and syntax operators with zero visual searching. Developing bracket fluency removes the primary cognitive bottleneck when writing code."
},
  "numbers-and-symbols-mastery": {
  "id": "numbers-and-symbols-mastery",
  "slug": "code-syntax-and-brackets",
  "name": "Code Syntax & Technical Formats",
  "keys": [
    "{",
    "}",
    "[",
    "]",
    "<",
    ">",
    "(",
    ")",
    "/",
    "\\",
    "|",
    "=",
    "+",
    "-",
    "_",
    ";",
    ":",
    "\"",
    "'",
    "`",
    "~",
    "a-z",
    "0-9"
  ],
  "metaDescription": "Master code syntax typing and programming bracket mechanics on HeroTyping. Learn camelCase, snake_case, curly braces, and code formatting fluency.",
  "summary": "Train specialized finger mechanics for software engineering and technical writing, mastering brackets, syntax operators, and coding case styles. This removes typing friction from writing code and command-line instructions.",
  "fingerMap": "Use dedicated finger paths for technical operators: right pinky for [ ] { } ' \" ; : = + - _, left pinky for ` ~ ! 1 Q A Z, and opposite-hand Shift modifiers. Maintain a relaxed hand frame that permits rapid switching between alphanumeric variable names and dense bracket structures without losing spatial orientation.",
  "mistakes": [
    "Stumbling on paired brackets ({}, [], ()) and pausing to visually search for the closing bracket, breaking programming thought flow.",
    "Straining the right pinky by stretching awkwardly for curly braces without slightly rotating the hand to provide natural reach extension.",
    "Loss of rhythm when transitioning between lowercase keywords and uppercase constants (e.g. const MAX_BUFFER_SIZE = 1024;) due to modifier confusion.",
    "Accidentally hitting Enter when attempting to reach for quotes or brackets."
  ],
  "sequence": [
    "Bracket & Delimiter Warmup: Practice alternating bracket and syntax pairs ({} [] () <> \"\" '' ``) with proper opposite-hand Shift execution on every character.",
    "Case Convention Drills: Type mixed programming naming conventions (camelCase, PascalCase, snake_case, CONSTANT_CASE, kebab-case) at a steady tempo.",
    "Authentic Code Snippet Drills: Type complete JavaScript, Python, and HTML code blocks with realistic indentation, brackets, and semicolons without glancing down."
  ],
  "passCriteria": "Achieve at least 35 WPM with 95%+ accuracy on authentic code passages. Demonstrate effortless reach execution on all bracket types and syntax operators with zero visual searching. Developing bracket fluency removes the primary cognitive bottleneck when writing code."
},
  "touch-typing-graduation": {
  "id": "final-challenge",
  "slug": "touch-typing-graduation",
  "name": "Touch-Typing Graduation Assessment",
  "keys": [
    "full-keyboard-complete"
  ],
  "metaDescription": "Take the comprehensive HeroTyping touch typing graduation assessment. Prove your speed, 96%+ accuracy, and complete blind keyboard mastery.",
  "summary": "Demonstrate complete mastery of touch typing fundamentals across all 26 letters, numbers, punctuation marks, and symbols in a rigorous final assessment. Passing confirms your permanent transition to an unassisted, high-efficiency touch typist.",
  "fingerMap": "All ten fingers operate with total automaticity from their home row anchor base (ASDF JKL;). Wrists float comfortably above the desk, shoulders remain relaxed, and your gaze never wavers from the screen. Your motor system converts thought directly into keystrokes with zero conscious finger positioning or visual reliance.",
  "mistakes": [
    "Allowing performance anxiety to accelerate your initial typing pace beyond your control threshold, causing early cascading errors.",
    "Glancing down at the keyboard during moments of hesitation rather than trusting your developed tactile intuition and muscle memory.",
    "Stopping to dwell on a mistake instead of immediately releasing the error and refocusing forward on the next word in sequence.",
    "Abandoning posture discipline during the final minutes of the benchmark test."
  ],
  "sequence": [
    "Comprehensive Warmup: Complete a quick two-minute warmup drill touching all three primary rows, numbers, and common punctuation marks.",
    "Graduation Examination: Type a challenging five-minute benchmark passage spanning literary prose, numbers, dialogue, and technical vocabulary.",
    "Form & Technique Verification: Maintain pristine posture, neutral wrist alignment, and zero visual key checks throughout the entire exam duration."
  ],
  "passCriteria": "Graduate by achieving at least 45 WPM with 96%+ accuracy on the final five-minute examination. You must complete the test entirely by touch with zero glances at your keyboard, demonstrating lifelong touch typing proficiency and elite ergonomic habits. Demonstrating unhesitating touch typing on all keys confirms your permanent transition to a professional-grade typist."
},
  "final-challenge": {
  "id": "final-challenge",
  "slug": "touch-typing-graduation",
  "name": "Touch-Typing Graduation Assessment",
  "keys": [
    "full-keyboard-complete"
  ],
  "metaDescription": "Take the comprehensive HeroTyping touch typing graduation assessment. Prove your speed, 96%+ accuracy, and complete blind keyboard mastery.",
  "summary": "Demonstrate complete mastery of touch typing fundamentals across all 26 letters, numbers, punctuation marks, and symbols in a rigorous final assessment. Passing confirms your permanent transition to an unassisted, high-efficiency touch typist.",
  "fingerMap": "All ten fingers operate with total automaticity from their home row anchor base (ASDF JKL;). Wrists float comfortably above the desk, shoulders remain relaxed, and your gaze never wavers from the screen. Your motor system converts thought directly into keystrokes with zero conscious finger positioning or visual reliance.",
  "mistakes": [
    "Allowing performance anxiety to accelerate your initial typing pace beyond your control threshold, causing early cascading errors.",
    "Glancing down at the keyboard during moments of hesitation rather than trusting your developed tactile intuition and muscle memory.",
    "Stopping to dwell on a mistake instead of immediately releasing the error and refocusing forward on the next word in sequence.",
    "Abandoning posture discipline during the final minutes of the benchmark test."
  ],
  "sequence": [
    "Comprehensive Warmup: Complete a quick two-minute warmup drill touching all three primary rows, numbers, and common punctuation marks.",
    "Graduation Examination: Type a challenging five-minute benchmark passage spanning literary prose, numbers, dialogue, and technical vocabulary.",
    "Form & Technique Verification: Maintain pristine posture, neutral wrist alignment, and zero visual key checks throughout the entire exam duration."
  ],
  "passCriteria": "Graduate by achieving at least 45 WPM with 96%+ accuracy on the final five-minute examination. You must complete the test entirely by touch with zero glances at your keyboard, demonstrating lifelong touch typing proficiency and elite ergonomic habits. Demonstrating unhesitating touch typing on all keys confirms your permanent transition to a professional-grade typist."
},
};
