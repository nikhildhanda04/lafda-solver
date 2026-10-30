/**
 * Clawd as the mediator: robed, banded, standing.
 *
 * The character is traced cell for cell off the mascot's own sprite sheet
 * rather than remembered — twelve of its pixels across and eight down, an
 * eight-wide block with a two-pixel arm out of each flank, two eyes knocked
 * clean out of the second row, four one-pixel legs with a two-pixel arch
 * between the middle pair, no taper, no antennae, no mouth — and then drawn
 * at twice that resolution, which is the smallest grid the robe, the knot and
 * a balance with a real foot will fit on. Every cell here is half of one of
 * Clawd's own pixels, and nothing in the picture is drawn finer than that.
 *
 * One liberty is taken with the sprite: the head is carried four of its own
 * pixels higher than the sheet draws it, so there is brow above the eyes for
 * the band to sit on. Everything else is the sheet, cell for cell.
 *
 * The band rides above the eyes rather than over them, so the two of them
 * read at once: the eyes are the mascot's, knocked out of the sheet, and are
 * drawn here in the room's own dark so they hold on any ground.
 *
 * Every animated group keeps its translate on an outer wrapper: a CSS
 * transform replaces an SVG transform attribute outright rather than
 * composing with it.
 */

const CELL = 16;
const PAD = 8;
const COLS = 27;
const ROWS = 20;

/** One sprite: rows of "#" cells drawn at a cell offset, runs merged per row. */
function Sprite({ rows, col = 0, row = 0, fill }: {
  rows: readonly string[]; col?: number; row?: number; fill: string;
}) {
  const out: React.ReactElement[] = [];
  rows.forEach((line, r) => {
    let start = -1;
    for (let c = 0; c <= line.length; c++) {
      const on = line[c] === "#";
      if (on && start < 0) start = c;
      if (!on && start >= 0) {
        out.push(
          <rect
            key={`${r}-${start}`}
            x={PAD + (col + start) * CELL}
            y={PAD + (row + r) * CELL}
            width={(c - start) * CELL}
            height={CELL}
            fill={fill}
          />,
        );
        start = -1;
      }
    }
  });
  return <>{out}</>;
}

/* The mascot's own silhouette, at two cells to the pixel. */
const CLAWD = [
  "....################....",
  "....################....",
  "....################....",
  "....################....",
  "....################....",
  "....################....",
  "....##..########..##....",
  "....##..########..##....",
  "########################",
  "########################",
  "########################",
  "########################",
  "....################....",
  "....################....",
  "....################....",
  "....################....",
  "....##..##....##..##....",
  "....##..##....##..##....",
  "....##..##....##..##....",
  "....##..##....##..##....",
] as const;

/* The robe: over the far shoulder, across the body, hem above the knees, with
   two folds falling out of the shoulder so it drapes rather than sits flat. */
const ROBE = [
  "..............##",
  "..........######",
  "......##########",
  "..##############",
  "################",
  "################",
  "###############.",
] as const;
const FOLD = [
  "...........##...",
  ".........##.....",
  ".......##.......",
  ".....##.........",
  "...##...........",
] as const;
const CLASP = ["##", "##"] as const;

/* The band, and the knot tied off behind the head. */
const BAND = ["##################", "##################"] as const;
const KNOT = ["..##", "####", "####", "..##", "..#."] as const;

/* The eyes, one of Clawd's own pixels each, where the sheet knocks them out. */
const EYE = ["##", "##"] as const;


export default function Courtroom() {
  return (
    <svg
      className="court"
      viewBox={`0 0 ${PAD * 2 + COLS * CELL} ${PAD * 2 + ROWS * CELL}`}
      role="img"
      aria-label="Clawd, robed and banded, standing."
      focusable="false"
    >
      <g className="scene">
        <g className="clawd"><g className="clawd-idle">
          <Sprite rows={CLAWD} col={1} row={0} fill="var(--clawd)" />
          <Sprite rows={EYE} col={7} row={6} fill="var(--court)" />
          <Sprite rows={EYE} col={17} row={6} fill="var(--court)" />
          <Sprite rows={ROBE} col={5} row={10} fill="var(--robe-red)" />
          <Sprite rows={FOLD} col={5} row={12} fill="var(--robe-fold)" />
          <Sprite rows={CLASP} col={19} row={10} fill="var(--gold)" />
          <Sprite rows={BAND} col={4} row={3} fill="var(--band)" />
          <Sprite rows={KNOT} col={22} row={2} fill="var(--band)" />
        </g></g>
      </g>
    </svg>
  );
}
