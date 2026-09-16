/**
 * The Typing Survivor word bank.
 *
 * Deliberately NOT `english-1k.ts`. That list is the typing test's, and it tops
 * out at eight letters with only ten words that long -- fine for a test where
 * every word is worth the same, useless here where word length *is* the damage
 * curve and where difficulty is supposed to ramp by word complexity rather than
 * by inflating enemy health. A horde that can only ever ask for four-letter
 * words has no late game.
 *
 * Words are grouped by length at module load rather than by hand, so adding a
 * word means appending it to one flat list and nothing else. Everything here is
 * frozen and derived deterministically, so the module holds no mutable state
 * and is safe to import across a `next/dynamic` boundary.
 *
 * Constraints on entries: lowercase a-z only (no apostrophes, no hyphens -- the
 * input is lowercased and compared literally), and common enough that a player
 * can type them without stopping to read twice.
 */

const RAW: readonly string[] = [
  // 3
  "ash", "axe", "bar", "bat", "bay", "bed", "bit", "bog", "bow", "box",
  "bud", "bug", "cap", "cog", "cry", "cub", "cue", "cut", "dam", "den",
  "dig", "dim", "dot", "dry", "dug", "ear", "ebb", "eel", "egg", "elm",
  "end", "fan", "far", "fig", "fin", "fit", "fix", "fog", "fox", "fur",
  "gap", "gas", "gem", "gin", "gum", "gut", "ham", "hat", "hem", "hen",
  "hex", "hid", "hit", "hop", "hub", "hue", "hug", "hum", "ice", "ink",
  "ivy", "jab", "jam", "jar", "jaw", "jet", "jog", "joy", "keg", "key",
  "kin", "kit", "lab", "lap", "law", "leg", "lid", "lip", "log", "low",
  "mad", "map", "mat", "mob", "mud", "mug", "nap", "net", "nod", "oak",
  "oar", "odd", "oil", "owl", "pan", "paw", "peg", "pen", "pit", "pod",
  "pot", "pry", "pub", "pug", "pun", "rag", "ram", "rat", "raw", "ray",
  "rib", "rig", "rim", "rip", "rod", "rot", "row", "rub", "rug", "run",
  "rut", "sap", "saw", "shy", "sip", "sir", "sky", "sly", "sob", "sod",
  "sow", "spy", "sum", "sun", "tab", "tag", "tan", "tap", "tar", "tax",
  "tin", "tip", "toe", "ton", "top", "tow", "toy", "tub", "tug", "urn",
  "van", "vat", "vex", "vow", "wag", "war", "wax", "web", "wed", "wig",
  "win", "wit", "wok", "yak", "yap", "yew", "zap", "zip",

  // 4
  "acid", "acre", "aide", "ally", "alto", "arch", "aria", "army", "atom",
  "aura", "axis", "bail", "bait", "bald", "bane", "bark", "barn", "bask",
  "bead", "beam", "bean", "bear", "beat", "bell", "belt", "bend", "bind",
  "blot", "blur", "boar", "boil", "bold", "bolt", "bone", "boot", "bore",
  "bout", "brew", "brim", "buzz", "cage", "cairn", "calm", "cane", "cape",
  "cart", "cask", "cast", "cave", "chin", "chip", "chop", "claw", "clay",
  "clip", "clog", "club", "clue", "coal", "coat", "coil", "coin", "cold",
  "colt", "comb", "cone", "cope", "cord", "cork", "corn", "cove", "crab",
  "cram", "crew", "crib", "crop", "crow", "cusp", "dare", "dark", "dart",
  "dash", "dawn", "daze", "deaf", "deal", "dear", "debt", "deck", "deed",
  "deep", "deer", "dent", "dire", "dirt", "dish", "disk", "dive", "dock",
  "doom", "dose", "dove", "drag", "draw", "drew", "drip", "drum", "dual",
  "duct", "dune", "dusk", "dust", "duty", "each", "earn", "ease", "east",
  "echo", "edge", "epic", "etch", "even", "ever", "evil", "exam", "exit",
  "face", "fade", "fail", "fair", "fame", "fang", "fare", "farm", "fast",
  "fate", "fear", "feat", "fell", "felt", "fern", "feud", "file", "fill",
  "film", "find", "fine", "fire", "firm", "fish", "fist", "flag", "flap",
  "flat", "flaw", "flax", "flea", "fled", "flee", "flew", "flex", "flip",
  "foam", "foil", "fold", "font", "food", "fool", "foot", "ford", "fork",
  "form", "fort", "foul", "four", "fowl", "frog", "fuel", "fume", "fund",
  "gain", "gale", "game", "gape", "gash", "gate", "gaze", "gear", "germ",
  "gift", "gild", "girl", "give", "glad", "glen", "glow", "glue", "goal",
  "goat", "gold", "gone", "gong", "good", "gore", "gown", "grab", "gram",
  "gray", "grew", "grid", "grim", "grin", "grip", "grit", "grow", "gulf",
  "gull", "gust", "hack", "hail", "hair", "half", "hall", "halt", "hand",
  "hang", "harm", "harp", "hash", "haul", "have", "hawk", "haze", "head",
  "heal", "heap", "hear", "heat", "heed", "heel", "heir", "held", "helm",
  "help", "herb", "herd", "hero", "hide", "high", "hill", "hilt", "hint",
  "hive", "hoax", "hold", "hole", "holy", "home", "hood", "hoof", "hook",
  "hoop", "hope", "horn", "host", "hour", "howl", "hull", "hunt", "hurl",
  "hurt", "hush", "husk", "hymn", "idea", "idle", "inch", "iron", "isle",
  "itch", "jade", "join", "joke", "jolt", "junk", "jury", "keel", "keen",
  "keep", "kelp", "kick", "kiln", "kind", "king", "kite", "knee", "knew",
  "knit", "knob", "knot", "know", "lack", "lair", "lake", "lamb", "lame",
  "lamp", "land", "lane", "lard", "lark", "lash", "last", "late", "lava",
  "lawn", "lead", "leaf", "leak", "lean", "leap", "left", "lend", "lens",
  "lest", "levy", "lice", "lick", "lien", "life", "lift", "like", "limb",
  "lime", "limp", "line", "link", "lint", "lion", "list", "live", "load",
  "loaf", "loam", "loan", "lock", "lode", "loft", "lone", "long", "look",
  "loom", "loop", "loot", "lord", "lore", "lose", "loss", "lost", "loud",
  "love", "luck", "lump", "lure", "lurk", "lush", "lute", "lynx",

  // 5
  "abbey", "abide", "acorn", "adept", "adopt", "agile", "aisle", "album",
  "alert", "alibi", "alien", "alive", "alley", "aloft", "alone", "aloof",
  "altar", "amber", "amend", "amble", "amiss", "ample", "angel", "anger",
  "angle", "ankle", "annex", "anvil", "apart", "apple", "apron", "arbor",
  "ardor", "arena", "argue", "arise", "armor", "aroma", "arrow", "ascot",
  "ashen", "aside", "asset", "atlas", "attic", "audio", "audit", "avail",
  "avert", "avoid", "await", "awake", "award", "aware", "badge", "baker",
  "balmy", "banjo", "barge", "baron", "basin", "basis", "baste", "batch",
  "beach", "beard", "beast", "began", "begin", "being", "belch", "belly",
  "below", "bench", "berry", "berth", "bevel", "birch", "birth", "black",
  "blade", "blame", "bland", "blank", "blast", "blaze", "bleak", "bleed",
  "blend", "bless", "blind", "blink", "bliss", "block", "bloom", "blown",
  "bluff", "blunt", "blush", "board", "boast", "bogus", "bolts", "bonus",
  "boost", "booth", "bound", "brace", "braid", "brain", "brake", "brand",
  "brass", "brave", "bread", "break", "breed", "bribe", "brick", "bride",
  "brief", "bring", "brink", "brisk", "broad", "broil", "broke", "brook",
  "broom", "broth", "brown", "brush", "brute", "build", "built", "bulge",
  "bulky", "bunch", "bugle", "burnt", "burst", "cabin", "cable", "cache",
  "cadet", "camel", "cameo", "canal", "candy", "canon", "canoe", "canvas",
  "caper", "carat", "cargo", "carve", "caste", "catch", "cause", "cease",
  "cedar", "chain", "chair", "chalk", "champ", "chant", "chaos", "charm",
  "chart", "chase", "chasm", "cheap", "cheat", "check", "cheek", "cheer",
  "chess", "chest", "chief", "child", "chill", "chime", "choir", "choke",
  "chord", "chose", "chunk", "churn", "cider", "cigar", "cinch", "civic",
  "claim", "clamp", "clash", "clasp", "class", "clean", "clear", "cleft",
  "clerk", "click", "cliff", "climb", "cling", "cloak", "clock", "clone",
  "close", "cloth", "cloud", "clout", "clove", "clown", "coast", "cobra",
  "cocoa", "colon", "comet", "comic", "coral", "cover", "covet", "crack",
  "craft", "crane", "crank", "crash", "crate", "crave", "crawl", "craze",
  "creak", "cream", "creed", "creek", "creep", "crept", "crest", "crime",
  "crisp", "cross", "crowd", "crown", "crude", "cruel", "crumb", "crush",
  "crust", "curse", "curve", "cycle", "dance", "dealt", "debug", "decay",
  "decoy", "delay", "delta", "delve", "dense", "depth", "devil", "diary",
  "dirge", "ditch", "diver", "dodge", "doubt", "dough", "dowel", "dozen",
  "draft", "drain", "drake", "drape", "drawn", "dread", "dream", "dress",
  "dried", "drift", "drill", "drink", "drive", "droop", "drove", "drown",
  "drums", "dryly", "dusty", "dwarf", "dwell", "eager", "eagle", "early",
  "earth", "easel", "ebony", "eight", "elbow", "elder", "elect", "elite",
  "ember", "empty", "enact", "ended", "enemy", "enjoy", "enter", "entry",
  "equal", "equip", "erase", "error", "essay", "ether", "evade", "event",
  "every", "exact", "excel", "exert", "exile", "exist", "extra",

  // 6
  "abroad", "absorb", "accent", "accept", "access", "acquit", "across",
  "action", "active", "actual", "adhere", "adjust", "admire", "admits",
  "advent", "advice", "affair", "affect", "afford", "afraid", "agency",
  "agenda", "aghast", "agreed", "aiming", "alkali", "allied", "allows",
  "almost", "always", "amount", "ampere", "anchor", "ancient", "animal",
  "annual", "answer", "anthem", "antler", "anyone", "anyway", "appeal",
  "appear", "arbour", "archer", "ardent", "argued", "arisen", "armour",
  "around", "arrest", "arrive", "arrows", "artery", "artist", "ascend",
  "ashore", "aspect", "assign", "assist", "assume", "assure", "asthma",
  "astray", "attach", "attack", "attain", "attend", "auburn", "august",
  "author", "autumn", "avenue", "avoids", "awaken", "awfully", "babble",
  "backed", "badger", "baffle", "bailey", "bakery", "ballad", "ballot",
  "bamboo", "banish", "banner", "banter", "barbed", "barely", "barrel",
  "barren", "basalt", "basket", "batten", "batter", "battle", "beacon",
  "beaker", "beamed", "bearer", "beaten", "beaver", "became", "become",
  "bedlam", "beetle", "before", "begins", "behalf", "behave", "behind",
  "belief", "belong", "bellow", "bemoan", "bender", "benign", "berate",
  "bereft", "bestow", "betray", "better", "beware", "beyond", "bicker",
  "bigger", "binary", "binder", "bishop", "bitter", "blades", "blamed",
  "blazer", "bleach", "bleats", "blight", "blinds", "blithe", "blocks",
  "blonde", "bloody", "bloom", "blotch", "blouse", "blunts", "boards",
  "bodies", "boiler", "bolder", "bolted", "bonnet", "border", "boring",
  "borrow", "bother", "bottle", "bottom", "bought", "bounce", "bounds",
  "bounty", "bovine", "bowler", "boxcar", "braced", "bracket", "brains",
  "branch", "brandy", "brazen", "breach", "breast", "breath", "breeze",
  "bricks", "bridal", "bridge", "bridle", "bright", "brings", "broken",
  "broker", "bronze", "brooch", "brooks", "browse", "bruise", "brunch",
  "brutal", "bubble", "bucket", "buckle", "budget", "buffer", "bugler",
  "builds", "bullet", "bumper", "bundle", "burden", "bureau", "burial",
  "burrow", "bushel", "busily", "butler", "button", "buyers", "bygone",
  "cabins", "cackle", "cactus", "cajole", "calmly", "camera", "canary",
  "cancel", "candle", "canine", "cannon", "canopy", "canter", "canvas",
  "canyon", "carbon", "caress", "carpet", "carrot", "carved", "casket",
  "casual", "cattle", "caught", "causal", "cavern", "cavity", "celery",
  "cellar", "cement", "census", "center", "cereal", "chalet", "chance",
  "change", "chapel", "charge", "charms", "charts", "chased", "chaste",
  "cheeks", "cheery", "cheese", "cherry", "chests", "chevron", "chided",
  "chilly", "chimes", "chisel", "choice", "choked", "cholera", "choose",
  "chorus", "chosen", "chrome", "chunks", "cinder", "cipher", "circle",
  "circus", "cities", "citing", "citrus", "civics", "claims", "clamor",
  "clangs", "clause", "cleans", "clears", "clench", "clever", "client",
  "cliffs", "climax", "clinic", "cloaks", "closed", "closer", "closet",
  "clothe", "clouds", "cloudy", "clover", "clumsy", "cluster", "coarse",
  "cobalt", "coddle", "coffee", "coffin", "cognac", "coiled", "collar",
  "collide", "colony", "colour", "column", "combat", "combed", "comedy",
  "comely", "coming", "commit", "common", "compel", "comply", "concur",
  "condor", "confer", "confide", "conifer", "consul", "convey", "convoy",
  "cooler", "copper", "coppice", "corner", "cornet", "corral", "cortex",
  "cosmic", "cosmos", "costly", "cotton", "cougar", "council", "counts",
  "county", "couple", "coupon", "course", "cousin", "covert", "cowboy",
  "cradle", "crafty", "cranes", "crater", "cravat", "crayon", "crease",
  "create", "credit", "creeds", "creeks", "cretan", "crevice", "cringe",
  "crisis", "critic", "crocus", "crooks", "crowds", "crowns", "cruise",
  "crumbs", "crunch", "crusade", "crusts", "crutch", "crying", "crystal",
  "cuckoo", "cudgel", "cuddle", "cueing", "cuffed", "culled", "cultus",
  "cupola", "curfew", "curled", "curlew", "cursor", "curtain", "curtly",
  "curved", "cushion", "custom", "cutler", "cutter", "cyborg", "cymbal",
  "cypher", "cypress", "dabble", "dagger", "dahlia", "dainty", "damage",
  "damask", "dampen", "dancer", "danger", "dangle", "daring", "darken",
  "darted", "dashed", "dative", "daunts", "dazzle", "deacon", "dealer",
  "dearly", "debate", "debris", "debtor", "decade", "decant", "deceit",
  "decent", "decide", "decked", "declare", "decode", "decree", "deduce",
  "deeper", "deeply", "defeat", "defect", "defend", "defer", "define",
  "deform", "defray", "defuse", "degree", "delete", "deluge", "deluxe",
  "demand", "demean", "demise", "demote", "denial", "denote", "depart",
  "depend", "depict", "deploy", "deport", "depose", "deputy", "derail",
  "derive", "desert", "design", "desire", "detach", "detail", "detain",
  "detect", "detour", "device", "devise", "devote", "devour", "diadem",
  "dialog", "diaper", "differ", "digest", "digits", "dilate", "dilute",
  "dimple", "dinner", "diplomat", "direct", "dirges", "disarm", "disbar",
  "discus", "dismal", "dismay", "dispel", "dispute", "divert", "divide",
  "divine", "docile", "docked", "doctor", "dodged", "dogged", "dolmen",
  "domain", "donate", "donkey", "doodle", "dosage", "dotted", "double",
  "doubts", "dowager", "downed", "dozing", "dragon", "drains", "drapes",
  "drawer", "dreads", "dreams", "dreamy", "dredge", "drench", "dressy",
  "drifts", "drills", "drinks", "driven", "driver", "drives", "drizzle",
  "droops", "drowsy", "drudge", "drying", "dubbed", "ductile", "dudgeon",
  "duffel", "dugout", "dulcet", "dumped", "dunce", "duplex", "durable",
  "duress", "during", "dusted", "duster", "duties", "dynamo",

  // 7
  "abandon", "abdomen", "ability", "abolish", "abreast", "absence", "absolve",
  "abstain", "abusive", "academy", "accident", "account", "accused", "achieve",
  "acquire", "acrobat", "actress", "adamant", "adapter", "address", "adhesive",
  "adjourn", "admiral", "adverse", "advised", "adviser", "aerials", "affable",
  "affects", "affirms", "aground", "airline", "airport", "alcohol", "alertly",
  "algebra", "alkaline", "allegro", "alleged", "allergy", "alliance", "allowed",
  "already", "alright", "amateur", "amazing", "ambient", "amnesty", "amplify",
  "amusing", "analogy", "analyst", "anatomy", "ancient", "android", "angelic",
  "angling", "anguish", "angular", "animate", "annoyed", "another", "answers",
  "antenna", "anthill", "antique", "anxiety", "anxious", "anybody", "apology",
  "apparel", "appeals", "appears", "applaud", "applied", "apprise", "apricot",
  "aptitude", "aquatic", "arbiter", "archaic", "archery", "archive", "arrange",
  "arrival", "arsenal", "article", "artisan", "artists", "ascetic", "ashamed",
  "asphalt", "aspirin", "assault", "assembly", "asserts", "assigns", "assumed",
  "asteroid", "astound", "athlete", "atlases", "attempt", "attends", "attired",
  "auction", "audible", "auditor", "augment", "auspice", "austere", "authors",
  "average", "aviator", "awesome", "awkward", "bacteria", "baggage", "bagpipe",
  "balance", "balcony", "ballast", "ballads", "bandage", "bandits", "banjoes",
  "banking", "banners", "banquet", "baptism", "barbell", "barbers", "bargain",
  "baroque", "barrack", "barrage", "barrels", "barrier", "baskets", "bastion",
  "bathing", "battery", "battles", "bayonet", "bazaars", "beacons", "bearing",
  "beating", "because", "beckons", "bedding", "bedrock", "bedtime", "beeline",
  "beguile", "beliefs", "believe", "bellows", "belongs", "beneath", "benefit",
  "bequest", "berated", "bereave", "berserk", "besides", "besiege", "betrays",
  "betters", "between", "bewitch", "bicycle", "bigotry", "billion", "binding",
  "biology", "bishops", "bitters", "bizarre", "blanket", "blasted", "blazing",
  "bleachers", "blemish", "blessed", "blinded", "blister", "blizzard", "blocked",
  "blossom", "blunder", "blurred", "boarded", "boasted", "bobbing", "bolster",
  "bombard", "bondage", "booklet", "boosted", "bootleg", "borders", "borough",
  "bottled", "bottles", "boulder", "bounced", "boycott", "bracket", "braided",
  "brambles", "branded", "bravado", "bravery", "brazier", "breadth", "breaker",
  "breakup", "breathe", "breeches", "brevity", "brewery", "bribery", "bridges",
  "bridled", "briefly", "brigade", "bright", "brilliant", "brimful", "bringing",
  "bristle", "brittle", "broaden", "brocade", "broiler", "brokers", "bronzed",
  "brother", "brought", "browser", "bruised", "brushes", "brusque", "buckled",
  "budding", "buffalo", "buffers", "builder", "bulkhead", "bullets", "bullion",
  "bulwark", "bunching", "bundles", "bunkers", "buoyant", "burdens", "burglar",
  "burrows", "bursary", "bursting", "bushels", "bustled", "butcher", "buttons",
  "buzzard", "cabbage", "cabinet", "cackled", "cadence", "caldron", "caliber",
  "calibre", "calling", "callous", "calmest", "caloric", "campers", "campus",
  "canasta", "cancels", "candied", "candles", "cannery", "cannons", "canonic",
  "canopy", "canteen", "canters", "canvass", "canyons", "capable", "capital",
  "capsize", "capsule", "captain", "caption", "captive", "capture", "caravan",
  "carbide", "cardiac", "careful", "cargoes", "carnage", "carping", "carrier",
  "carrots", "cartoon", "carving", "cascade", "cashier", "casings", "casings",
  "cassock", "casters", "casting", "castles", "casuals", "catalog", "catcher",
  "catered", "cathode", "caution", "cavalry", "caverns", "cavity", "ceiling",
  "celery", "cellars", "cements", "censure", "centaur", "centers", "central",
  "century", "ceramic", "certain", "chained", "chalice", "challenge", "chamber",
  "chances", "changes", "channel", "chants", "chapels", "chapter", "charged",
  "charger", "chariot", "charity", "charmed", "charted", "charter", "chasing",
  "chassis", "chatted", "cheaper", "cheated", "checked", "cheddar", "cheerful",
  "chemist", "cheques", "cherish", "cherubs", "chestnut", "chewing", "chicken",
  "chiefly", "chiffon", "chilled", "chimney", "chipped", "chiseled", "chivalry",
  "chloride", "chocked", "choicest", "chokers", "cholera", "choppy", "chorale",
  "chortle", "chosen", "chowder", "chronic", "chuckle", "chunked", "churned",
  "cinders", "circles", "circuit", "cistern", "citadel", "citizen", "clamber",
  "clamped", "clarify", "clarity", "classic", "clatter", "cleaner", "cleanse",
  "clearer", "clearly", "cleaver", "clement", "clerics", "clerkly", "cliches",
  "climate", "climbed", "clinched", "clinics", "clipped", "clipper", "cloaked",
  "clobber", "closest", "closure", "clothes", "clotted", "clouded", "cloying",
  "cluster", "clutter", "coached", "coaster", "coating", "coaxial", "cobbler",
  "cockpit", "coconut", "codfish", "coerced", "coffers", "coffins", "cognate",
  "coherent", "coiling", "coinage", "collage", "collapse", "collars", "collect",
  "college", "collide", "collier", "colonel", "colonic", "colored", "colossal",
  "combats", "combine", "comfort", "comical", "command", "comment", "commerce",
  "commits", "commode", "commons", "commune", "commute", "compact", "company",
  "compare", "compass", "compete", "compile", "complex", "comport", "compose",
  "compost", "compute", "comrade", "concave", "conceal", "concede", "conceit",
  "concept", "concern", "concert", "conches", "concise", "concord", "concur",
  "condemn", "condense", "condone", "conduct", "conduit", "confess", "confide",
  "confine", "confirm", "conflict", "conform", "confuse", "congeal", "conifer",
  "conjure", "connect", "conquer", "consent", "console", "consort", "consume",
  "contact", "contain", "contend", "content", "contest", "context", "control",
  "convene", "convent", "convert", "convict", "convoke", "cookery", "cooking",
  "coolant", "coolest", "cooling", "coopers", "cordial", "cordons", "corners",
  "cornice", "coronet", "corpses", "correct", "corrode", "corsage", "cortege",
  "costume", "cottage", "cotters", "coulomb", "council", "counsel", "counted",
  "counter", "country", "coupled", "coupons", "courage", "courier", "courses",
  "courted", "cousins", "covered", "coverts", "coveted", "cowards", "cowboys",
  "cowhide", "cowslip", "crabbed", "cracked", "cracker", "crackle", "cradled",
  "crafted", "craning", "cranium", "cranked", "crashed", "cratered", "craving",
  "crawled", "crayons", "crazier", "creaked", "creamed", "creased", "created",
  "creature", "credits", "creeper", "cremate", "crescent", "cresses", "crested",
  "crevice", "cricket", "crimson", "cringed", "crinkle", "crippled", "crisply",
  "critics", "critique", "crochet", "crocked", "crooked", "crooned", "cropped",
  "crossed", "crosses", "crouch", "crowded", "crowned", "crucial", "crucible",
  "crudely", "cruelty", "cruised", "cruiser", "crumble", "crumple", "crusade",
  "crushed", "crusher", "crushes", "crusted", "crutches", "crystal", "cubicle",
  "cuisine", "culprit", "cultism", "culture", "culvert", "cunning", "cupfuls",
  "cupola", "curable", "curates", "curator", "curbing", "curdled", "curfews",
  "curious", "curling", "currant", "current", "cursing", "cursive", "curtail",
  "curtain", "curtsey", "curvature", "cushion", "custard", "custody", "customs",
  "cutlass", "cutlery", "cutters", "cutting", "cyclist", "cyclone", "cymbals",
  "cynical", "cypress",

  // 8
  "aardvark", "abdicate", "aberrant", "abnormal", "abolish", "abrasion",
  "absentee", "absolute", "abstract", "abundant", "academic", "accented",
  "accepted", "accident", "acclaim", "accolade", "accorded", "accuracy",
  "accurate", "accusing", "achieved", "acquaint", "acquired", "activate",
  "activity", "actually", "adapting", "addition", "adequate", "adhering",
  "adjacent", "adjoined", "adjusted", "admirals", "admitted", "adoption",
  "adorable", "adorning", "advanced", "adventure", "adversity", "advisory",
  "advocate", "aerially", "aesthetic", "affected", "affiliate", "affinity",
  "afflicted", "affluent", "agitated", "agonized", "agreeable", "agreement",
  "airborne", "aircraft", "airfield", "airtight", "alarming", "alderman",
  "alertness", "algorithm", "alienate", "alignment", "allergic", "alleyway",
  "alliance", "allotted", "allusion", "almighty", "alongside", "although",
  "altitude", "aluminum", "amazingly", "ambience", "ambition", "ambulance",
  "amending", "amethyst", "amicable", "ammonia", "amounted", "amplify",
  "amputate", "amusement", "analysis", "analytic", "anarchy", "ancestor",
  "anchored", "ancients", "anecdote", "angelic", "anguished", "angularly",
  "animated", "annexing", "announce", "annoying", "annually", "anointed",
  "anomaly", "anonymous", "answered", "antelope", "anterior", "anthology",
  "antibody", "anticipate", "antidote", "antiquity", "anywhere", "aperture",
  "apparent", "appealed", "appeared", "appendix", "appetite", "applause",
  "applying", "appraise", "approach", "approval", "aptitude", "aquarium",
  "arbitrary", "arboreal", "archaism", "archives", "ardently", "arguable",
  "argument", "arranged", "arrested", "arrogant", "arsenals", "artifact",
  "artisans", "artistic", "ascended", "ascertain", "ashtray", "aspiring",
  "assaults", "assembly", "asserted", "assessed", "assigned", "assisted",
  "assorted", "assuming", "assurance", "asterisk", "astonish", "astrology",
  "astronomy", "athletic", "atlantic", "atmosphere", "atrocity", "attached",
  "attacked", "attained", "attempts", "attended", "attorney", "attracted",
  "audacity", "audience", "auditing", "auspices", "authored", "autocrat",
  "autograph", "automatic", "autonomy", "autumnal", "auxiliary", "available",
  "avalanche", "aversion", "aviation", "avoiding", "awakened", "awfully",
  "awkwardly", "backbone", "backfire", "backward", "bacteria", "balanced",
  "balcony", "ballerina", "ballooned", "bandaged", "bankrupt", "banister",
  "banished", "banquets", "baptized", "barbaric", "bareback", "bargains",
  "barnacle", "baronial", "barracks", "barrages", "barreled", "barriers",
  "bartered", "baseball", "baseline", "bashful", "basilica", "basketry",
  "bathrobe", "battered", "battling", "beautiful", "becoming", "bedspread",
  "befallen", "befitted", "befriend", "beginner", "beguiled", "behavior",
  "beholden", "belated", "believed", "believer", "bellowed", "belonged",
  "benefits", "bereaved", "besieged", "bestowed", "bestride", "bewilder",
  "bewitched", "biannual", "bickered", "bicycles", "biennial", "bilingual",
  "billiard", "billions", "binoculars", "biography", "biologist", "birthday",
  "bisected", "bitterly", "blackout", "blameless", "blanched", "blanketed",
  "blasting", "blatant", "blazoned", "bleached", "bleakest", "blemished",
  "blessing", "blighted", "blinding", "blissful", "blistered", "blizzard",
  "blockade", "blocking", "blossoms", "blotting", "bluffing", "blunders",
  "blushing", "boasting", "boatload", "bodyguard", "boldness", "bolstered",
  "bombarded", "bondsman", "bonfires", "bookcase", "bookkeeper", "booklets",
  "bookmark", "bookshop", "boorish", "bordered", "boreal", "borrowed",
  "botanist", "bothered", "bottling", "boulders", "boundary", "bounties",
  "bouquets", "bowsprit", "boycotts", "bracelet", "brackets", "braiding",
  "brakeman", "branched", "brandish", "bravado", "breached", "breadth",
  "breakage", "breakers", "breaking", "breathed", "breeches", "breeding",
  "breezily", "brethren", "brevity", "brewster", "briefing", "brigades",
  "brighten", "brighter", "brightly", "brilliant", "brimming", "bringing",
  "briskest", "bristles", "brittle", "broached", "broadcast", "broadest",
  "brocaded", "brochure", "brooding", "brooklet", "brothers", "browsing",
  "bruising", "brunette", "brushing", "brusquely", "brutality", "bubbling",
  "buckling", "buckshot", "buckwheat", "buffaloes", "buffered", "bugbear",
  "builders", "building", "bulkhead", "bulletin", "bullfrog", "bullocks",
  "bulwarks", "bumblebee", "bunching", "bungalow", "buoyancy", "burdened",
  "bureaus", "burglary", "burnished", "bursting", "bushfire", "business",
  "bustling", "butchers", "buttered", "buttocks", "buttress", "bystander",

  // 9-12
  "abandoned", "abbreviate", "abdication", "aberration", "abhorrence",
  "abolition", "abominable", "abrasively", "absolutely", "absorbent",
  "abstinence", "abundantly", "accelerate", "accentuate", "acceptable",
  "accessible", "accidental", "accompany", "accomplish", "accordance",
  "accountant", "accumulate", "accusation", "accustomed", "achievement",
  "acknowledge", "acquainted", "acquisition", "activation", "adaptation",
  "additional", "addressing", "adequately", "adherence", "adjustment",
  "administer", "admiration", "admissible", "admittance", "adolescent",
  "advantage", "adventurer", "advertised", "advisable", "advocating",
  "aeronautic", "affability", "affectation", "affiliated", "affirmative",
  "afflicting", "affordable", "aftermath", "afternoon", "afterwards",
  "aggravated", "aggressive", "agitation", "agreement", "agriculture",
  "alarmingly", "algorithms", "alienation", "allegiance", "allegorical",
  "alleviate", "alliances", "allocation", "allowance", "alteration",
  "alternate", "altogether", "aluminium", "amalgamate", "ambassador",
  "ambiguity", "ambitious", "ambulances", "amendment", "amplifier",
  "amusement", "analytical", "ancestral", "anchorage", "anesthetic",
  "animation", "annihilate", "anniversary", "announcer", "annotation",
  "anomalous", "anonymity", "answering", "antagonist", "anthology",
  "anticipate", "antiquated", "apartment", "apologetic", "apparatus",
  "apparently", "appearance", "appendices", "appetizer", "applauding",
  "appliance", "applicant", "apportion", "appraisal", "appreciate",
  "apprehend", "apprentice", "approached", "appropriate", "approximate",
  "aquamarine", "arbitrate", "arboretum", "archipelago", "architect",
  "archivist", "arguments", "arithmetic", "armistice", "aromatic",
  "arrangement", "arrogance", "artificial", "artillery", "ascendancy",
  "ascertain", "aspiration", "assailant", "assassinate", "assemblage",
  "assertion", "assessment", "assignment", "assistance", "associated",
  "assortment", "assumption", "assurance", "astonished", "astringent",
  "astronaut", "astronomer", "asymmetric", "atmosphere", "attachment",
  "attainable", "attempting", "attendance", "attentive", "attraction",
  "attributed", "auctioneer", "audacious", "auditorium", "augmented",
  "auspicious", "authentic", "authority", "autonomous", "avalanche",
  "averaging", "aviation", "awakening", "awareness", "backdrops",
  "background", "backwards", "bacterial", "balancing", "ballistic",
  "bandwidth", "bankruptcy", "barbarian", "barometer", "barricade",
  "basketball", "battalion", "battleship", "beautiful", "beekeeper",
  "beforehand", "beginning", "beleaguer", "believable", "belittle",
  "belligerent", "benchmark", "benefactor", "beneficial", "benevolent",
  "bequeathed", "bestseller", "bewildered", "bicycling", "bilingual",
  "biodiversity", "biography", "biological", "birthplace", "bittersweet",
  "blackboard", "blacksmith", "blameless", "blanketing", "blasphemy",
  "blindfold", "blockbuster", "bloodhound", "blossoming", "blueprint",
  "blustering", "boisterous", "bombardment", "bookkeeper", "bookshelf",
  "borderline", "botanical", "boundaries", "boysenberry", "brainstorm",
  "brambles", "brandishing", "breakfast", "breakthrough", "breathless",
  "breathtaking", "brevity", "brickwork", "bridgehead", "brigadier",
  "brilliance", "brimstone", "broadcaster", "broadening", "brotherhood",
  "brushwood", "buccaneer", "budgetary", "bulldozer", "bulwarks",
  "bureaucrat", "burlesque", "butterfly", "buttonhole", "bystanders",
];

/** Words grouped by length; index 0 is unused. */
const BY_LENGTH: readonly (readonly string[])[] = (() => {
  const seen = new Set<string>();
  const buckets: string[][] = [];
  for (const word of RAW) {
    // Defensive: the list is hand-maintained, and one stray character would
    // otherwise produce a word nobody can type and an enemy nobody can kill.
    if (!/^[a-z]+$/.test(word)) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    while (buckets.length <= word.length) buckets.push([]);
    buckets[word.length].push(word);
  }
  return buckets.map((b) => Object.freeze(b));
})();

export const MIN_WORD_LENGTH = 3;
export const MAX_WORD_LENGTH = BY_LENGTH.length - 1;

/** How many words exist at each length — used by the tests-in-your-head check. */
export function wordCountAt(length: number): number {
  return BY_LENGTH[length]?.length ?? 0;
}

export interface WordPicker {
  /** A word in [minLen, maxLen] that is not already on the board. */
  (minLen: number, maxLen: number): string;
}

/**
 * Builds a picker bound to one RNG and one "already in play" set.
 *
 * Duplicate words on the board would be genuinely unfair — typing one of them
 * would ambiguously target either enemy — so the picker rejects anything in
 * `taken`. It gives up after a bounded number of attempts and returns whatever
 * it has rather than looping forever, because a board holding every word of a
 * given length is a legitimate (if extreme) state.
 */
export function createWordPicker(
  random: () => number,
  taken: ReadonlySet<string>,
): WordPicker {
  return (minLen: number, maxLen: number): string => {
    const lo = Math.max(MIN_WORD_LENGTH, Math.min(minLen, MAX_WORD_LENGTH));
    const hi = Math.max(lo, Math.min(maxLen, MAX_WORD_LENGTH));

    for (let attempt = 0; attempt < 24; attempt++) {
      // Widen the search on later attempts so a saturated length band still
      // produces a word instead of a duplicate.
      const spread = attempt < 12 ? 0 : 2;
      const from = Math.max(MIN_WORD_LENGTH, lo - spread);
      const to = Math.min(MAX_WORD_LENGTH, hi + spread);
      const len = from + Math.floor(random() * (to - from + 1));
      const bucket = BY_LENGTH[len];
      if (!bucket || bucket.length === 0) continue;
      const word = bucket[Math.floor(random() * bucket.length)];
      if (!taken.has(word)) return word;
    }

    // Last resort: scan for anything free at any length.
    for (let len = lo; len <= MAX_WORD_LENGTH; len++) {
      const bucket = BY_LENGTH[len];
      if (!bucket) continue;
      for (const word of bucket) if (!taken.has(word)) return word;
    }
    return BY_LENGTH[lo]?.[0] ?? "word";
  };
}
