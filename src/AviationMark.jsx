import React from 'react';

export default function AviationMark({ className = '' }) {
  return <svg className={`aviation-mark ${className}`} viewBox="0 0 320 170" fill="none" aria-hidden="true">
    <path className="mark-line mark-line-main" pathLength="1" d="M20 104C74 103 117 86 160 47C203 86 246 103 300 104"/>
    <path className="mark-line mark-line-inner" pathLength="1" d="M48 122C96 117 128 104 160 77C192 104 224 117 272 122"/>
    <path className="mark-line mark-line-horizon" pathLength="1" d="M77 137H243"/>
    <path className="mark-line mark-line-axis" pathLength="1" d="M160 25V143"/>
    <path className="mark-fill" d="M160 37L168 75L160 88L152 75Z"/>
    <path className="mark-detail" pathLength="1" d="M89 107L72 125M231 107L248 125M137 137L160 151L183 137"/>
  </svg>;
}
