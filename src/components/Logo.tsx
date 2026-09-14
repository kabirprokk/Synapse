/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Synarena logo — cyan O + magenta X linked as a synapse.
 * Recreated as SVG so it stays crisp at header + favicon sizes.
 */

import React from 'react';

export const Logo: React.FC<{ size?: number; className?: string }> = ({ size = 36, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    className={className}
    role="img"
    aria-label="Synarena logo"
  >
    <defs>
      <linearGradient id="syn-ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#22d3ee" />
        <stop offset="0.55" stopColor="#a78bfa" />
        <stop offset="1" stopColor="#fb7185" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="60" height="60" rx="16" fill="#0b1226" />
    <rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="url(#syn-ring)" strokeWidth="2.5" />
    {/* faint grid */}
    <g stroke="#334155" strokeWidth="0.6" opacity="0.5">
      <line x1="10" y1="40" x2="54" y2="40" strokeDasharray="2 3" />
      <line x1="32" y1="10" x2="32" y2="54" strokeDasharray="2 3" />
    </g>
    {/* synapse links */}
    <g stroke="#a78bfa" strokeWidth="1.6" strokeDasharray="3 3" opacity="0.9">
      <line x1="22" y1="24" x2="42" y2="24" />
      <line x1="22" y1="24" x2="32" y2="44" />
      <line x1="42" y1="24" x2="32" y2="44" />
    </g>
    {/* O */}
    <circle cx="20" cy="23" r="9" fill="none" stroke="#22d3ee" strokeWidth="4" />
    <circle cx="20" cy="23" r="12.5" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
    {/* X */}
    <g stroke="#fb4d6d" strokeWidth="4.5" strokeLinecap="round">
      <line x1="36" y1="17" x2="48" y2="29" />
      <line x1="48" y1="17" x2="36" y2="29" />
    </g>
    {/* node */}
    <circle cx="32" cy="46" r="6" fill="#22d3ee" />
    <circle cx="32" cy="46" r="9.5" fill="none" stroke="#22d3ee" strokeWidth="1.2" strokeDasharray="2.5 2.5" opacity="0.8" />
    <circle cx="20" cy="35" r="2" fill="#22d3ee" />
    <circle cx="44" cy="35" r="2" fill="#fb4d6d" />
  </svg>
);
