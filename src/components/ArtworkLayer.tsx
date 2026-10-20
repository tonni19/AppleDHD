'use client';

interface Props {
  artworkUrl: string;
  enabled: boolean;
}

/** The artwork's own wall colour, so anything the image does not cover blends in. */
const WALL = '#f8a988';

/**
 * The backdrop behind every screen.
 *
 * The artwork is a flat wall with its scene along the bottom edge, so it is pinned
 * to the bottom: however tall or short the screen, the scene stays whole and any
 * spare height is plain wall at the top. It does not move on scroll — panning would
 * slide the scene out of view.
 */
export function ArtworkLayer({ artworkUrl, enabled }: Props) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', background: WALL }}>
      {enabled && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("${artworkUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}

      {/* A faint shade at the very top keeps the status bar readable on the light wall. */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(60,10,6,.2) 0%, rgba(60,10,6,0) 12%)' }} />
    </div>
  );
}
