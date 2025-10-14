import React from 'react';

// Small inline SVG icon set used on xs to avoid network requests for images.
export default function LguIcon({ name = 'default', className = '', variant = 'outline' }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24', className };
  const outline = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const filled = { fill: 'currentColor' };

  const props = variant === 'filled' ? { ...common, ...filled } : { ...common, ...outline };

  switch (name) {
    case 'province':
      return (
        <svg {...props}>
          <path d="M3 21v-13a2 2 0 012-2h14a2 2 0 012 2v13" />
          <path d="M7 10h.01M12 10h.01M17 10h.01M7 16h10" />
        </svg>
      );
    case 'city':
      return (
        <svg {...props}>
          <rect x="3" y="7" width="6" height="11" rx="2" />
          <rect x="15" y="4" width="6" height="14" rx="2" />
          <path d="M9 14h6" />
        </svg>
      );
    case 'municipality':
      return (
        <svg {...props}>
          <path d="M12 2l7 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7l7-5z" />
          <path d="M9 12h6" />
        </svg>
      );
    case 'flag':
      return (
        <svg {...props}><path d="M4 6h8l-2 4 2 4H4"/></svg>
      );
    case 'star':
      return (
        <svg {...props}><path d="M12 2l2.6 6.6L21 10l-5 3.6L17.2 21 12 17.8 6.8 21 8 13.6 3 10l6.4-1.4L12 2z"/></svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M3 7v6a4 4 0 004 4h10" />
          <path d="M21 3v8" />
        </svg>
      );
  }
}
