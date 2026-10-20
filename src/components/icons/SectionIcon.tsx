import { Icon, type IconName } from './Icon';

/**
 * ───────────────────────────────────────────────────────────────────────────
 *  SWAP POINT FOR THE HAND-DRAWN ARTWORK
 * ───────────────────────────────────────────────────────────────────────────
 *  Every section/brand icon in the app renders through this one registry, so
 *  replacing the placeholder glyphs with the drawn set is a change to the table
 *  below and nothing else. No screen or card imports an icon for these slots
 *  directly.
 *
 *  To swap a slot, change its entry from:
 *      { kind: 'builtin', name: 'flower', accent: '#dcecc9' }
 *  to:
 *      { kind: 'asset', src: '/icons/goals.svg' }
 *  and drop the file in `public/icons/`.
 *
 *  Artwork spec to hand the illustrator:
 *   · SVG, square viewBox (e.g. 0 0 24 24 or 0 0 96 96), transparent background
 *   · Artwork bleeding to roughly 90% of the box, optically centred
 *   · Full colour is fine — these sit on light tinted chips, not on the artwork
 *   · Strokes outlined/flattened (no live text, no external fonts)
 *   · One file per slot, named for the slot key below
 *  Raster (PNG @3x, 144px) also works if that suits her process better.
 */

export type ArtSlot =
  | 'brand' | 'calendar' | 'today' | 'upcoming' | 'goals' | 'cycle' | 'budget' | 'notes'
  | 'settings' | 'reminder' | 'search';

type ArtSpec =
  | { kind: 'builtin'; name: IconName; accent?: string }
  | { kind: 'asset'; src: string };

export const SECTION_ART: Record<ArtSlot, ArtSpec> = {
  brand: { kind: 'asset', src: '/logo.png' },
  calendar: { kind: 'asset', src: '/calendar.png' },
  today: { kind: 'asset', src: '/today.png' },
  upcoming: { kind: 'asset', src: '/upcoming.png' },
  goals: { kind: 'asset', src: '/goals.png' },
  cycle: { kind: 'asset', src: '/cycle.png' },
  budget: { kind: 'asset', src: '/budget.png' },
  notes: { kind: 'asset', src: '/notes.png' },
  settings: { kind: 'asset', src: '/settings.png' },
  reminder: { kind: 'builtin', name: 'bell', accent: '#ffe6b3' },
  search: { kind: 'asset', src: '/search.png' },
};

interface Props {
  slot: ArtSlot;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export function SectionIcon({ slot, size = 20, color, strokeWidth, style }: Props) {
  const art = SECTION_ART[slot];

  if (art.kind === 'asset') {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static export has no image optimizer; these are small local images
      <img
        src={art.src}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        style={{ display: 'block', flex: 'none', width: size, height: size, objectFit: 'contain', ...style }}
      />
    );
  }

  return <Icon name={art.name} size={size} color={color} accent={art.accent} strokeWidth={strokeWidth} style={style} />;
}
