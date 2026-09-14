/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Credits — every outsourced piece, attributed.
 */

import React from 'react';
import { GlowBorderCard } from './ui/glow-border-card';
import { LineHoverLink } from './ui/line-hover-link';
import { DissolveReveal } from './ui/dissolve-reveal';

const GROUPS: { title: string; items: { name: string; href: string; note: string }[] }[] = [
  {
    title: 'Interface components',
    items: [
      { name: 'VengeanceUI — animated-rays', href: 'https://www.vengenceui.com/', note: 'Intro background' },
      { name: 'VengeanceUI — flip-fade-text', href: 'https://www.vengenceui.com/', note: 'Intro title' },
      { name: 'VengeanceUI — spotlight-navbar', href: 'https://www.vengenceui.com/', note: 'Desktop nav' },
      { name: 'VengeanceUI — faq-accordion', href: 'https://www.vengenceui.com/', note: 'FAQ below' },
      { name: 'VengeanceUI — glow-border-card', href: 'https://www.vengenceui.com/', note: 'Frames on this page' },
      { name: 'VengeanceUI — animated-button', href: 'https://www.vengenceui.com/', note: 'Entry buttons' },
      { name: 'VengeanceUI — line-hover-link (arc)', href: 'https://www.vengenceui.com/', note: 'Footer links' },
      { name: 'VengeanceUI — ascii-glitch-ripple', href: 'https://www.vengenceui.com/', note: 'Display text hover' },
    ],
  },
  {
    title: 'Motion & styling',
    items: [
      { name: 'framer-motion', href: 'https://motion.dev/', note: 'Springs + letter choreography' },
      { name: 'Tailwind CSS', href: 'https://tailwindcss.com/', note: 'Utility styling v4' },
      { name: 'Lucide icons', href: 'https://lucide.dev/', note: 'Icon set' },
      { name: 'Geist + Sora typefaces', href: 'https://fonts.google.com/', note: 'Google Fonts' },
    ],
  },
  {
    title: 'Platform & science',
    items: [
      { name: 'Firebase Hosting + Firestore', href: 'https://firebase.google.com/', note: 'Deploy + match logs' },
      { name: 'SkiperUI (inspiration)', href: 'https://skiper-ui.com/', note: 'Minimal spacing language' },
      { name: 'Q-Learning / Minimax', href: 'https://github.com/kabirprokk/Synapse', note: 'Textbook algorithms, own code' },
    ],
  },
];

export const CreditsSection: React.FC = () => (
  <section id="credits" className="w-full py-20 md:py-28 px-4 md:px-6 border-t border-white/5 scroll-mt-20">
    <div className="max-w-5xl mx-auto flex flex-col gap-10">
      <DissolveReveal className="text-center flex flex-col items-center gap-3">
        <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-slate-500">Credits</p>
        <h2 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Built on open work.
        </h2>
        <p className="text-sm md:text-base text-slate-400 max-w-xl">
          Every borrowed piece is named here with its source. Project code is Apache-2.0.
        </p>
      </DissolveReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {GROUPS.map(g => (
          <DissolveReveal key={g.title}>
            <GlowBorderCard colorPreset="mono" borderRadius="1rem" animationDuration={8} className="p-6 h-full">
              <div className="flex flex-col gap-4 items-start text-left w-full">
                <h3 className="font-headline text-sm font-bold text-white">{g.title}</h3>
                <ul className="flex flex-col gap-3 w-full">
                  {g.items.map(it => (
                    <li key={it.name} className="flex flex-col gap-0.5 min-w-0">
                      <LineHoverLink
                        variant="arc"
                        href={it.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-slate-200"
                      >
                        {it.name}
                      </LineHoverLink>
                      <span className="font-mono text-[11px] text-slate-500">{it.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </GlowBorderCard>
          </DissolveReveal>
        ))}
      </div>
    </div>
  </section>
);

export default CreditsSection;
