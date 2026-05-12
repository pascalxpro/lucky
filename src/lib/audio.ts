/**
 * Audio Manager — BGM & SFX using Howler.js
 */
'use client';

import { Howl } from 'howler';

class AudioManager {
  private bgm: Howl | null = null;
  private sfx: Map<string, Howl> = new Map();
  private bgmVolume = 0.3;
  private sfxVolume = 0.7;
  private isMuted = false;

  // Pre-built SFX using oscillator (no external files needed)
  private synth: AudioContext | null = null;

  private getSynth(): AudioContext {
    if (!this.synth) {
      this.synth = new AudioContext();
    }
    return this.synth;
  }

  playClick() {
    if (this.isMuted) return;
    try {
      const ctx = this.getSynth();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(this.sfxVolume * 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }

  playSpinning() {
    if (this.isMuted) return;
    try {
      const ctx = this.getSynth();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 2);
      osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 4);
      gain.gain.setValueAtTime(this.sfxVolume * 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 4);
    } catch {}
  }

  playWin() {
    if (this.isMuted) return;
    try {
      const ctx = this.getSynth();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, ctx.currentTime + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.5);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.5);
      });
    } catch {}
  }

  playLose() {
    if (this.isMuted) return;
    try {
      const ctx = this.getSynth();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(this.sfxVolume * 0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }

  playScratch() {
    if (this.isMuted) return;
    try {
      const ctx = this.getSynth();
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      noise.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(this.sfxVolume * 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      noise.start(ctx.currentTime);
    } catch {}
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  get muted() {
    return this.isMuted;
  }
}

export const audioManager = new AudioManager();
