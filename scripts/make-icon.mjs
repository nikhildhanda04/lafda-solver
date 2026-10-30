/**
 * Emits app/icon.svg from the same cell data the hero draws Clawd with, so the
 * tab icon and the figure on the page cannot drift apart:
 *
 *   node scripts/make-icon.mjs > app/icon.svg
 *
 * The two raster fallbacks beside it, app/icon.png and app/favicon.ico, are
 * rendered from that SVG at integer multiples of the cell (128, then 64/32/16)
 * so the grid stays square at every size. Regenerate them if the figure
 * changes; the SVG alone is what browsers that matter actually use.
 *
 * No dependencies on purpose: plain node, no build step.
 */
const CLAWD = [
  "....################....","....################....","....################....",
  "....################....","....################....","....################....",
  "....##..########..##....","....##..########..##....",
  "########################","########################","########################","########################",
  "....################....","....################....","....################....","....################....",
  "....##..##....##..##....","....##..##....##..##....","....##..##....##..##....","....##..##....##..##....",
];
const ROBE = ["..............##","..........######","......##########","..##############","################","################","###############."];
const FOLD = ["...........##...",".........##.....",".......##.......",".....##.........","...##..........."];
const CLASP = ["##","##"];
const BAND = ["##################","##################"];
const KNOT = ["..##","####","####","..##","..#."];
const EYE = ["##","##"];

// Clawd sits at col 1 in the hero; the knot runs to col 25, the feet to row 19.
const parts = [
  [CLAWD, 1, 0, "clawd"], [EYE, 7, 6, "eye"], [EYE, 17, 6, "eye"],
  [ROBE, 5, 10, "robe"], [FOLD, 5, 12, "fold"], [CLASP, 19, 10, "gold"],
  [BAND, 4, 3, "band"], [KNOT, 22, 2, "band"],
];

// Square frame with the figure centred: 25 cells wide, 20 tall.
const SIZE = 25, OX = -1, OY = 2.5;
const COLOUR = { clawd: "#d97757", eye: "#10131a", robe: "#b3353a", fold: "#7e2026", gold: "#e3a83c", band: "#eceade" };

const rects = [];
for (const [rows, col, row, kind] of parts) {
  rows.forEach((line, r) => {
    let start = -1;
    for (let c = 0; c <= line.length; c++) {
      const on = line[c] === "#";
      if (on && start < 0) start = c;
      if (!on && start >= 0) {
        rects.push(`<rect x="${OX + col + start}" y="${OY + row + r}" width="${c - start}" height="1" fill="${COLOUR[kind]}"/>`);
        start = -1;
      }
    }
  });
}

process.stdout.write(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" shape-rendering="crispEdges">` +
  `<rect width="${SIZE}" height="${SIZE}" fill="#10131a"/>` + rects.join("") + `</svg>\n`,
);
