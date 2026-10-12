/**
 * Text units used by the typing engine.
 *
 * JavaScript string indexes are UTF-16 code-unit indexes.  They split emoji,
 * surrogate pairs, combining marks, and Indic conjuncts, so they are not a
 * useful unit for a typing surface.  Keep all of that knowledge here rather
 * than letting the reducer, scoring code, and caret calculation each grow a
 * subtly different implementation.
 */

export interface GraphemeUnit {
  /** The original spelling of this unit, retained for rendering/input state. */
  value: string;
  /** NFC form used only when comparing two units. */
  normalized: string;
}

type SegmenterLike = {
  segment(value: string): Iterable<{ segment: string }>;
};

function createIntlSegmenter(): SegmenterLike | null {
  // `Intl.Segmenter` is absent in a few older browsers and in some reduced
  // server runtimes.  Resolve it dynamically so the fallback remains usable
  // there instead of making module evaluation fail.
  const intl = typeof Intl === "undefined" ? undefined : Intl as typeof Intl & {
    Segmenter?: new (locale?: string | string[], options?: { granularity: "grapheme" }) => SegmenterLike;
  };
  if (!intl?.Segmenter) return null;
  return new intl.Segmenter("und", { granularity: "grapheme" });
}

const intlSegmenter = createIntlSegmenter();

// Unicode grapheme breaking is a large data table.  This fallback implements
// the stable parts needed by the typing engine: code-point iteration, CRLF,
// combining/spacing marks, variation selectors, emoji modifiers, Indic
// virama conjuncts, ZWJ sequences, and regional-indicator pairs.  It is only
// reached when Intl.Segmenter is unavailable; the table deliberately avoids
// Unicode-property regex syntax so it can still parse in older browsers.
const COMBINING_RANGES: readonly [number, number][] = [
  [0x0300, 0x036f],
  [0x0483, 0x0489],
  [0x0591, 0x05bd],
  [0x05bf, 0x05c7],
  [0x0610, 0x061a],
  [0x064b, 0x065f],
  [0x0670, 0x0670],
  [0x06d6, 0x06dc],
  [0x06df, 0x06e4],
  [0x06e7, 0x06e8],
  [0x06ea, 0x06ed],
  [0x0711, 0x0711],
  [0x0730, 0x074a],
  [0x07a6, 0x07b0],
  [0x07eb, 0x07f3],
  [0x0816, 0x0819],
  [0x081b, 0x0823],
  [0x0825, 0x0827],
  [0x0829, 0x082d],
  [0x0859, 0x085b],
  [0x08d3, 0x08e1],
  [0x08e3, 0x0903],
  [0x093a, 0x094f],
  [0x0951, 0x0957],
  [0x0962, 0x0963],
  [0x0981, 0x0983],
  [0x09bc, 0x09cd],
  [0x09d7, 0x09d7],
  [0x09e2, 0x09e3],
  [0x0a01, 0x0a03],
  [0x0a3c, 0x0a4d],
  [0x0a51, 0x0a51],
  [0x0a70, 0x0a71],
  [0x0a75, 0x0a75],
  [0x0a81, 0x0a83],
  [0x0abc, 0x0acd],
  [0x0ae2, 0x0ae3],
  [0x0b01, 0x0b03],
  [0x0b3c, 0x0b4d],
  [0x0b56, 0x0b57],
  [0x0b62, 0x0b63],
  [0x0b82, 0x0b83],
  [0x0bbc, 0x0bcd],
  [0x0bd7, 0x0bd7],
  [0x0c00, 0x0c04],
  [0x0c3c, 0x0c4d],
  [0x0c55, 0x0c56],
  [0x0c62, 0x0c63],
  [0x0c81, 0x0c83],
  [0x0cbc, 0x0ccd],
  [0x0cd5, 0x0cd6],
  [0x0ce2, 0x0ce3],
  [0x0d00, 0x0d03],
  [0x0d3b, 0x0d3c],
  [0x0d3e, 0x0d4d],
  [0x0d57, 0x0d57],
  [0x0d62, 0x0d63],
  [0x0dca, 0x0dca],
  [0x0dcf, 0x0ddf],
  [0x0e31, 0x0e31],
  [0x0e34, 0x0e3a],
  [0x0e47, 0x0e4e],
  [0x0eb1, 0x0eb1],
  [0x0eb4, 0x0ebc],
  [0x0ec8, 0x0ecd],
  [0x0f18, 0x0f19],
  [0x0f35, 0x0f39],
  [0x0f71, 0x0f84],
  [0x0f86, 0x0f87],
  [0x0f8d, 0x0f97],
  [0x0f99, 0x0fbc],
  [0x0fc6, 0x0fc6],
  [0x102b, 0x103e],
  [0x1056, 0x1059],
  [0x105e, 0x1060],
  [0x1062, 0x1064],
  [0x1067, 0x106d],
  [0x1071, 0x1074],
  [0x1082, 0x108d],
  [0x108f, 0x108f],
  [0x109a, 0x109d],
  [0x135d, 0x135f],
  [0x1712, 0x1714],
  [0x1732, 0x1734],
  [0x1752, 0x1753],
  [0x1772, 0x1773],
  [0x17b4, 0x17d3],
  [0x17dd, 0x17dd],
  [0x180b, 0x180f],
  [0x1885, 0x1886],
  [0x18a9, 0x18a9],
  [0x1920, 0x193b],
  [0x1a17, 0x1a1b],
  [0x1a55, 0x1a5e],
  [0x1a60, 0x1a7c],
  [0x1ab0, 0x1ace],
  [0x1b00, 0x1b04],
  [0x1b34, 0x1b44],
  [0x1b6b, 0x1b73],
  [0x1b80, 0x1b82],
  [0x1ba1, 0x1bad],
  [0x1be6, 0x1bf3],
  [0x1c24, 0x1c37],
  [0x1cd0, 0x1cf9],
  [0x1dc0, 0x1dff],
  [0x20d0, 0x20ff],
  [0x2cef, 0x2cf1],
  [0x2d7f, 0x2d7f],
  [0xa66f, 0xa672],
  [0xa674, 0xa67d],
  [0xa69e, 0xa69f],
  [0xa6f0, 0xa6f1],
  [0xa802, 0xa802],
  [0xa806, 0xa806],
  [0xa80b, 0xa80b],
  [0xa823, 0xa827],
  [0xa880, 0xa881],
  [0xa8b4, 0xa8c5],
  [0xa8e0, 0xa8f1],
  [0xa926, 0xa92f],
  [0xa947, 0xa953],
  [0xa980, 0xa983],
  [0xa9b3, 0xa9c0],
  [0xa9e5, 0xa9e5],
  [0xaa29, 0xaa36],
  [0xaa43, 0xaa43],
  [0xaa4c, 0xaa4d],
  [0xaa7b, 0xaa7d],
  [0xaab0, 0xaab0],
  [0xaab2, 0xaab4],
  [0xaab7, 0xaab8],
  [0xaabe, 0xaabf],
  [0xaac1, 0xaac1],
  [0xaaeb, 0xaaef],
  [0xaaf5, 0xaaf5],
  [0xabe3, 0xabea],
  [0xabec, 0xabed],
  [0xfb1e, 0xfb1e],
  [0xfe00, 0xfe0f],
  [0xfe20, 0xfe2f],
  [0xff9e, 0xff9f],
  [0x101fd, 0x101fd],
  [0x102e0, 0x102e0],
  [0x10376, 0x1037a],
  [0x10a01, 0x10a0f],
  [0x10a38, 0x10a3f],
  [0x10ae5, 0x10ae6],
  [0x10d24, 0x10d27],
  [0x10eab, 0x10eac],
  [0x10f46, 0x10f50],
  [0x11001, 0x11002],
  [0x11038, 0x11046],
  [0x11070, 0x11074],
  [0x1107f, 0x11082],
  [0x110b0, 0x110ba],
  [0x11100, 0x11102],
  [0x11127, 0x11134],
  [0x11145, 0x11146],
  [0x11173, 0x11173],
  [0x11180, 0x11182],
  [0x111b3, 0x111c0],
  [0x111c9, 0x111cc],
  [0x1122f, 0x1123e],
  [0x11241, 0x11241],
  [0x112df, 0x112ea],
  [0x11300, 0x11303],
  [0x1133b, 0x1134d],
  [0x11357, 0x11357],
  [0x11362, 0x11363],
  [0x11435, 0x11446],
  [0x1145e, 0x1145e],
  [0x114b0, 0x114c3],
  [0x114c6, 0x114c6],
  [0x115af, 0x115b5],
  [0x115b8, 0x115c0],
  [0x115dc, 0x115dd],
  [0x11630, 0x11640],
  [0x116ab, 0x116b7],
  [0x116b9, 0x116b9],
  [0x1171d, 0x1172b],
  [0x11730, 0x1173b],
  [0x1182f, 0x1183a],
  [0x11839, 0x1183a],
  [0x1193b, 0x1193e],
  [0x11943, 0x11943],
  [0x119d1, 0x119d7],
  [0x119da, 0x119e0],
  [0x11a01, 0x11a0a],
  [0x11a33, 0x11a39],
  [0x11a3b, 0x11a3e],
  [0x11a47, 0x11a47],
  [0x11a51, 0x11a5b],
  [0x11a8a, 0x11a99],
  [0x11c30, 0x11c46],
  [0x11c92, 0x11ca7],
  [0x11ca9, 0x11cb6],
  [0x11d31, 0x11d36],
  [0x11d3a, 0x11d3a],
  [0x11d3c, 0x11d3d],
  [0x11d3f, 0x11d45],
  [0x11d47, 0x11d47],
  [0x11d90, 0x11d91],
  [0x11d95, 0x11d95],
  [0x11ef3, 0x11ef6],
  [0x16af0, 0x16af4],
  [0x16b30, 0x16b36],
  [0x16f4f, 0x16f4f],
  [0x16f8f, 0x16f92],
  [0x1bc9d, 0x1bc9e],
  [0x1d167, 0x1d169],
  [0x1d17b, 0x1d182],
  [0x1d185, 0x1d18b],
  [0x1d1aa, 0x1d1ad],
  [0x1d242, 0x1d244],
  [0x1da00, 0x1da36],
  [0x1da3b, 0x1da6c],
  [0x1da75, 0x1da75],
  [0x1da84, 0x1da84],
  [0x1da9b, 0x1da9f],
  [0x1daa1, 0x1daaf],
  [0x1e000, 0x1e02a],
  [0x1e130, 0x1e136],
  [0x1e2ae, 0x1e2ae],
  [0x1e2ec, 0x1e2ef],
  [0x1e4ec, 0x1e4ef],
  [0x1e8d0, 0x1e8d6],
  [0x1e944, 0x1e94a],
  [0x200c, 0x200d],
  [0xe0100, 0xe01ef],
];

const VIRAMA_RANGES: readonly [number, number][] = [
  [0x094d, 0x094d],
  [0x09cd, 0x09cd],
  [0x0a4d, 0x0a4d],
  [0x0acd, 0x0acd],
  [0x0b4d, 0x0b4d],
  [0x0bcd, 0x0bcd],
  [0x0c4d, 0x0c4d],
  [0x0ccd, 0x0ccd],
  [0x0d3b, 0x0d3b],
  [0x0d4d, 0x0d4d],
  [0x0dca, 0x0dca],
  [0x1039, 0x103a],
  [0x17d2, 0x17d2],
  [0x1a60, 0x1a60],
  [0x1b44, 0x1b44],
  [0xa806, 0xa806],
  [0xa8c4, 0xa8c4],
  [0xa953, 0xa953],
  [0xa9c0, 0xa9c0],
  [0xaa4d, 0xaa4d],
  [0xabed, 0xabed],
];

function inRange(codePoint: number, ranges: readonly [number, number][]): boolean {
  for (const [start, end] of ranges) {
    if (codePoint >= start && codePoint <= end) return true;
  }
  return false;
}

function codePointOf(value: string): number {
  return value.codePointAt(0) ?? 0;
}

function isCombiningMark(value: string): boolean {
  const codePoint = codePointOf(value);
  return inRange(codePoint, COMBINING_RANGES);
}

function isVirama(value: string): boolean {
  return inRange(codePointOf(value), VIRAMA_RANGES);
}

function isRegionalIndicator(value: string): boolean {
  const codePoint = codePointOf(value);
  return codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff;
}

function isEmojiModifier(value: string): boolean {
  const codePoint = codePointOf(value);
  return codePoint >= 0x1f3fb && codePoint <= 0x1f3ff;
}

function isZeroWidthJoiner(value: string): boolean {
  return codePointOf(value) === 0x200d;
}

/** Deterministic fallback used when Intl.Segmenter is not available. */
export function segmentGraphemesFallback(value: string): string[] {
  const codePoints = Array.from(value);
  const result: string[] = [];
  let current = "";
  let regionalIndicators = 0;

  for (let i = 0; i < codePoints.length; i++) {
    const codePoint = codePoints[i];
    const previous = codePoints[i - 1];
    const joinsPrevious =
      current.length > 0 &&
      (codePoint === "\u200d" ||
        isCombiningMark(codePoint) ||
        isEmojiModifier(codePoint) ||
        isVirama(previous ?? "") ||
        isZeroWidthJoiner(previous ?? "") ||
        (isRegionalIndicator(codePoint) && regionalIndicators % 2 === 1));

    if (joinsPrevious) {
      current += codePoint;
    } else {
      if (current) result.push(current);
      current = codePoint;
    }

    if (isRegionalIndicator(codePoint)) regionalIndicators++;
    else regionalIndicators = 0;
  }
  if (current) result.push(current);

  // CRLF is the one two-code-point control sequence treated as one extended
  // grapheme.  Merge it after the simple pass to keep the loop readable.
  const merged: string[] = [];
  for (const unit of result) {
    const previous = merged[merged.length - 1];
    if (previous === "\r" && unit === "\n") merged[merged.length - 1] = "\r\n";
    else merged.push(unit);
  }
  return merged;
}

/** Segments the original spelling without rewriting its code points. */
export function segmentGraphemes(value: string): string[] {
  if (!value) return [];
  if (!intlSegmenter) return segmentGraphemesFallback(value);
  return Array.from(intlSegmenter.segment(value), ({ segment }) => segment);
}

/** NFC is canonical equivalence only; unlike NFKC it does not fold marks or compatibility characters. */
export function normalizeForComparison(value: string): string {
  return typeof value.normalize === "function" ? value.normalize("NFC") : value;
}

/** Grapheme units in the canonical form used for comparisons and edit diffs. */
export function comparisonGraphemes(value: string): string[] {
  return segmentGraphemes(normalizeForComparison(value));
}

export function graphemeUnits(value: string): GraphemeUnit[] {
  return segmentGraphemes(value).map((unit) => ({ value: unit, normalized: normalizeForComparison(unit) }));
}

export function graphemeLength(value: string): number {
  return segmentGraphemes(value).length;
}

export function graphemeEqual(left: string, right: string): boolean {
  return normalizeForComparison(left) === normalizeForComparison(right);
}

export function graphemeStartsWith(value: string, prefix: string): boolean {
  const valueUnits = comparisonGraphemes(value);
  const prefixUnits = comparisonGraphemes(prefix);
  if (prefixUnits.length > valueUnits.length) return false;
  return prefixUnits.every((unit, index) => unit === valueUnits[index]);
}
