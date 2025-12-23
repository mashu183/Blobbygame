// Casino Sound Effects Manager using Web Audio API
// All sounds are synthesized programmatically for low-latency playback

// Musical scales for procedural music generation
const CASINO_SCALE = [
  130.81, // C3
  146.83, // D3
  164.81, // E3
  174.61, // F3
  196.00, // G3
  220.00, // A3
  246.94, // B3
  261.63, // C4
  293.66, // D4
  329.63, // E4
];

const JAZZ_CHORDS = [
  [261.63, 329.63, 392.00, 466.16], // Cmaj7
  [293.66, 349.23, 440.00, 523.25], // Dm7
  [329.63, 392.00, 493.88, 587.33], // Em7
  [349.23, 440.00, 523.25, 659.25], // Fmaj7
  [392.00, 493.88, 587.33, 698.46], // G7
  [440.00, 523.25, 659.25, 783.99], // Am7
];

class CasinoSoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private isAmbientPlaying = false;
  private isMuted = false;
  private sfxVolume = 0.5;
  private musicVolume = 0.3;
  
  // Music system
  private isMusicPlaying = false;
  private musicNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
  private musicIntervals: NodeJS.Timeout[] = [];
  private isDucking = false;
  private normalMusicVolume = 0.3;
  private duckedMusicVolume = 0.1;
  private duckingTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.initAudioContext();
    this.loadSettings();
  }

  private loadSettings() {
    if (typeof window !== 'undefined') {
      const savedSfxVolume = localStorage.getItem('blobby-sfx-volume');
      const savedMusicVolume = localStorage.getItem('blobby-music-volume');
      const savedMusicEnabled = localStorage.getItem('blobby-music-enabled');
      const savedSfxMuted = localStorage.getItem('blobby-sfx-muted');
      
      if (savedSfxVolume) this.sfxVolume = parseFloat(savedSfxVolume);
      if (savedMusicVolume) {
        this.musicVolume = parseFloat(savedMusicVolume);
        this.normalMusicVolume = this.musicVolume;
      }
      if (savedSfxMuted === 'true') this.isMuted = true;
    }
  }

  private saveSettings() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('blobby-sfx-volume', this.sfxVolume.toString());
      localStorage.setItem('blobby-music-volume', this.musicVolume.toString());
      localStorage.setItem('blobby-music-enabled', this.isMusicPlaying.toString());
      localStorage.setItem('blobby-sfx-muted', this.isMuted.toString());
    }
  }

  private initAudioContext() {
    if (typeof window !== 'undefined') {
      const initOnInteraction = () => {
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          // Create gain nodes hierarchy
          this.masterGain = this.audioContext.createGain();
          this.sfxGain = this.audioContext.createGain();
          this.musicGain = this.audioContext.createGain();
          
          this.masterGain.connect(this.audioContext.destination);
          this.sfxGain.connect(this.masterGain);
          this.musicGain.connect(this.masterGain);
          
          this.masterGain.gain.value = 1;
          this.sfxGain.gain.value = this.isMuted ? 0 : this.sfxVolume;
          this.musicGain.gain.value = this.musicVolume;
        }
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
      };

      ['click', 'touchstart', 'keydown'].forEach(event => {
        document.addEventListener(event, initOnInteraction, { once: false, passive: true });
      });
    }
  }

  private ensureContext(): boolean {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.sfxGain = this.audioContext.createGain();
        this.musicGain = this.audioContext.createGain();
        
        this.masterGain.connect(this.audioContext.destination);
        this.sfxGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        
        this.masterGain.gain.value = 1;
        this.sfxGain.gain.value = this.isMuted ? 0 : this.sfxVolume;
        this.musicGain.gain.value = this.musicVolume;
      } catch (e) {
        console.warn('Web Audio API not supported');
        return false;
      }
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return true;
  }

  // ============ VOLUME CONTROLS ============

  setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.isMuted ? 0 : this.sfxVolume;
    }
    this.saveSettings();
  }

  getSfxVolume(): number {
    return this.sfxVolume;
  }

  setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    this.normalMusicVolume = this.musicVolume;
    if (this.musicGain && !this.isDucking) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.audioContext!.currentTime, 0.1);
    }
    this.saveSettings();
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  setVolume(vol: number) {
    this.setSfxVolume(vol);
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.sfxGain) {
      this.sfxGain.gain.value = muted ? 0 : this.sfxVolume;
    }
    this.saveSettings();
  }

  toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  // ============ AUDIO DUCKING ============

  duck() {
    if (!this.musicGain || !this.audioContext || !this.isMusicPlaying) return;
    
    this.isDucking = true;
    this.duckedMusicVolume = this.normalMusicVolume * 0.3;
    this.musicGain.gain.setTargetAtTime(this.duckedMusicVolume, this.audioContext.currentTime, 0.1);
    
    // Clear any existing timeout
    if (this.duckingTimeout) {
      clearTimeout(this.duckingTimeout);
    }
  }

  unduck(delay: number = 500) {
    if (!this.musicGain || !this.audioContext || !this.isMusicPlaying) return;
    
    // Clear any existing timeout
    if (this.duckingTimeout) {
      clearTimeout(this.duckingTimeout);
    }
    
    this.duckingTimeout = setTimeout(() => {
      if (this.musicGain && this.audioContext) {
        this.isDucking = false;
        this.musicGain.gain.setTargetAtTime(this.normalMusicVolume, this.audioContext.currentTime, 0.3);
      }
    }, delay);
  }

  // ============ BACKGROUND MUSIC SYSTEM ============

  isMusicEnabled(): boolean {
    return this.isMusicPlaying;
  }

  startMusic() {
    if (!this.ensureContext() || this.isMusicPlaying) return;
    
    this.isMusicPlaying = true;
    this.saveSettings();
    
    // Start the procedural music generation
    this.playProceduralMusic();
  }

  stopMusic() {
    this.isMusicPlaying = false;
    this.saveSettings();
    
    // Stop all music nodes
    this.musicNodes.forEach(node => {
      try {
        node.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.musicNodes = [];
    
    // Clear all intervals
    this.musicIntervals.forEach(interval => clearInterval(interval));
    this.musicIntervals = [];
  }

  toggleMusic(): boolean {
    if (this.isMusicPlaying) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.isMusicPlaying;
  }

  private playProceduralMusic() {
    if (!this.audioContext || !this.musicGain) return;

    // Create ambient pad layer
    this.createAmbientPad();
    
    // Create bass line
    this.createBassLine();
    
    // Create melodic elements
    this.createMelodicLayer();
    
    // Create subtle percussion
    this.createPercussion();
    
    // Create occasional sparkle effects
    this.createSparkleEffects();
  }

  private createAmbientPad() {
    if (!this.audioContext || !this.musicGain || !this.isMusicPlaying) return;

    const playChord = () => {
      if (!this.audioContext || !this.musicGain || !this.isMusicPlaying) return;
      
      const chord = JAZZ_CHORDS[Math.floor(Math.random() * JAZZ_CHORDS.length)];
      
      chord.forEach((freq, i) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        const filter = this.audioContext!.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.value = freq * 0.5; // Lower octave for warmth
        
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);
        
        const now = this.audioContext!.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.03, now + 0.5);
        gain.gain.setValueAtTime(0.03, now + 3);
        gain.gain.linearRampToValueAtTime(0, now + 4);
        
        osc.start(now);
        osc.stop(now + 4.5);
        
        this.musicNodes.push(osc);
      });
    };

    playChord();
    const interval = setInterval(() => {
      if (this.isMusicPlaying) {
        playChord();
      }
    }, 4000);
    this.musicIntervals.push(interval);
  }

  private createBassLine() {
    if (!this.audioContext || !this.musicGain || !this.isMusicPlaying) return;

    const playBassNote = () => {
      if (!this.audioContext || !this.musicGain || !this.isMusicPlaying) return;
      
      const bassNotes = [65.41, 73.42, 82.41, 87.31, 98.00]; // C2, D2, E2, F2, G2
      const note = bassNotes[Math.floor(Math.random() * bassNotes.length)];
      
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      const filter = this.audioContext!.createBiquadFilter();
      
      osc.type = 'triangle';
      osc.frequency.value = note;
      
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);
      
      const now = this.audioContext!.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      
      osc.start(now);
      osc.stop(now + 1.6);
      
      this.musicNodes.push(osc);
    };

    const interval = setInterval(() => {
      if (this.isMusicPlaying && Math.random() > 0.3) {
        playBassNote();
      }
    }, 2000);
    this.musicIntervals.push(interval);
  }

  private createMelodicLayer() {
    if (!this.audioContext || !this.musicGain || !this.isMusicPlaying) return;

    const playMelody = () => {
      if (!this.audioContext || !this.musicGain || !this.isMusicPlaying) return;
      
      const note = CASINO_SCALE[Math.floor(Math.random() * CASINO_SCALE.length)];
      
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      const filter = this.audioContext!.createBiquadFilter();
      
      // Use different wave types for variety
      const waveTypes: OscillatorType[] = ['sine', 'triangle'];
      osc.type = waveTypes[Math.floor(Math.random() * waveTypes.length)];
      osc.frequency.value = note * 2; // Higher octave
      
      // Add vibrato
      const vibrato = this.audioContext!.createOscillator();
      const vibratoGain = this.audioContext!.createGain();
      vibrato.frequency.value = 5;
      vibratoGain.gain.value = 3;
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);
      
      const now = this.audioContext!.currentTime;
      const duration = 0.3 + Math.random() * 0.5;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.start(now);
      vibrato.start(now);
      osc.stop(now + duration + 0.1);
      vibrato.stop(now + duration + 0.1);
      
      this.musicNodes.push(osc);
    };

    const interval = setInterval(() => {
      if (this.isMusicPlaying && Math.random() > 0.5) {
        playMelody();
      }
    }, 800 + Math.random() * 400);
    this.musicIntervals.push(interval);
  }

  private createPercussion() {
    if (!this.audioContext || !this.musicGain || !this.isMusicPlaying) return;

    const playHiHat = () => {
      if (!this.audioContext || !this.musicGain || !this.isMusicPlaying) return;
      
      const bufferSize = this.audioContext!.sampleRate * 0.05;
      const buffer = this.audioContext!.createBuffer(1, bufferSize, this.audioContext!.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      
      const noise = this.audioContext!.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.audioContext!.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 8000;
      
      const gain = this.audioContext!.createGain();
      gain.gain.value = 0.02;
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);
      
      noise.start();
    };

    const playKick = () => {
      if (!this.audioContext || !this.musicGain || !this.isMusicPlaying) return;
      
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      osc.type = 'sine';
      
      const now = this.audioContext!.currentTime;
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      osc.connect(gain);
      gain.connect(this.musicGain!);
      
      osc.start(now);
      osc.stop(now + 0.3);
      
      this.musicNodes.push(osc);
    };

    // Hi-hat pattern
    const hiHatInterval = setInterval(() => {
      if (this.isMusicPlaying && Math.random() > 0.3) {
        playHiHat();
      }
    }, 500);
    this.musicIntervals.push(hiHatInterval);

    // Kick pattern
    const kickInterval = setInterval(() => {
      if (this.isMusicPlaying && Math.random() > 0.6) {
        playKick();
      }
    }, 2000);
    this.musicIntervals.push(kickInterval);
  }

  private createSparkleEffects() {
    if (!this.audioContext || !this.musicGain || !this.isMusicPlaying) return;

    const playSparkle = () => {
      if (!this.audioContext || !this.musicGain || !this.isMusicPlaying) return;
      
      const baseFreq = 2000 + Math.random() * 2000;
      
      for (let i = 0; i < 3; i++) {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = baseFreq + i * 200;
        
        osc.connect(gain);
        gain.connect(this.musicGain!);
        
        const now = this.audioContext!.currentTime;
        const delay = i * 0.05;
        
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.02, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
        
        osc.start(now + delay);
        osc.stop(now + delay + 0.2);
        
        this.musicNodes.push(osc);
      }
    };

    const interval = setInterval(() => {
      if (this.isMusicPlaying && Math.random() > 0.85) {
        playSparkle();
      }
    }, 3000);
    this.musicIntervals.push(interval);
  }

  // ============ UTILITY FUNCTIONS ============

  private createOscillator(frequency: number, type: OscillatorType = 'sine'): OscillatorNode {
    const osc = this.audioContext!.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    return osc;
  }

  private createGain(value: number = 1): GainNode {
    const gain = this.audioContext!.createGain();
    gain.gain.value = value;
    return gain;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3,
    delay: number = 0
  ) {
    if (!this.ensureContext() || this.isMuted) return;

    const osc = this.createOscillator(frequency, type);
    const gain = this.createGain(0);
    
    osc.connect(gain);
    gain.connect(this.sfxGain!);

    const now = this.audioContext!.currentTime + delay;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  private playNoise(duration: number, volume: number = 0.1, delay: number = 0) {
    if (!this.ensureContext() || this.isMuted) return;

    const bufferSize = this.audioContext!.sampleRate * duration;
    const buffer = this.audioContext!.createBuffer(1, bufferSize, this.audioContext!.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext!.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext!.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;

    const gain = this.createGain(0);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);

    const now = this.audioContext!.currentTime + delay;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.start(now);
    noise.stop(now + duration);
  }

  // ============ COIN FLIP SOUNDS ============

  coinFlip() {
    if (!this.ensureContext() || this.isMuted) return;
    this.duck();

    // Metallic flip sound - multiple quick tones
    for (let i = 0; i < 5; i++) {
      this.playTone(800 + Math.random() * 400, 0.05, 'triangle', 0.15, i * 0.08);
    }
    // Whoosh sound
    this.playNoise(0.3, 0.08);
  }

  coinSpin() {
    if (!this.ensureContext() || this.isMuted) return;

    // Spinning coin sound - descending metallic tones
    for (let i = 0; i < 8; i++) {
      const freq = 1200 - (i * 100);
      this.playTone(freq, 0.1, 'triangle', 0.1, i * 0.15);
    }
  }

  coinLand() {
    if (!this.ensureContext() || this.isMuted) return;

    // Landing thud with metallic ring
    this.playTone(150, 0.15, 'sine', 0.3);
    this.playTone(600, 0.3, 'triangle', 0.2, 0.05);
    this.playTone(1200, 0.2, 'sine', 0.1, 0.05);
    
    this.unduck(300);
  }

  // ============ WHEEL/SPIN SOUNDS ============

  wheelStart() {
    if (!this.ensureContext() || this.isMuted) return;
    this.duck();

    // Acceleration sound
    for (let i = 0; i < 10; i++) {
      this.playTone(200 + i * 50, 0.1, 'sawtooth', 0.05, i * 0.05);
    }
  }

  wheelTick() {
    if (!this.ensureContext() || this.isMuted) return;

    // Quick tick/click sound
    this.playTone(800, 0.03, 'square', 0.15);
    this.playTone(400, 0.02, 'triangle', 0.1);
  }

  wheelSlowDown(tickNumber: number, totalTicks: number) {
    if (!this.ensureContext() || this.isMuted) return;

    // Tick gets lower and longer as wheel slows
    const progress = tickNumber / totalTicks;
    const freq = 800 - (progress * 300);
    const duration = 0.03 + (progress * 0.05);
    this.playTone(freq, duration, 'square', 0.15 - progress * 0.05);
  }

  wheelStop() {
    if (!this.ensureContext() || this.isMuted) return;

    // Final stop sound
    this.playTone(400, 0.15, 'triangle', 0.2);
    this.playTone(600, 0.1, 'sine', 0.15, 0.05);
    
    this.unduck(500);
  }

  // ============ SLOT MACHINE SOUNDS ============

  slotPull() {
    if (!this.ensureContext() || this.isMuted) return;
    this.duck();

    // Lever pull sound
    this.playTone(150, 0.2, 'sawtooth', 0.2);
    this.playTone(100, 0.3, 'sine', 0.15, 0.1);
    this.playNoise(0.15, 0.1);
  }

  slotReelSpin() {
    if (!this.ensureContext() || this.isMuted) return;

    // Continuous spinning sound
    for (let i = 0; i < 20; i++) {
      this.playTone(300 + Math.random() * 200, 0.05, 'square', 0.05, i * 0.05);
    }
  }

  slotReelTick() {
    if (!this.ensureContext() || this.isMuted) return;

    this.playTone(500 + Math.random() * 200, 0.02, 'square', 0.08);
  }

  slotReelStop(reelIndex: number) {
    if (!this.ensureContext() || this.isMuted) return;

    // Mechanical stop sound - different pitch for each reel
    const baseFreq = 200 + reelIndex * 50;
    this.playTone(baseFreq, 0.1, 'triangle', 0.25);
    this.playTone(baseFreq * 2, 0.08, 'sine', 0.15, 0.02);
    this.playNoise(0.05, 0.1);
    
    // Unduck after last reel
    if (reelIndex === 2) {
      this.unduck(500);
    }
  }

  // ============ SCRATCH CARD SOUNDS ============

  scratchStart() {
    if (!this.ensureContext() || this.isMuted) return;
    this.duck();

    this.playNoise(0.1, 0.15);
  }

  scratch() {
    if (!this.ensureContext() || this.isMuted) return;

    // Scratching sound - filtered noise
    const bufferSize = this.audioContext!.sampleRate * 0.08;
    const buffer = this.audioContext!.createBuffer(1, bufferSize, this.audioContext!.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.audioContext!.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext!.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000 + Math.random() * 1000;

    const gain = this.createGain(0.12);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);

    noise.start();
  }

  scratchReveal() {
    if (!this.ensureContext() || this.isMuted) return;

    // Reveal sparkle sound
    this.playTone(800, 0.1, 'sine', 0.15);
    this.playTone(1200, 0.08, 'sine', 0.1, 0.03);
    this.playTone(1600, 0.06, 'sine', 0.08, 0.06);
  }

  scratchComplete() {
    if (!this.ensureContext() || this.isMuted) return;
    this.unduck(300);
  }

  // ============ MYSTERY BOX SOUNDS ============

  boxShake() {
    if (!this.ensureContext() || this.isMuted) return;
    this.duck();

    // Shaking/rattling sound
    for (let i = 0; i < 6; i++) {
      this.playTone(200 + Math.random() * 100, 0.05, 'triangle', 0.1, i * 0.08);
      this.playNoise(0.03, 0.05, i * 0.08);
    }
  }

  boxOpen() {
    if (!this.ensureContext() || this.isMuted) return;

    // Box opening creak
    this.playTone(150, 0.2, 'sawtooth', 0.1);
    this.playTone(200, 0.15, 'triangle', 0.15, 0.1);
    // Pop sound
    this.playTone(400, 0.1, 'sine', 0.2, 0.2);
  }

  boxReveal() {
    if (!this.ensureContext() || this.isMuted) return;

    // Magical reveal sound
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.3, 'sine', 0.15, i * 0.1);
    });
    
    this.unduck(500);
  }

  // ============ WIN/LOSE JINGLES ============

  winSmall() {
    if (!this.ensureContext() || this.isMuted) return;
    this.duck();

    // Simple ascending arpeggio
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.2, 'sine', 0.2, i * 0.1);
    });
    
    this.unduck(500);
  }

  winMedium() {
    if (!this.ensureContext() || this.isMuted) return;
    this.duck();

    // Fuller win sound
    const notes = [392, 523, 659, 784, 1047]; // G4, C5, E5, G5, C6
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.25, 'sine', 0.2, i * 0.08);
      this.playTone(freq * 1.5, 0.2, 'triangle', 0.1, i * 0.08);
    });
    
    this.unduck(800);
  }

  winBig() {
    if (!this.ensureContext() || this.isMuted) return;
    this.duck();

    // Triumphant fanfare
    const melody = [
      { freq: 523, dur: 0.15 },  // C5
      { freq: 523, dur: 0.15 },  // C5
      { freq: 523, dur: 0.15 },  // C5
      { freq: 659, dur: 0.4 },   // E5
      { freq: 784, dur: 0.15 },  // G5
      { freq: 659, dur: 0.15 },  // E5
      { freq: 784, dur: 0.5 },   // G5
    ];

    let time = 0;
    melody.forEach(note => {
      this.playTone(note.freq, note.dur, 'sine', 0.25, time);
      this.playTone(note.freq * 0.5, note.dur, 'triangle', 0.15, time);
      time += note.dur * 0.8;
    });
    
    this.unduck(1500);
  }

  lose() {
    if (!this.ensureContext() || this.isMuted) return;
    this.duck();

    // Sad descending tones
    this.playTone(400, 0.2, 'sine', 0.15);
    this.playTone(350, 0.2, 'sine', 0.15, 0.15);
    this.playTone(300, 0.3, 'sine', 0.12, 0.3);
    
    this.unduck(800);
  }

  // ============ JACKPOT CELEBRATION ============

  jackpot() {
    if (!this.ensureContext() || this.isMuted) return;
    this.duck();

    // Epic jackpot celebration
    // Fanfare
    const fanfare = [
      { freq: 523, dur: 0.1 },
      { freq: 659, dur: 0.1 },
      { freq: 784, dur: 0.1 },
      { freq: 1047, dur: 0.3 },
      { freq: 784, dur: 0.1 },
      { freq: 1047, dur: 0.1 },
      { freq: 1319, dur: 0.4 },
    ];

    let time = 0;
    fanfare.forEach(note => {
      this.playTone(note.freq, note.dur * 1.2, 'sine', 0.3, time);
      this.playTone(note.freq * 0.5, note.dur * 1.2, 'triangle', 0.2, time);
      this.playTone(note.freq * 2, note.dur * 0.8, 'sine', 0.1, time);
      time += note.dur;
    });

    // Add sparkle effects
    for (let i = 0; i < 15; i++) {
      const sparkleFreq = 1500 + Math.random() * 2000;
      this.playTone(sparkleFreq, 0.1, 'sine', 0.08, Math.random() * 1.5);
    }
    
    this.unduck(2500);
  }

  // ============ UI SOUNDS ============

  buttonClick() {
    if (!this.ensureContext() || this.isMuted) return;

    this.playTone(600, 0.05, 'sine', 0.1);
    this.playTone(800, 0.03, 'sine', 0.08, 0.02);
  }

  buttonHover() {
    if (!this.ensureContext() || this.isMuted) return;

    this.playTone(400, 0.03, 'sine', 0.05);
  }

  modalOpen() {
    if (!this.ensureContext() || this.isMuted) return;

    this.playTone(300, 0.1, 'sine', 0.1);
    this.playTone(450, 0.1, 'sine', 0.1, 0.05);
  }

  modalClose() {
    if (!this.ensureContext() || this.isMuted) return;

    this.playTone(450, 0.08, 'sine', 0.1);
    this.playTone(300, 0.1, 'sine', 0.08, 0.05);
  }

  coinCollect() {
    if (!this.ensureContext() || this.isMuted) return;

    // Coin collection sound
    this.playTone(1200, 0.08, 'sine', 0.15);
    this.playTone(1500, 0.06, 'sine', 0.12, 0.04);
    this.playTone(1800, 0.05, 'sine', 0.1, 0.07);
  }

  // ============ AMBIENT CASINO ATMOSPHERE ============

  startAmbient() {
    if (!this.ensureContext() || this.isAmbientPlaying || this.isMuted) return;

    this.isAmbientPlaying = true;

    // Create subtle ambient drone
    const frequencies = [110, 165, 220]; // A2, E3, A3 - subtle chord
    
    frequencies.forEach(freq => {
      const osc = this.createOscillator(freq, 'sine');
      const gain = this.createGain(0.02);
      
      // Add subtle LFO for movement
      const lfo = this.createOscillator(0.1 + Math.random() * 0.2, 'sine');
      const lfoGain = this.createGain(0.005);
      
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      
      osc.start();
      lfo.start();
      
      this.ambientOscillators.push(osc, lfo);
    });

    // Random casino sounds in background
    this.playRandomCasinoSounds();
  }

  private playRandomCasinoSounds() {
    if (!this.isAmbientPlaying || this.isMuted) return;

    const sounds = [
      () => this.playTone(800 + Math.random() * 400, 0.05, 'sine', 0.02), // Distant slot
      () => this.playTone(1200, 0.03, 'triangle', 0.015), // Coin clink
      () => this.playNoise(0.02, 0.01), // Distant chatter
    ];

    // Play random sound
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    randomSound();

    // Schedule next random sound
    setTimeout(() => this.playRandomCasinoSounds(), 2000 + Math.random() * 4000);
  }

  stopAmbient() {
    this.isAmbientPlaying = false;
    this.ambientOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.ambientOscillators = [];
  }



  // ============ SPECIAL EFFECTS ============

  countdown(number: number) {
    if (!this.ensureContext() || this.isMuted) return;

    const freq = number === 0 ? 800 : 400;
    const dur = number === 0 ? 0.3 : 0.15;
    this.playTone(freq, dur, 'sine', 0.2);
  }

  drumRoll(duration: number = 2) {
    if (!this.ensureContext() || this.isMuted) return;
    this.duck();

    const numBeats = Math.floor(duration * 20);
    for (let i = 0; i < numBeats; i++) {
      const volume = 0.05 + (i / numBeats) * 0.15; // Crescendo
      this.playTone(150 + Math.random() * 50, 0.03, 'triangle', volume, i * 0.05);
      this.playNoise(0.02, volume * 0.5, i * 0.05);
    }
  }

  suspense() {
    if (!this.ensureContext() || this.isMuted) return;
    this.duck();

    // Building suspense sound
    for (let i = 0; i < 10; i++) {
      const freq = 200 + i * 30;
      this.playTone(freq, 0.2, 'sine', 0.05 + i * 0.01, i * 0.15);
    }
  }

  // ============ PUZZLE SOUNDS ============

  puzzleCorrect() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Bright success sound
    this.playTone(523, 0.1, 'sine', 0.2);
    this.playTone(659, 0.1, 'sine', 0.2, 0.08);
    this.playTone(784, 0.15, 'sine', 0.25, 0.16);
    this.playTone(1047, 0.2, 'sine', 0.2, 0.24);
  }

  puzzleIncorrect() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Buzzer/wrong sound
    this.playTone(200, 0.15, 'sawtooth', 0.15);
    this.playTone(150, 0.2, 'sawtooth', 0.12, 0.1);
  }

  puzzleStart() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Alert/attention sound
    this.playTone(440, 0.08, 'sine', 0.15);
    this.playTone(550, 0.08, 'sine', 0.15, 0.1);
    this.playTone(660, 0.12, 'sine', 0.18, 0.2);
  }

  timerWarning() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Urgent ticking
    this.playTone(800, 0.05, 'square', 0.1);
  }

  timerCritical() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Fast urgent beeping
    this.playTone(1000, 0.03, 'square', 0.15);
    this.playTone(800, 0.03, 'square', 0.12, 0.05);
  }

  hintUsed() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Magical hint reveal
    this.playTone(600, 0.1, 'sine', 0.1);
    this.playTone(800, 0.1, 'sine', 0.12, 0.08);
    this.playTone(1000, 0.15, 'sine', 0.1, 0.16);
  }

  // ============ POWER-UP SOUNDS ============

  powerUpPurchase() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Magical purchase sound
    const notes = [392, 523, 659, 784];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.15, 'sine', 0.15, i * 0.08);
    });
  }

  powerUpActivate() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Power activation whoosh
    this.playTone(200, 0.1, 'sine', 0.1);
    this.playTone(400, 0.1, 'sine', 0.15, 0.05);
    this.playTone(800, 0.15, 'sine', 0.2, 0.1);
    this.playTone(1200, 0.2, 'sine', 0.15, 0.15);
    this.playNoise(0.2, 0.08);
  }

  shieldBlock() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Shield deflection sound
    this.playTone(300, 0.1, 'triangle', 0.2);
    this.playTone(600, 0.15, 'sine', 0.15, 0.05);
    this.playNoise(0.1, 0.1);
  }

  timeFreeze() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Time stopping effect
    for (let i = 0; i < 5; i++) {
      this.playTone(1000 - i * 150, 0.1, 'sine', 0.1, i * 0.08);
    }
  }

  doublePoints() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Multiplier activation
    this.playTone(523, 0.1, 'sine', 0.15);
    this.playTone(659, 0.1, 'sine', 0.15, 0.1);
    this.playTone(784, 0.1, 'sine', 0.15, 0.2);
    this.playTone(1047, 0.15, 'sine', 0.2, 0.3);
    this.playTone(1047, 0.15, 'sine', 0.2, 0.35);
  }

  streakBonus() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Fire/streak sound
    this.playNoise(0.15, 0.1);
    this.playTone(400, 0.1, 'sawtooth', 0.1);
    this.playTone(600, 0.1, 'sawtooth', 0.12, 0.08);
    this.playTone(800, 0.15, 'sawtooth', 0.1, 0.16);
  }

  // ============ MINI-GAME SOUNDS ============

  match3Match() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Match sound
    this.playTone(600, 0.08, 'sine', 0.15);
    this.playTone(800, 0.08, 'sine', 0.15, 0.06);
    this.playTone(1000, 0.1, 'sine', 0.12, 0.12);
  }

  match3Cascade() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Cascade/combo sound
    const notes = [523, 587, 659, 698, 784, 880];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.08, 'sine', 0.1, i * 0.05);
    });
  }

  memoryFlip() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Card flip sound
    this.playTone(400, 0.05, 'triangle', 0.1);
    this.playNoise(0.03, 0.05);
  }

  memoryMatch() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Memory match success
    this.playTone(523, 0.1, 'sine', 0.15);
    this.playTone(784, 0.15, 'sine', 0.18, 0.08);
  }

  wordFound() {
    if (!this.ensureContext() || this.isMuted) return;
    
    // Word discovery sound
    this.playTone(440, 0.08, 'sine', 0.12);
    this.playTone(554, 0.08, 'sine', 0.12, 0.06);
    this.playTone(659, 0.12, 'sine', 0.15, 0.12);
  }

  levelUp() {
    if (!this.ensureContext() || this.isMuted) return;
    this.duck();
    
    // Level up fanfare
    const melody = [
      { freq: 523, dur: 0.1 },
      { freq: 659, dur: 0.1 },
      { freq: 784, dur: 0.1 },
      { freq: 1047, dur: 0.3 },
    ];
    
    let time = 0;
    melody.forEach(note => {
      this.playTone(note.freq, note.dur, 'sine', 0.2, time);
      this.playTone(note.freq * 0.5, note.dur, 'triangle', 0.1, time);
      time += note.dur * 0.8;
    });
    
    this.unduck(800);
  }

  achievement() {
    if (!this.ensureContext() || this.isMuted) return;
    this.duck();
    
    // Achievement unlock sound
    const notes = [392, 523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.2, 'sine', 0.15, i * 0.1);
      this.playTone(freq * 1.5, 0.15, 'triangle', 0.08, i * 0.1);
    });
    
    // Sparkle effect
    for (let i = 0; i < 8; i++) {
      this.playTone(1500 + Math.random() * 1500, 0.08, 'sine', 0.05, 0.3 + Math.random() * 0.5);
    }
    
    this.unduck(1200);
  }
}

// Export singleton instance
export const casinoSounds = new CasinoSoundManager();

// Export type for use in components
export type { CasinoSoundManager };
