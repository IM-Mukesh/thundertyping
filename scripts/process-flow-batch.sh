#!/usr/bin/env bash
#
# Turn a folder of raw Flow output into named, watermark-free WebP art.
#
# Flow does not reliably honour requested filenames, but it does emit images in
# the order they were prompted. So this maps by SORTED POSITION, not by name:
# the Nth file in the folder becomes the Nth asset of that batch.
#
#   ./scripts/process-flow-batch.sh 1 ~/Downloads/flow-batch-1
#
# Check the dry-run mapping it prints BEFORE letting it write anything.

set -euo pipefail

BATCH="${1:-}"
SRC="${2:-}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/games"

if [[ -z "$BATCH" || -z "$SRC" ]]; then
  echo "usage: $0 <batch-number 1-4> <source-folder>" >&2
  exit 1
fi

names_1=(
  spellbound-char-apprentice spellbound-char-battlemage spellbound-char-rogue-mage
  spellbound-char-chronomancer spellbound-char-void-mage spellbound-enemy-inkwraith
  spellbound-enemy-grimoire spellbound-enemy-scribe spellbound-enemy-sentinel
  spellbound-elite-archivist spellbound-elite-cipher spellbound-boss-iron-golem
  spellbound-boss-word-eater spellbound-boss-mirror-mage spellbound-boss-void-king
  spellbound-bg-dungeon spellbound-bg-treasure spellbound-bg-shop
  spellbound-bg-event spellbound-hero spellbound-select
  spellbound-victory spellbound-defeat spellbound-map
)
names_2=(
  survivor-char-warden survivor-char-ranger survivor-char-pyromancer
  survivor-char-duelist survivor-enemy-swarmling survivor-enemy-brute
  survivor-enemy-slinger survivor-enemy-stalker survivor-enemy-bloater
  survivor-enemy-bulwark survivor-elite-warchief survivor-elite-hexer
  survivor-boss-siegebeast survivor-boss-plaguemother survivor-boss-ashen-knight
  survivor-bg-waystation survivor-bg-ashfields survivor-bg-quarry
  survivor-bg-bridge survivor-hero survivor-select
  survivor-upgrade survivor-victory survivor-defeat
)
names_3=(
  racer-char-veteran racer-char-rookie racer-char-phantom
  racer-char-champion racer-bike-standard racer-bike-phantom
  racer-bg-neoncity racer-bg-coastal racer-bg-tunnel
  racer-bg-desert racer-start racer-finish
  racer-victory racer-defeat racer-rank-bronze
  racer-rank-silver racer-rank-gold racer-rank-legend
  racer-hero racer-daily racer-leaderboard
  racer-pb racer-ghost-vfx racer-select
)
names_4=(
  cards-char-gambler cards-char-alchemist cards-char-inquisitor
  cards-enemy-cutpurse cards-enemy-brawler cards-enemy-poisoner
  cards-enemy-zealot cards-enemy-marionette cards-enemy-usher
  cards-boss-ringmaster cards-boss-collector cards-boss-crimson-choir
  cards-bg-stage cards-bg-foyer cards-bg-catacomb
  cards-bg-boxes cards-map cards-shop
  cards-event cards-cardback cards-relic-display
  cards-hero cards-victory cards-defeat
)

case "$BATCH" in
  1) names=("${names_1[@]}") ;;
  2) names=("${names_2[@]}") ;;
  3) names=("${names_3[@]}") ;;
  4) names=("${names_4[@]}") ;;
  *) echo "batch must be 1, 2, 3 or 4" >&2; exit 1 ;;
esac

mapfile -t files < <(find "$SRC" -maxdepth 1 -type f \
  \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' \) | sort)

echo "Found ${#files[@]} images, expected ${#names[@]}."
echo

# Dry run first. Sorted order is a guess at generation order, so a human has to
# confirm the pairing before anything is written.
for i in "${!files[@]}"; do
  [[ $i -ge ${#names[@]} ]] && { echo "EXTRA (ignored): ${files[$i]}"; continue; }
  printf '%2d  %-40s -> %s.webp\n' "$((i+1))" "$(basename "${files[$i]}")" "${names[$i]}"
done

if [[ ${#files[@]} -ne ${#names[@]} ]]; then
  echo
  echo "COUNT MISMATCH — fix the folder before continuing." >&2
  exit 1
fi

echo
read -r -p "Does every pairing above look right? [y/N] " ok
[[ "$ok" == "y" || "$ok" == "Y" ]] || { echo "Aborted."; exit 1; }

mkdir -p "$OUT"
for i in "${!files[@]}"; do
  src="${files[$i]}"
  name="${names[$i]}"

  # Flow bakes a small sparkle into a corner even when it reports none. delogo
  # interpolates the patch away from surrounding pixels. The box is sized
  # generously and sits bottom-right where Flow has consistently placed it.
  W=$(identify -format '%w' "$src")
  H=$(identify -format '%h' "$src")
  DW=$(( W * 6 / 100 )); DH=$(( H * 7 / 100 ))
  DX=$(( W - DW - W / 100 )); DY=$(( H - DH - H / 100 ))

  # delogo and WebP encode in one pass via ffmpeg's built-in libwebp, so this
  # needs no cwebp install. q 84 matches the existing art in public/games.
  ffmpeg -loglevel error -y -i "$src" \
    -vf "delogo=x=${DX}:y=${DY}:w=${DW}:h=${DH}" \
    -c:v libwebp -quality 84 -compression_level 6 \
    "$OUT/${name}.webp"

  printf '  wrote %s.webp (%s)\n' "$name" "$(du -h "$OUT/${name}.webp" | cut -f1)"
done

echo
echo "Done. Total public/games size: $(du -sh "$OUT" | cut -f1)"
echo "Spot-check the corners of a few files before committing."
