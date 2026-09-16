#!/usr/bin/env python3
"""
Turn the raw Flow drops in public/<Game>/ into named, watermark-free WebP art
under public/games/<game-id>/<role>.webp.

Flow named these descriptively this time ("Iron_Golem_in_ruined_library"), which
is far better than the positional guessing the earlier script had to do: the
mapping below matches on a distinctive token from each name, so a missing or
extra file is reported rather than silently shifting every later image by one.

Watermark: Flow bakes a ~50px sparkle whose bottom-right corner sits a fixed
78px in from the right and bottom edges, independent of image size. Verified on
1376x768, 1024x1024 and 896x1200 output. The delogo box below is that position
plus a margin for delogo to interpolate from.

  ./scripts/process-game-art.py --dry-run
  ./scripts/process-game-art.py
"""

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
OUT_ROOT = PUBLIC / "games"

# Source folder -> canonical game id. The ids match the existing convention in
# game-types.ts (falling-words, word-blaster, typing-grand-prix) and become the
# URL segment, so they are spelled out rather than abbreviated.
GAMES = {
    "Spellbound": "spellbound",
    "survivor": "typing-survivor",
    "racer": "ghost-racer",
    "cards": "card-battle",
}

# distinctive filename token -> role name. Matched case-insensitively against
# the Flow filename.
MAPPING = {
    "Spellbound": {
        "Apprentice_mage_character": "char-apprentice",
        "Battlemage_character": "char-battlemage",
        "Rogue_mage_character": "char-rogue-mage",
        "Chronomancer_character": "char-chronomancer",
        "Void_mage_character": "char-void-mage",
        "Ink_wraith": "enemy-inkwraith",
        "Animated_grimoire": "enemy-grimoire",
        "Corrupted_scribe": "enemy-scribe",
        "Stone_golem_bracing": "enemy-sentinel",
        "Bound_Archivist": "elite-archivist",
        "Living_Cipher": "elite-cipher",
        "Iron_Golem": "boss-iron-golem",
        "Word_Eater": "boss-word-eater",
        "Mirror_Mage": "boss-mirror-mage",
        "Void_King": "boss-void-king",
        "Empty_arcane_library": "bg-dungeon",
        "Open_chest_with_glowing": "bg-treasure",
        "Arcane_curiosity_shop": "bg-shop",
        "Cursed_shrine_chamber": "bg-event",
        "Apprentice_standing_at": "hero",
        "Empty_ritual_chamber": "select",
        "Mage_raising_arm": "victory",
        "Spellbook_and_staff": "defeat",
        "Parchment_map": "map",
    },
    "survivor": {
        "Warden_character": "char-warden",
        "Ranger_character": "char-ranger",
        "Pyromancer_character": "char-pyromancer",
        "Duelist_character": "char-duelist",
        "Hostile_swarmling": "enemy-swarmling",
        "Brute_dragging_chain": "enemy-brute",
        "Creature_throwing_burning": "enemy-slinger",
        "Predator_sprinting": "enemy-stalker",
        "Hostile_creature_staggering": "enemy-bloater",
        "Creature_holding_iron_door": "enemy-bulwark",
        "Warchief_roaring": "elite-warchief",
        "Hexer_gesturing": "elite-hexer",
        "Siege_beast": "boss-siegebeast",
        "Plague_Mother": "boss-plaguemother",
        "Armoured_figure_holding_greatswo": "boss-ashen-knight",
        "Fortified_frontier_waystation": "bg-waystation",
        "Empty_ash_fields": "bg-ashfields",
        "Flooded_stone_quarry": "bg-quarry",
        "Stone_bridge_over_volcanic": "bg-bridge",
        "Four_survivors_defending": "hero",
        "Armoury_tent": "select",
        "Campfire_burning": "upgrade",
        "Survivor_resting_on_wall": "victory",
        "Shield_and_torch_in_ash": "defeat",
    },
    "racer": {
        "Veteran_racer_character": "char-veteran",
        "Rookie_racer_character": "char-rookie",
        "Phantom_character": "char-phantom",
        "Character_reference_sheet_of_cha": "char-champion",
        "Racing_machine_in_profile": "bike-standard",
        "Spectral_machine_silhouette": "bike-phantom",
        "Empty_night_circuit": "bg-neoncity",
        "Empty_coastal_circuit": "bg-coastal",
        "Cyan_lights_in_underground": "bg-tunnel",
        "Empty_desert_salt-flat": "bg-desert",
        "Race_cars_waiting_on_grid": "start",
        "Machine_crossing_finish": "finish",
        "Rider_standing_on_machine": "victory",
        "Rider_defeated_by_ghost": "defeat",
        "Bronze_league_emblem": "rank-bronze",
        "Silver_league_emblem": "rank-silver",
        "Gold_league_emblem": "rank-gold",
        "League_emblem_forged_from_dark": "rank-legend",
        "Two_machines_racing": "hero",
        "Empty_starting_grid": "daily",
        "Cyan_spotlight_in_trophy_hall": "leaderboard",
        "Machine_jumping_with_cyan": "pb",
        "Visual_effects_reference_sheet": "ghost-vfx",
        "Garage_interior": "select",
    },
    "cards": {
        "Gambler_character": "char-gambler",
        "Alchemist_character": "char-alchemist",
        "Character_reference_sheet_of_Inq": "char-inquisitor",
        "Thief_holding_curved_knife": "enemy-cutpurse",
        "Brawler_standing_in_dark": "enemy-brawler",
        "Veiled_poisoner": "enemy-poisoner",
        "Fanatic_carrying_heavy_iron_bell": "enemy-zealot",
        "Hostile_marionette": "enemy-marionette",
        "Hostile_usher": "enemy-usher",
        "Ringmaster_performing": "boss-ringmaster",
        "Collector_seated_behind_desk": "boss-collector",
        "Robed_singers_unleashing_crimson": "boss-crimson-choir",
        "Decaying_opera_house_stage": "bg-stage",
        "Decaying_foyer_with_fallen": "bg-foyer",
        "Flooded_catacombs": "bg-catacomb",
        "Empty_theater_viewing_box": "bg-boxes",
        "Theatre_programme": "map",
        "Curiosity_dealer_alcove": "shop",
        "Crimson_table_with_blank_cards": "event",
        "Ornate_playing-card_back": "cardback",
        "Empty_glass_specimen_case": "relic-display",
        "Duellists_seated_at_table": "hero",
        "Winning_hand_glowing_cards": "victory",
        "Blank_card_on_wet_stage": "defeat",
    },
}

# Flow's sparkle: ~50px, bottom-right corner fixed 78px in from right and
# bottom. Box adds ~9px of margin on every side so delogo has clean pixels to
# interpolate from without smearing more of the image than necessary.
LOGO_INSET = 137
LOGO_SIZE = 70


def dims(path: Path) -> tuple[int, int]:
    out = subprocess.run(
        ["identify", "-format", "%w %h", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.split()
    return int(out[0]), int(out[1])


def resolve(folder: str, filename: str) -> str | None:
    for token, role in MAPPING[folder].items():
        if token.lower() in filename.lower():
            return role
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--quality", type=int, default=84)
    args = ap.parse_args()

    plan, problems = [], []

    for folder, game_id in GAMES.items():
        src_dir = PUBLIC / folder
        if not src_dir.is_dir():
            problems.append(f"missing source folder: public/{folder}")
            continue

        files = sorted(
            p for p in src_dir.iterdir()
            if p.suffix.lower() in {".jpeg", ".jpg", ".png", ".webp"}
        )
        seen: dict[str, Path] = {}

        for f in files:
            role = resolve(folder, f.name)
            if role is None:
                problems.append(f"UNMAPPED  public/{folder}/{f.name}")
                continue
            if role in seen:
                problems.append(
                    f"DUPLICATE role '{role}' in {folder}: "
                    f"{seen[role].name} and {f.name}"
                )
                continue
            seen[role] = f
            plan.append((f, OUT_ROOT / game_id / f"{role}.webp"))

        expected = set(MAPPING[folder].values())
        for missing in sorted(expected - set(seen)):
            problems.append(f"MISSING   {folder}: no file matched role '{missing}'")

    for src, dst in plan:
        print(f"  {src.parent.name}/{src.name[:44]:<44} -> games/{dst.parent.name}/{dst.name}")

    print(f"\n{len(plan)} images mapped.")
    if problems:
        print(f"\n{len(problems)} problem(s):")
        for p in problems:
            print(f"  {p}")
        print("\nFix these before running for real.")
        return 1

    if args.dry_run:
        print("\nDry run only. Re-run without --dry-run to write.")
        return 0

    for src, dst in plan:
        dst.parent.mkdir(parents=True, exist_ok=True)
        # The watermark is removed by hand before this runs now, so no delogo.
        # Interpolating a clean image only smears it -- an earlier pass proved
        # that on detailed subjects, where the box left a visible streak.
        vf = []
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", str(src), *vf,
             "-c:v", "libwebp", "-quality", str(args.quality),
             "-compression_level", "6", str(dst)],
            check=True,
        )
        print(f"  wrote games/{dst.parent.name}/{dst.name} "
              f"({dst.stat().st_size // 1024}KB)")

    total = sum(p.stat().st_size for p in OUT_ROOT.rglob("*.webp"))
    print(f"\nDone. public/games total: {total / 1_048_576:.1f}MB")
    print("Spot-check a few corners, then remove the raw folders:")
    for folder in GAMES:
        print(f"  rm -rf public/{folder}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
