import type { ReactNode } from 'react';

/**
 * The house icon set.
 *
 * Drawn to sit beside the app's 3px ink borders: a 24px grid, 2.4px strokes,
 * round caps and joins, and a few shapes carrying an optional filled accent so
 * the signature icons (tomato, flower, drop) keep the two-tone sticker look.
 * Replaces the emoji the UI used to render as icons, which also read as literal
 * words to a screen reader.
 */
export type IconName =
  | 'tomato' | 'calendar' | 'sun' | 'star' | 'flower' | 'drop' | 'coin' | 'note'
  | 'home' | 'notepad' | 'chevronLeft' | 'chevronRight' | 'chevronDown' | 'chevronUp' | 'close'
  | 'plus' | 'minus' | 'check' | 'trash' | 'sliders' | 'gear' | 'search' | 'download'
  | 'upload' | 'pencil' | 'bell' | 'clock' | 'heart' | 'leaf' | 'undo' | 'more'
  | 'bars' | 'eye' | 'eyeOff' | 'backspace' | 'refresh' | 'drag' | 'info'
  | 'pin' | 'pinOff' | 'board' | 'checklist';

interface Props {
  name: IconName;
  size?: number;
  /** Stroke colour. Defaults to the inherited text colour. */
  color?: string;
  /** Fill for the accent shape on the icons that have one. */
  accent?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

function glyph(name: IconName, accent: string | undefined): ReactNode {
  switch (name) {
    case 'tomato':
      return (
        <>
          <path d="M12 7.2c4.1 0 7.2 3 7.2 6.9 0 3.9-3.2 6.7-7.2 6.7s-7.2-2.8-7.2-6.7c0-3.9 3.1-6.9 7.2-6.9Z" fill={accent} />
          <path d="M12 7.2c4.1 0 7.2 3 7.2 6.9 0 3.9-3.2 6.7-7.2 6.7s-7.2-2.8-7.2-6.7c0-3.9 3.1-6.9 7.2-6.9Z" />
          <path d="M12 7.2 8.4 5.4M12 7.2l3.6-1.8M12 7.2V3.4" />
        </>
      );
    case 'calendar':
      return (
        <>
          <rect x="3.2" y="5.6" width="17.6" height="15.2" rx="3.4" fill={accent} />
          <rect x="3.2" y="5.6" width="17.6" height="15.2" rx="3.4" />
          <path d="M3.2 10.4h17.6M8.4 3.2v4.4M15.6 3.2v4.4" />
        </>
      );
    case 'sun':
      return (
        <>
          <circle cx="12" cy="12" r="4.2" fill={accent} />
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.6v2.2M12 19.2v2.2M4.35 4.35l1.6 1.6M18.05 18.05l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.35 19.65l1.6-1.6M18.05 5.95l1.6-1.6" />
        </>
      );
    case 'star':
      return (
        <>
          <path d="M12 3.4l2.7 5.5 6 .9-4.35 4.24 1.03 6-5.38-2.83-5.38 2.83 1.03-6L3.3 9.8l6-.9L12 3.4Z" fill={accent} />
          <path d="M12 3.4l2.7 5.5 6 .9-4.35 4.24 1.03 6-5.38-2.83-5.38 2.83 1.03-6L3.3 9.8l6-.9L12 3.4Z" />
        </>
      );
    case 'flower':
      return (
        <>
          <g fill={accent}>
            <ellipse cx="12" cy="6.6" rx="3" ry="3.4" />
            <ellipse cx="17.1" cy="10.3" rx="3.4" ry="3" />
            <ellipse cx="15.2" cy="16.4" rx="3.2" ry="3.1" />
            <ellipse cx="8.8" cy="16.4" rx="3.2" ry="3.1" />
            <ellipse cx="6.9" cy="10.3" rx="3.4" ry="3" />
          </g>
          <ellipse cx="12" cy="6.6" rx="3" ry="3.4" />
          <ellipse cx="17.1" cy="10.3" rx="3.4" ry="3" />
          <ellipse cx="15.2" cy="16.4" rx="3.2" ry="3.1" />
          <ellipse cx="8.8" cy="16.4" rx="3.2" ry="3.1" />
          <ellipse cx="6.9" cy="10.3" rx="3.4" ry="3" />
          <circle cx="12" cy="12.2" r="2.3" fill="none" />
        </>
      );
    case 'drop':
      return (
        <>
          <path d="M12 3.2c3.6 4.4 5.7 7.3 5.7 9.9a5.7 5.7 0 1 1-11.4 0c0-2.6 2.1-5.5 5.7-9.9Z" fill={accent} />
          <path d="M12 3.2c3.6 4.4 5.7 7.3 5.7 9.9a5.7 5.7 0 1 1-11.4 0c0-2.6 2.1-5.5 5.7-9.9Z" />
        </>
      );
    case 'coin':
      return (
        <>
          <circle cx="12" cy="12" r="8.6" fill={accent} />
          <circle cx="12" cy="12" r="8.6" />
          <path d="M14.6 9.1c-.7-.8-1.7-1.2-2.8-1.2-1.6 0-2.7.9-2.7 2.1 0 2.8 5.6 1.3 5.6 4.1 0 1.3-1.2 2.2-2.9 2.2-1.2 0-2.2-.4-2.9-1.2M12 6.2v1.7M12 16.1v1.7" />
        </>
      );
    case 'note':
    case 'notepad':
      return (
        <>
          <path d="M6 3.4h9.2L19.6 8v12.6a1.4 1.4 0 0 1-1.4 1.4H6a1.4 1.4 0 0 1-1.4-1.4V4.8A1.4 1.4 0 0 1 6 3.4Z" fill={accent} />
          <path d="M6 3.4h9.2L19.6 8v12.6a1.4 1.4 0 0 1-1.4 1.4H6a1.4 1.4 0 0 1-1.4-1.4V4.8A1.4 1.4 0 0 1 6 3.4Z" />
          <path d="M14.8 3.6V8h4.6M8.2 12.6h7.6M8.2 16.4h5.2" />
        </>
      );
    case 'home':
      return (
        <>
          <path d="M3.8 10.6 12 3.8l8.2 6.8v9a1.4 1.4 0 0 1-1.4 1.4H5.2a1.4 1.4 0 0 1-1.4-1.4v-9Z" fill={accent} />
          <path d="M3.8 10.6 12 3.8l8.2 6.8v9a1.4 1.4 0 0 1-1.4 1.4H5.2a1.4 1.4 0 0 1-1.4-1.4v-9Z" />
          <path d="M9.4 21v-6.2h5.2V21" />
        </>
      );
    case 'chevronLeft':
      return <path d="M15 4.8 7.6 12 15 19.2" />;
    case 'chevronRight':
      return <path d="M9 4.8 16.4 12 9 19.2" />;
    case 'chevronDown':
      return <path d="M4.8 9 12 16.4 19.2 9" />;
    case 'close':
      return <path d="M5.6 5.6 18.4 18.4M18.4 5.6 5.6 18.4" />;
    case 'plus':
      return <path d="M12 4.6v14.8M4.6 12h14.8" />;
    case 'minus':
      return <path d="M4.6 12h14.8" />;
    case 'check':
      return <path d="M4.8 12.6 9.8 17.6 19.2 6.8" />;
    case 'trash':
      return (
        <>
          <path d="M4.4 6.6h15.2M9.4 6.6V4.8a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4v1.8" />
          <path d="M6.4 6.6h11.2l-.9 13a1.4 1.4 0 0 1-1.4 1.3H8.7a1.4 1.4 0 0 1-1.4-1.3l-.9-13Z" fill={accent} />
          <path d="M6.4 6.6h11.2l-.9 13a1.4 1.4 0 0 1-1.4 1.3H8.7a1.4 1.4 0 0 1-1.4-1.3l-.9-13Z" />
          <path d="M10.3 10.4v6.8M13.7 10.4v6.8" />
        </>
      );
    case 'gear':
      return (
        <>
          <path d="M10.05 1.99 L13.95 1.99 L14.77 5.14 L16.14 5.87 L17.70 3.54 L20.46 6.30 L18.81 9.11 L19.26 10.59 L22.01 10.05 L22.01 13.95 L18.86 14.77 L18.13 16.14 L20.46 17.70 L17.70 20.46 L14.89 18.81 L13.41 19.26 L13.95 22.01 L10.05 22.01 L9.23 18.86 L7.86 18.13 L6.30 20.46 L3.54 17.70 L5.19 14.89 L4.74 13.41 L1.99 13.95 L1.99 10.05 L5.14 9.23 L5.87 7.86 L3.54 6.30 L6.30 3.54 L9.11 5.19 L10.59 4.74 Z" fill={accent} />
          <path d="M10.05 1.99 L13.95 1.99 L14.77 5.14 L16.14 5.87 L17.70 3.54 L20.46 6.30 L18.81 9.11 L19.26 10.59 L22.01 10.05 L22.01 13.95 L18.86 14.77 L18.13 16.14 L20.46 17.70 L17.70 20.46 L14.89 18.81 L13.41 19.26 L13.95 22.01 L10.05 22.01 L9.23 18.86 L7.86 18.13 L6.30 20.46 L3.54 17.70 L5.19 14.89 L4.74 13.41 L1.99 13.95 L1.99 10.05 L5.14 9.23 L5.87 7.86 L3.54 6.30 L6.30 3.54 L9.11 5.19 L10.59 4.74 Z" />
          <circle cx="12" cy="12" r="3.4" fill="none" />
        </>
      );
    case 'pin':
      return (
        <>
          <path d="M9 3.6h6l-.9 5.4 3.5 3.2v1.8H6.4v-1.8l3.5-3.2L9 3.6Z" fill={accent} />
          <path d="M9 3.6h6l-.9 5.4 3.5 3.2v1.8H6.4v-1.8l3.5-3.2L9 3.6Z" />
          <path d="M12 14v6.4" />
        </>
      );
    case 'pinOff':
      return (
        <>
          <path d="M9 3.6h6l-.9 5.4 3.5 3.2v1.8H6.4v-1.8l3.5-3.2L9 3.6Z" />
          <path d="M12 14v6.4M4 4l16 16" />
        </>
      );
    case 'board':
      return (
        <>
          <rect x="3.4" y="4" width="7.6" height="7.6" rx="2" fill={accent} />
          <rect x="3.4" y="4" width="7.6" height="7.6" rx="2" />
          <rect x="13" y="4" width="7.6" height="5.4" rx="2" fill={accent} />
          <rect x="13" y="4" width="7.6" height="5.4" rx="2" />
          <rect x="3.4" y="13.6" width="7.6" height="6.4" rx="2" fill={accent} />
          <rect x="3.4" y="13.6" width="7.6" height="6.4" rx="2" />
          <rect x="13" y="11.4" width="7.6" height="8.6" rx="2" fill={accent} />
          <rect x="13" y="11.4" width="7.6" height="8.6" rx="2" />
        </>
      );
    case 'checklist':
      return (
        <>
          <rect x="3.2" y="4" width="7" height="7" rx="2" fill={accent} />
          <rect x="3.2" y="4" width="7" height="7" rx="2" />
          <path d="M5 7.5 6.5 9l2.4-2.6" />
          <rect x="3.2" y="13" width="7" height="7" rx="2" />
          <path d="M13.4 7.5h7.4M13.4 16.5h7.4" />
        </>
      );
    case 'chevronUp':
      return <path d="M4.8 15 12 7.6 19.2 15" />;
    case 'sliders':
      return (
        <>
          <path d="M3.6 7.2h16.8M3.6 12h16.8M3.6 16.8h16.8" />
          <circle cx="8.6" cy="7.2" r="2.5" fill={accent} />
          <circle cx="8.6" cy="7.2" r="2.5" />
          <circle cx="15.4" cy="12" r="2.5" fill={accent} />
          <circle cx="15.4" cy="12" r="2.5" />
          <circle cx="9.8" cy="16.8" r="2.5" fill={accent} />
          <circle cx="9.8" cy="16.8" r="2.5" />
        </>
      );
    case 'search':
      return (
        <>
          <circle cx="10.8" cy="10.8" r="6.6" fill={accent} />
          <circle cx="10.8" cy="10.8" r="6.6" />
          <path d="M15.6 15.6 20.4 20.4" />
        </>
      );
    case 'download':
      return (
        <>
          <path d="M12 3.8v11.4M7.4 10.8 12 15.4l4.6-4.6" />
          <path d="M4.4 16.4v2.4a1.6 1.6 0 0 0 1.6 1.6h12a1.6 1.6 0 0 0 1.6-1.6v-2.4" />
        </>
      );
    case 'upload':
      return (
        <>
          <path d="M12 15.4V4M7.4 8.6 12 4l4.6 4.6" />
          <path d="M4.4 16.4v2.4a1.6 1.6 0 0 0 1.6 1.6h12a1.6 1.6 0 0 0 1.6-1.6v-2.4" />
        </>
      );
    case 'pencil':
      return (
        <>
          <path d="M16.4 3.9a2.2 2.2 0 0 1 3.1 3.1L8.2 18.3l-4.2 1.1 1.1-4.2L16.4 3.9Z" fill={accent} />
          <path d="M16.4 3.9a2.2 2.2 0 0 1 3.1 3.1L8.2 18.3l-4.2 1.1 1.1-4.2L16.4 3.9Z" />
          <path d="M14.8 5.6 17.9 8.7" />
        </>
      );
    case 'bell':
      return (
        <>
          <path d="M12 3.2a5.8 5.8 0 0 1 5.8 5.8c0 4.4 1.4 5.8 1.4 5.8H4.8s1.4-1.4 1.4-5.8A5.8 5.8 0 0 1 12 3.2Z" fill={accent} />
          <path d="M12 3.2a5.8 5.8 0 0 1 5.8 5.8c0 4.4 1.4 5.8 1.4 5.8H4.8s1.4-1.4 1.4-5.8A5.8 5.8 0 0 1 12 3.2Z" />
          <path d="M10 18.2a2.2 2.2 0 0 0 4 0" />
        </>
      );
    case 'clock':
      return (
        <>
          <circle cx="12" cy="12" r="8.6" fill={accent} />
          <circle cx="12" cy="12" r="8.6" />
          <path d="M12 6.8V12l3.6 2.4" />
        </>
      );
    case 'heart':
      return (
        <>
          <path d="M12 20.2S3.8 15.4 3.8 9.7a4.5 4.5 0 0 1 8.2-2.6 4.5 4.5 0 0 1 8.2 2.6c0 5.7-8.2 10.5-8.2 10.5Z" fill={accent} />
          <path d="M12 20.2S3.8 15.4 3.8 9.7a4.5 4.5 0 0 1 8.2-2.6 4.5 4.5 0 0 1 8.2 2.6c0 5.7-8.2 10.5-8.2 10.5Z" />
        </>
      );
    case 'leaf':
      return (
        <>
          <path d="M20 4c0 9.4-4.7 14.1-10.4 14.1A5.6 5.6 0 0 1 4 12.5C4 6.8 10.6 4 20 4Z" fill={accent} />
          <path d="M20 4c0 9.4-4.7 14.1-10.4 14.1A5.6 5.6 0 0 1 4 12.5C4 6.8 10.6 4 20 4Z" />
          <path d="M14.8 9.2 4.8 19.6" />
        </>
      );
    case 'undo':
      return (
        <>
          <path d="M4.4 8.2h9.4a5.8 5.8 0 0 1 0 11.6H7.6" />
          <path d="M8 4.2 4 8.2l4 4" />
        </>
      );
    case 'refresh':
      return (
        <>
          <path d="M20 12a8 8 0 1 1-2.6-5.9" />
          <path d="M20.4 4.2v5.2h-5.2" />
        </>
      );
    case 'more':
      return (
        <>
          <circle cx="5.6" cy="12" r="1.7" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
          <circle cx="18.4" cy="12" r="1.7" fill="currentColor" stroke="none" />
        </>
      );
    case 'bars':
      return (
        <>
          <path d="M3.6 20.4h16.8" />
          <rect x="5.4" y="12" width="3.8" height="8.4" rx="1.4" fill={accent} />
          <rect x="5.4" y="12" width="3.8" height="8.4" rx="1.4" />
          <rect x="14.8" y="6.6" width="3.8" height="13.8" rx="1.4" fill={accent} />
          <rect x="14.8" y="6.6" width="3.8" height="13.8" rx="1.4" />
        </>
      );
    case 'eye':
      return (
        <>
          <path d="M1.8 12S5.6 5.4 12 5.4 22.2 12 22.2 12 18.4 18.6 12 18.6 1.8 12 1.8 12Z" fill={accent} />
          <path d="M1.8 12S5.6 5.4 12 5.4 22.2 12 22.2 12 18.4 18.6 12 18.6 1.8 12 1.8 12Z" />
          <circle cx="12" cy="12" r="3.1" fill="none" />
        </>
      );
    case 'eyeOff':
      return (
        <>
          <path d="M9.2 5.8A9.9 9.9 0 0 1 12 5.4c6.4 0 10.2 6.6 10.2 6.6a18 18 0 0 1-3 3.8M6.3 7.6A17.7 17.7 0 0 0 1.8 12S5.6 18.6 12 18.6a9.6 9.6 0 0 0 3.5-.65" />
          <path d="M10 10.2a2.8 2.8 0 0 0 3.9 3.9M3.6 3.6l16.8 16.8" />
        </>
      );
    case 'backspace':
      return (
        <>
          <path d="M8.4 4.8h11.2a1.6 1.6 0 0 1 1.6 1.6v11.2a1.6 1.6 0 0 1-1.6 1.6H8.4L2.6 12l5.8-7.2Z" fill={accent} />
          <path d="M8.4 4.8h11.2a1.6 1.6 0 0 1 1.6 1.6v11.2a1.6 1.6 0 0 1-1.6 1.6H8.4L2.6 12l5.8-7.2Z" />
          <path d="M11.6 9.2 16.4 14M16.4 9.2 11.6 14" />
        </>
      );
    case 'drag':
      return (
        <>
          <path d="M8.4 7.2h.01M8.4 12h.01M8.4 16.8h.01M15.6 7.2h.01M15.6 12h.01M15.6 16.8h.01" />
        </>
      );
    case 'info':
      return (
        <>
          <circle cx="12" cy="12" r="8.6" fill={accent} />
          <circle cx="12" cy="12" r="8.6" />
          <path d="M12 11v5.2M12 7.9h.01" />
        </>
      );
    default:
      return null;
  }
}

export function Icon({ name, size = 20, color, accent, strokeWidth = 2.4, style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flex: 'none', ...style }}
    >
      {glyph(name, accent)}
    </svg>
  );
}
