// Inline Lucide-style icons copied from the Oscar.dc.html prototype.
import type { CSSProperties } from 'react';

type IconProps = {
  size?: number;
  stroke?: string;
  strokeWidth?: number;
  style?: CSSProperties;
  className?: string;
};

function svgProps({ size = 14, stroke = 'currentColor', strokeWidth = 1.7, style, className }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style,
    className,
  };
}

export const PencilIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M12 20h9" />
    <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
  </svg>
);

export const ListIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" />
    <path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" />
  </svg>
);

export const ChartIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <path d="M7 16v-4" /><path d="M12 16v-8" /><path d="M17 16v-6" />
  </svg>
);

export const CommandIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
  </svg>
);

export const TrophyIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export const GearIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
  </svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const ChevronRightIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const ClockIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M10 2h4" />
  </svg>
);

export const WordsIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h10" />
  </svg>
);

export const FlameIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

export const SearchIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);

export const HistoryIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

export const TrendIcon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M16 7h6v6" /><path d="m22 7-8.5 8.5-5-5L2 17" />
  </svg>
);
