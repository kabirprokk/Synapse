/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialized on first user interaction to comply with browser autoplay policies
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public playTone(freq = 440, type: OscillatorType = 'sine', duration = 0.08, volume = 0.025): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio synthesis errors on restricted environments
    }
  }

  public playMove(player: 'O' | 'X'): void {
    if (player === 'O') {
      this.playTone(520, 'sine', 0.06, 0.03);
    } else {
      this.playTone(380, 'triangle', 0.07, 0.03);
    }
  }

  public playWin(player: 'O' | 'X'): void {
    if (player === 'O') {
      this.playTone(660, 'sine', 0.12, 0.04);
      setTimeout(() => this.playTone(880, 'sine', 0.2, 0.04), 80);
    } else {
      this.playTone(420, 'triangle', 0.12, 0.04);
      setTimeout(() => this.playTone(310, 'triangle', 0.22, 0.04), 80);
    }
  }

  public playDraw(): void {
    this.playTone(440, 'sine', 0.12, 0.025);
  }

  public playMutation(): void {
    this.playTone(880, 'sawtooth', 0.15, 0.04);
    setTimeout(() => this.playTone(1100, 'sawtooth', 0.18, 0.035), 70);
  }

  public playUiClick(): void {
    this.playTone(1050, 'sine', 0.05, 0.02);
  }
}

export const soundManager = new AudioSynthesizer();
