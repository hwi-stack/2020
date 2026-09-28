/**
 * Web Audio API synthesizer for lottery spinning, tension reveals, and fireworks celebration.
 * Works natively in all modern browsers without external asset dependencies.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private rollingInterval: number | null = null;

  constructor() {
    // Check localStorage for mute preference
    const savedMute = localStorage.getItem('lottery_muted');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('lottery_muted', String(muted));
    if (muted && this.rollingInterval) {
      this.stopRolling();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Sound 1: Fast rhythmic rolling / roulette clicking while syllables spin
   */
  public startRolling() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.stopRolling();

    let count = 0;
    this.rollingInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      count++;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Alternate slightly for rich mechanical roulette spin feeling
      const baseFreq = (count % 2 === 0) ? 600 : 750;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.045);
    }, 60);
  }

  public stopRolling() {
    if (this.rollingInterval !== null) {
      clearInterval(this.rollingInterval);
      this.rollingInterval = null;
    }
  }

  /**
   * Sound 2: Dramatic character lock-in (Step 1 and Step 2)
   */
  public playCharLock(step: 1 | 2) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Rich dual-tone punch for reveal
    const freq1 = step === 1 ? 523.25 : 659.25; // C5 or E5
    const freq2 = step === 1 ? 1046.5 : 1318.5; // C6 or E6

    [freq1, freq2].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.98, t + 0.4);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.4);
    });

    // Low sub thud for dramatic impact
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, t);
    subOsc.frequency.exponentialRampToValueAtTime(45, t + 0.25);

    subGain.gain.setValueAtTime(0.3, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);

    subOsc.start(t);
    subOsc.stop(t + 0.25);
  }

  /**
   * Sound 3: Fireworks explosion booms + triumphant fanfare chord celebration
   */
  public playFireworksFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.stopRolling();

    // 1. Fireworks mortar explosions (multiple staggered booms & crackles)
    const fireworkTimes = [0, 0.25, 0.55, 0.9, 1.3];
    fireworkTimes.forEach((delay) => {
      this.playSingleExplosion(delay);
    });

    // 2. Triumphant fanfare melody & chords (C - E - G - high C)
    const fanfareNotes = [
      { note: 523.25, time: 0.1, dur: 0.25 }, // C5
      { note: 659.25, time: 0.28, dur: 0.25 }, // E5
      { note: 783.99, time: 0.48, dur: 0.3 }, // G5
      { note: 1046.5, time: 0.72, dur: 1.6 }, // High C6 (sustained victory!)
      { note: 1318.51, time: 0.75, dur: 1.5 }, // High E6 harmony
      { note: 1567.98, time: 0.8, dur: 1.4 }, // High G6 shimmer
    ];

    fanfareNotes.forEach(({ note, time, dur }) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + time;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, t);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + dur);
    });
  }

  private playSingleExplosion(delaySec: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delaySec;

    // White noise burst for explosion shockwave
    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    // Low-pass filter to sound like fireworks boom
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.exponentialRampToValueAtTime(70, t + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(t);
    whiteNoise.stop(t + 0.6);

    // Deep sub blast
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(100, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.4);

    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);

    sub.start(t);
    sub.stop(t + 0.45);
  }
}

export const sound = new SoundEngine();
