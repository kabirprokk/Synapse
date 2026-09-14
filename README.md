# Synapse — Neuro-Evolution Arena

Q-Learning (`Ai Lake-1`, O) vs Minimax + Genetic Evolution (`Ai Lava-1`, X) in Tic-Tac-Toe.
Seeded, measurable, human-playable. Built for small lab experiments, not fake livestreams.

## What scientists get

- **Reproducible:** seeded RNG (`mulberry32`). Set seed → same exploratory sequence. Lake seed = `s`, Lava seed = `s+1`.
- **Honest timings:** decision latency measured with `performance.now()` in-tab. Session uptime starts at 0. No fake viewers — header shows `1 here (you)`.
- **Fair comparison:** alternating starter in AI-vs-AI, Elo (K=16, base 1200) for Lake / Lava / You.
- **Tunable:** α, γ, ε (+ decay), mutation σ, search depth (1–9) live in Experiment Controls. Set ε=0 for deterministic evaluation.
- **Persistent:** Q-table, genome, match log, Elo, config in `localStorage`. Export CSV (matches) + JSON (full experiment).
- **Human baseline:** play as O vs Lava or X vs Lake. Click empty cells on your turn. Humans update Elo + train the agents (win → reward, loss → mutate).

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # tsc --noEmit
npm test         # vitest run
npm run build
```

No backend required for local use — all computation is client-side. Firebase is optional cloud sync.

## Firebase (synapse-ai-inovation) — connected

Project: `synapse-ai-inovation` (`synapse-ai-inovation.web.app` after deploy).
Client files: `src/services/firebase.ts`, `src/services/cloud.ts`.
App signs in anonymously, pushes every match to `matches`, refreshes `leaderboard/global` every 5 rounds. Offline → local-only, no crash.

Enable in console (one time):
1. Authentication → Sign-in method → Anonymous → Enable.
2. Firestore Database → Create → `matches` + `leaderboard` collections (rules in `firestore.rules`).
3. Hosting → Get started. Then deploy:
```bash
npm i -g firebase-tools
firebase login
firebase deploy --only hosting,firestore
```
Live URL: `https://synapse-ai-inovation.web.app`.

Env override: copy `.env.example` → `.env`, fill `VITE_FIREBASE_*` to fork to your own project.

## Methods

- Lake-1: tabular Q-learning, Bellman update `Q(s,a) += α[R + γ·maxQ − Q]`, terminal rewards `+1 / −1 / +0.3`, step penalty `-0.01`, ε-greedy with per-game decay `ε ← max(ε_min, ε·decay)`.
- Lava-1: Minimax + alpha-beta to `maxDepth` (default 6), positional genome `[1.0,0.5,1.0,0.5,2.0,0.5,1.0,0.5,1.0]`, Gaussian mutation (Box-Muller, seeded) on loss only, 3% random explore to avoid loops.
- Elo: `E = 1/(1+10^((Rb−Ra)/400))`, `R' = R + 16·(score − E)`.

## Limitations (read before publishing results)

Tic-Tac-Toe is solved — optimal play draws. Expect convergence to draws after ~50–200 games. Use this rig to teach dynamics, debugging, and experiment hygiene, not to claim SOTA. For novel results, port engines to Connect-4 / 5×5.

## Project layout

- `src/services/aiEngine.ts` — agents + seeded RNG + Elo (tested)
- `src/services/experiment.ts` — persistence, CSV/JSON export
- `src/App.tsx` — session loop, human mode, pause/step/reset
- `src/components/ExperimentPanel.tsx` — seed/hyperparams/Elo/export UI
- `src/components/TactileMatrix.tsx` — clickable board (human turn)
- `src/services/aiEngine.test.ts` — 9 Vitest cases

## License

Apache-2.0. See `LICENSE`.
