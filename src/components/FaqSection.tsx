/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FAQ — scientific questions answered. UI: VengeanceUI faq-accordion.
 * Credit: https://www.vengenceui.com/ (faq-accordion component, MIT-style open registry).
 */

import React from 'react';
import { FaqAccordion } from './ui/faq-accordion';
import { DissolveReveal } from './ui/dissolve-reveal';

const ITEMS = [
  {
    question: 'What exactly is Lake-1 learning?',
    answer:
      'A tabular Q-function over Tic-Tac-Toe states. Every finished game backpropagates a terminal reward (+1 win, −1 loss, +0.3 draw) through the Bellman update. Open the Inspector → Q-Learning Memory to read the actual table.',
  },
  {
    question: 'What exactly is Lava-1 doing?',
    answer:
      'Depth-limited Minimax with alpha-beta pruning (default 6 plies) scored by a 9-weight positional genome. After every loss the genome mutates with seeded Gaussian noise. Inspector → Chromosome Weights shows the live values.',
  },
  {
    question: 'Is the comparison fair?',
    answer:
      'Starter alternates every round, both start unbiased (empty Q-table, symmetric genome), and the seed controls exploration. Set ε = 0 in Lab controls for a deterministic evaluation run.',
  },
  {
    question: 'Can I reproduce a run?',
    answer:
      'Yes. Note the seed in the session bar, set the same seed, same hyperparams, and compare the exported CSV/JSON. Same seed → same exploratory sequence.',
  },
  {
    question: 'What data leaves my browser?',
    answer:
      'Only anonymous match summaries (round, winner, moves, mode, seed) to Firestore when you are signed in anonymously. Q-tables stay local unless you export them yourself.',
  },
  {
    question: 'Why Tic-Tac-Toe? It always draws.',
    answer:
      'Correct — optimal play draws, and you will see convergence. This rig teaches dynamics, debugging, and experiment hygiene. For novel results, port the engines to Connect-4.',
  },
];

export const FaqSection: React.FC = () => (
  <section id="faq" className="w-full py-20 md:py-28 px-4 md:px-6 scroll-mt-20">
    <div className="max-w-3xl mx-auto">
      <DissolveReveal>
        <FaqAccordion items={ITEMS} title="Lab FAQ" />
      </DissolveReveal>
    </div>
  </section>
);

export default FaqSection;
