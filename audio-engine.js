/**
 * Coquette Mixtape Audio Engine (v2 — Real Studio Vocal Tracks + Tactile Foley)
 *
 * Primary music source:
 *  1. Custom user-attached MP3/audio files (if uploaded)
 *  2. Official studio vocal tracks fetched automatically via Apple iTunes Search API
 *     (CORS fetch with automatic JSONP fallback so it works on localhost AND file://)
 *  3. Gentle felt-piano Web Audio synthesizer ONLY as offline fallback if no network.
 */

class MixtapeAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.crackleGain = null;
    this.reverbNode = null;

    this.volume = 0.85;
    this.isMuted = false;
    // Keep tape crackle off by default so studio vocals sound crystal clear
    this.tapeWarmthEnabled = false;

    // Playback state
    this.isPlaying = false;
    this.currentTrackIndex = 0;
    this.currentTime = 0;
    this.duration = 30;
    this.stepTimer = null;
    this.progressTimer = null;
    this.stepIndex = 0;

    // Real vocal audio elements: custom uploads & resolved iTunes studio vocal streams
    this.customAudioElements = new Map();
    this.vocalStreamData = new Map(); // index -> { url, artwork, durationSec, audio }
    this.activeHtmlAudio = null;
    this._streamResolvePromises = new Map();
    this._playRequestId = 0;

    // Voice note state
    this.voicePlaying = false;
    this.voiceTime = 0;
    this.voiceDuration = 24;
    this.voiceTimer = null;
    this.voicePadTimer = null;
    this.customVoiceAudio = null;

    // Callbacks
    this.onTimeUpdate = null;
    this.onPlayStateChange = null;
    this.onTrackEnd = null;
    this.onVoiceUpdate = null;
    this.onVocalStreamReady = null;

    this.noteFreqs = this._buildNoteTable();
    this.arrangements = this._buildArrangements();
  }

  /* =========================================================
   * REAL STUDIO VOCAL STREAM RESOLVER (iTunes API + JSONP)
   * ========================================================= */

  preloadVocalStreams(tracks) {
    tracks.forEach((track, idx) => {
      this.resolveTrackVocalStream(idx, track);
    });
  }

  resolveTrackVocalStream(idx, track) {
    if (this._streamResolvePromises.has(idx)) {
      return this._streamResolvePromises.get(idx);
    }

    const promise = (async () => {
      const searchQuery = track.itunesQuery || `${track.title} ${track.artist}`;
      const expectedArtist = (track.expectedArtist || track.artist).toLowerCase();
      const expectedTitle = track.title.toLowerCase();

      let results = await this._queryItunes(searchQuery);
      if (!results || results.length === 0) {
        results = await this._queryItunes(`${track.title} ${expectedArtist}`);
      }

      if (results && results.length > 0) {
        const picked = this._pickBestStudioTrack(results, expectedTitle, expectedArtist);
        if (picked && picked.previewUrl) {
          const artworkHiRes = picked.artworkUrl100
            ? picked.artworkUrl100.replace('100x100bb', '600x600bb')
            : null;

          const audioEl = new Audio();
          audioEl.preload = 'auto';
          audioEl.src = picked.previewUrl;

          const meta = {
            url: picked.previewUrl,
            artwork: artworkHiRes,
            trackName: picked.trackName,
            artistName: picked.artistName,
            audio: audioEl
          };

          audioEl.addEventListener('loadedmetadata', () => {
            if (isFinite(audioEl.duration) && audioEl.duration > 0) {
              meta.durationSec = audioEl.duration;
              if (this.currentTrackIndex === idx && !this.customAudioElements.has(idx)) {
                this.duration = audioEl.duration;
                if (this.onTimeUpdate) {
                  this.onTimeUpdate(this.currentTime, this.duration);
                }
              }
            }
          });

          this.vocalStreamData.set(idx, meta);
          if (this.onVocalStreamReady) {
            this.onVocalStreamReady(idx, meta);
          }
          return meta;
        }
      }
      return null;
    })();

    this._streamResolvePromises.set(idx, promise);
    return promise;
  }

  _pickBestStudioTrack(results, expectedTitle, expectedArtist) {
    const withPreview = results.filter((r) => Boolean(r.previewUrl));
    if (withPreview.length === 0) return null;

    const bannedWords = ['karaoke', 'instrumental', 'tribute', '8-bit', 'lullaby', 'ringtone', 'made famous'];

    const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    const normTitle = norm(expectedTitle);
    const normArtist = norm(expectedArtist);

    const scored = withPreview.map((item) => {
      const tName = (item.trackName || '').toLowerCase();
      const aName = (item.artistName || '').toLowerCase();
      const cName = (item.collectionName || '').toLowerCase();
      const normT = norm(tName);
      const normA = norm(aName);
      let score = 0;

      if (normA.includes(normArtist) || normArtist.includes(normA)) score += 60;
      if (normT === normTitle) score += 50;
      else if (normT.startsWith(normTitle) || normTitle.startsWith(normT)) score += 35;
      else if (normT.includes(normTitle) || normTitle.includes(normT)) score += 20;

      // Variantes especiales comunes para las canciones seleccionadas
      if (normTitle.includes('1004') && normT.includes('1004')) score += 55;
      if ((normTitle.includes('reina') || normTitle.includes('reyna')) && (normT.includes('reina') || normT.includes('reyna'))) score += 55;
      if (normTitle.includes('mai') && normT.includes('mai')) score += 55;
      if (normTitle.includes('inarow') && normT.includes('inarow')) score += 55;
      if (normTitle.includes('309') && normT.includes('309')) score += 55;

      for (const bad of bannedWords) {
        if (tName.includes(bad) || aName.includes(bad) || cName.includes(bad)) {
          score -= 100;
        }
      }
      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0] ? scored[0].item : null;
  }

  async _queryItunes(term) {
    const encoded = encodeURIComponent(term);
    const url = `https://itunes.apple.com/search?term=${encoded}&media=music&entity=song&country=US&limit=15`;

    // 1. Try standard CORS fetch first
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.results)) {
          return json.results;
        }
      }
    } catch (_) {
      // Fallback to JSONP below
    }

    // 2. Fallback to JSONP <script> (works even on file:// or strict proxies)
    return new Promise((resolve) => {
      const cbName = `__itunesMixtapeCb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      const script = document.createElement('script');
      let settled = false;

      const cleanup = () => {
        if (script.parentNode) script.parentNode.removeChild(script);
        try {
          delete window[cbName];
        } catch (_) {
          window[cbName] = undefined;
        }
      };

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          resolve([]);
        }
      }, 6500);

      window[cbName] = (data) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          cleanup();
          resolve(data && Array.isArray(data.results) ? data.results : []);
        }
      };

      script.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          cleanup();
          resolve([]);
        }
      };

      script.src = `${url}&callback=${cbName}`;
      document.head.appendChild(script);
    });
  }

  /* =========================================================
   * TRACK PLAYBACK CONTROLS (REAL VOCAL AUDIO FIRST)
   * ========================================================= */

  attachCustomTrackFile(trackIndex, fileUrl) {
    const audio = new Audio(fileUrl);
    audio.preload = 'metadata';
    this.customAudioElements.set(trackIndex, audio);
  }

  getTrackArtwork(trackIndex) {
    const data = this.vocalStreamData.get(trackIndex);
    return data ? data.artwork : null;
  }

  hasVocalStream(trackIndex) {
    return this.customAudioElements.has(trackIndex) || this.vocalStreamData.has(trackIndex);
  }

  loadTrack(index, fallbackDurationSeconds) {
    const wasPlaying = this.isPlaying;
    this.pause(false);
    this.currentTrackIndex = index;
    this.currentTime = 0;
    this.stepIndex = 0;

    const customAudio = this.customAudioElements.get(index);
    const streamMeta = this.vocalStreamData.get(index);

    if (customAudio && isFinite(customAudio.duration) && customAudio.duration > 0) {
      this.duration = customAudio.duration;
    } else if (streamMeta && streamMeta.durationSec) {
      this.duration = streamMeta.durationSec;
    } else if (streamMeta) {
      this.duration = 30;
    } else {
      this.duration = fallbackDurationSeconds || 30;
    }

    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.currentTime, this.duration);
    }
    if (wasPlaying) {
      this.play();
    }
  }

  async play() {
    this.init();
    if (this.voicePlaying) {
      this.stopVoiceNote();
    }
    if (this.isPlaying) return;

    const reqId = ++this._playRequestId;
    const trackIdx = this.currentTrackIndex;

    this.isPlaying = true;
    this._updateCrackleState();
    if (this.onPlayStateChange) {
      this.onPlayStateChange(true);
    }

    // 1. User-attached full MP3
    let htmlAudio = this.customAudioElements.get(trackIdx) || null;

    // 2. Official studio vocal stream (await resolution if still loading on first click)
    if (!htmlAudio) {
      let streamMeta = this.vocalStreamData.get(trackIdx);
      if (!streamMeta && this._streamResolvePromises.has(trackIdx)) {
        streamMeta = await this._streamResolvePromises.get(trackIdx);
      }
      if (reqId !== this._playRequestId || !this.isPlaying) {
        return; // Superseded by pause or track switch
      }
      if (streamMeta && streamMeta.audio) {
        htmlAudio = streamMeta.audio;
      }
    }

    if (htmlAudio) {
      this._bindAndPlayHtmlAudio(htmlAudio, reqId);
    } else {
      // 3. Offline fallback synth only if no internet & no MP3
      this._startSynthLoop();
    }
  }

  _bindAndPlayHtmlAudio(audioEl, reqId) {
    this.activeHtmlAudio = audioEl;
    audioEl.volume = this.isMuted ? 0 : this.volume;
    audioEl.muted = this.isMuted;

    if (isFinite(audioEl.duration) && audioEl.duration > 0) {
      this.duration = audioEl.duration;
      if (this.currentTime >= audioEl.duration - 0.3) {
        this.currentTime = 0;
      }
    }

    try {
      audioEl.currentTime = this.currentTime;
    } catch (_) {}

    audioEl.ontimeupdate = () => {
      if (this.activeHtmlAudio !== audioEl) return;
      this.currentTime = audioEl.currentTime;
      if (isFinite(audioEl.duration) && audioEl.duration > 0) {
        this.duration = audioEl.duration;
      }
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.currentTime, this.duration);
      }
    };

    audioEl.onended = () => {
      if (this.activeHtmlAudio !== audioEl) return;
      this.isPlaying = false;
      this.currentTime = 0;
      this._updateCrackleState();
      if (this.onTrackEnd) {
        this.onTrackEnd();
      }
    };

    const playPromise = audioEl.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        if (reqId !== this._playRequestId) return;
        // Fallback to synth only if stream failed completely
        this.activeHtmlAudio = null;
        if (this.isPlaying) {
          this._startSynthLoop();
        }
      });
    }
  }

  pause(emit = true) {
    this._playRequestId++;
    this.isPlaying = false;
    if (this.stepTimer) {
      clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
    if (this.activeHtmlAudio) {
      this.activeHtmlAudio.pause();
      this.activeHtmlAudio = null;
    }
    this._updateCrackleState();
    if (emit && this.onPlayStateChange) {
      this.onPlayStateChange(false);
    }
  }

  seek(seconds) {
    this.currentTime = Math.max(0, Math.min(this.duration, seconds));
    const customAudio = this.customAudioElements.get(this.currentTrackIndex);
    const streamMeta = this.vocalStreamData.get(this.currentTrackIndex);
    const targetAudio = this.activeHtmlAudio || customAudio || (streamMeta && streamMeta.audio);

    if (targetAudio) {
      try {
        targetAudio.currentTime = this.currentTime;
      } catch (_) {}
    } else {
      const arr = this.arrangements[this.currentTrackIndex % this.arrangements.length];
      const stepSec = (60 / arr.bpm) * arr.stepBeats;
      this.stepIndex = Math.floor(this.currentTime / stepSec) % arr.steps.length;
    }

    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.currentTime, this.duration);
    }
  }

  /* =========================================================
   * WEB AUDIO INITIALIZATION, FOLEY SFX & VOICE NOTE
   * ========================================================= */

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();

    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 24;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.25;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.isMuted ? 0 : this.volume;

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.85;

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.7;

    this.reverbNode = this._createWarmReverb(2.2, 2.4);
    const reverbWet = this.ctx.createGain();
    reverbWet.gain.value = 0.4;

    const dryGain = this.ctx.createGain();
    dryGain.gain.value = 0.72;

    this.musicGain.connect(dryGain);
    this.musicGain.connect(this.reverbNode);
    this.reverbNode.connect(reverbWet);

    dryGain.connect(compressor);
    reverbWet.connect(compressor);
    this.sfxGain.connect(compressor);

    compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this._setupTapeWarmthNode();
  }

  _createWarmReverb(durationSeconds, decay) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * durationSeconds);
    const impulse = this.ctx.createBuffer(2, length, rate);

    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.14 * white) / 1.14;
        data[i] = lastOut * Math.pow(1 - i / length, decay) * 1.8;
      }
    }

    const convolver = this.ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  _setupTapeWarmthNode() {
    if (!this.ctx) return;
    const rate = this.ctx.sampleRate;
    const seconds = 4;
    const buffer = this.ctx.createBuffer(1, rate * seconds, rate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.950 * b2 + white * 0.048;
      let sample = (b0 + b1 + b2) * 0.1;
      if (Math.random() < 0.0004) {
        sample += (Math.random() * 0.28 - 0.14);
      }
      data[i] = sample;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1150;
    filter.Q.value = 0.7;

    this.crackleGain = this.ctx.createGain();
    this.crackleGain.gain.value = 0;

    noiseSource.connect(filter);
    filter.connect(this.crackleGain);
    this.crackleGain.connect(this.masterGain);
    noiseSource.start();
  }

  _updateCrackleState() {
    if (!this.crackleGain || !this.ctx) return;
    const shouldPlayCrackle = (this.isPlaying || this.voicePlaying) && this.tapeWarmthEnabled && !this.isMuted;
    const target = shouldPlayCrackle ? 0.028 : 0;
    this.crackleGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.15);
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    if (this.activeHtmlAudio) {
      this.activeHtmlAudio.volume = this.isMuted ? 0 : this.volume;
    }
    if (this.customVoiceAudio) {
      this.customVoiceAudio.volume = this.isMuted ? 0 : this.volume;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
    if (this.activeHtmlAudio) {
      this.activeHtmlAudio.muted = this.isMuted;
    }
    if (this.customVoiceAudio) {
      this.customVoiceAudio.muted = this.isMuted;
    }
    this._updateCrackleState();
    return this.isMuted;
  }

  toggleTapeWarmth() {
    this.tapeWarmthEnabled = !this.tapeWarmthEnabled;
    this._updateCrackleState();
    return this.tapeWarmthEnabled;
  }

  playEnvelopeOpen() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'triangle';
    popOsc.frequency.setValueAtTime(320, now);
    popOsc.frequency.exponentialRampToValueAtTime(95, now + 0.06);
    popGain.gain.setValueAtTime(0.22, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    popOsc.connect(popGain);
    popGain.connect(this.sfxGain);
    popOsc.start(now);
    popOsc.stop(now + 0.08);

    const len = Math.floor(this.ctx.sampleRate * 0.35);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
    }
    const paper = this.ctx.createBufferSource();
    paper.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1900, now + 0.08);
    bp.Q.value = 1.1;
    const pGain = this.ctx.createGain();
    pGain.gain.setValueAtTime(0.08, now + 0.08);
    paper.connect(bp);
    bp.connect(pGain);
    pGain.connect(this.sfxGain);
    paper.start(now + 0.08);

    const sparkleNotes = ['Ab4', 'C5', 'Eb5', 'Ab5'];
    sparkleNotes.forEach((n, idx) => {
      this._triggerNote(this.noteFreqs[n], now + 0.26 + idx * 0.11, 1.5, 0.3, 'vintage-celesta');
    });
  }

  playCassetteClick() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(58, now + 0.032);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.036);

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 950;

    osc.connect(lp);
    lp.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  playPetalChime(pitchIndex = 0) {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const scale = ['C5', 'Eb5', 'F5', 'G5', 'Ab5', 'C6'];
    const note = scale[pitchIndex % scale.length];
    const now = this.ctx.currentTime;
    this._triggerNote(this.noteFreqs[note], now, 1.3, 0.32, 'vintage-celesta');
    const fifth = scale[(pitchIndex + 2) % scale.length];
    this._triggerNote(this.noteFreqs[fifth], now + 0.08, 1.4, 0.2, 'vintage-celesta');
  }

  /* =========================================================
   * VOICE NOTE PLAYBACK
   * ========================================================= */

  setCustomVoiceBlobUrl(url, durationSec = 92) {
    this.customVoiceAudio = new Audio(url);
    this.customVoiceAudio.preload = 'auto';
    this.voiceDuration = durationSec;
    this.customVoiceAudio.addEventListener('loadedmetadata', () => {
      if (isFinite(this.customVoiceAudio.duration) && this.customVoiceAudio.duration > 0) {
        this.voiceDuration = this.customVoiceAudio.duration;
        if (this.onVoiceUpdate) {
          this.onVoiceUpdate(this.voiceTime, this.voiceDuration, this.voicePlaying);
        }
      }
    });
  }

  toggleVoiceNote() {
    if (this.voicePlaying) {
      this.stopVoiceNote();
      return false;
    }
    this.startVoiceNote();
    return true;
  }

  startVoiceNote() {
    this.init();
    if (this.isPlaying) {
      this.pause(true);
    }
    this.playCassetteClick();
    this.voicePlaying = true;
    this._updateCrackleState();

    if (this.customVoiceAudio) {
      const dur = isFinite(this.customVoiceAudio.duration) && this.customVoiceAudio.duration > 0
        ? this.customVoiceAudio.duration
        : this.voiceDuration;
      if (this.voiceTime >= dur) {
        this.voiceTime = 0;
      }
      this.customVoiceAudio.currentTime = this.voiceTime;
      this.customVoiceAudio.volume = this.isMuted ? 0 : this.volume;
      this.customVoiceAudio.play().catch((err) => {
        console.warn('Voice play:', err);
      });
      this.customVoiceAudio.ontimeupdate = () => {
        this.voiceTime = this.customVoiceAudio.currentTime;
        const d = isFinite(this.customVoiceAudio.duration) && this.customVoiceAudio.duration > 0
          ? this.customVoiceAudio.duration
          : this.voiceDuration;
        if (this.onVoiceUpdate) this.onVoiceUpdate(this.voiceTime, d, true);
      };
      this.customVoiceAudio.onended = () => {
        this.voiceTime = 0;
        this.stopVoiceNote();
      };
      return;
    }

    if (this.voiceTime >= this.voiceDuration) {
      this.voiceTime = 0;
    }

    const chords = [
      ['Ab3', 'C4', 'Eb4', 'G4'],
      ['F3', 'Ab3', 'C4', 'Eb4'],
      ['Db3', 'F3', 'Ab3', 'C4'],
      ['Eb3', 'G3', 'Bb3', 'Eb4']
    ];
    let cIdx = 0;
    const playWarmPad = () => {
      if (!this.voicePlaying || !this.ctx) return;
      const now = this.ctx.currentTime + 0.03;
      const chord = chords[cIdx % chords.length];
      chord.forEach((n, i) => {
        this._triggerNote(this.noteFreqs[n], now + i * 0.09, 3.2, 0.34, 'felt-piano');
      });
      cIdx++;
      this.voicePadTimer = setTimeout(playWarmPad, 3000);
    };
    playWarmPad();

    this.voiceTimer = setInterval(() => {
      if (!this.voicePlaying) return;
      this.voiceTime += 0.2;
      if (this.voiceTime >= this.voiceDuration) {
        this.voiceTime = 0;
        this.stopVoiceNote();
        return;
      }
      if (this.onVoiceUpdate) {
        this.onVoiceUpdate(this.voiceTime, this.voiceDuration, true);
      }
    }, 200);

    if (this.onVoiceUpdate) {
      this.onVoiceUpdate(this.voiceTime, this.voiceDuration, true);
    }
  }

  stopVoiceNote() {
    this.voicePlaying = false;
    if (this.voiceTimer) {
      clearInterval(this.voiceTimer);
      this.voiceTimer = null;
    }
    if (this.voicePadTimer) {
      clearTimeout(this.voicePadTimer);
      this.voicePadTimer = null;
    }
    if (this.customVoiceAudio) {
      this.customVoiceAudio.pause();
    }
    this._updateCrackleState();
    if (this.onVoiceUpdate) {
      const dur = (this.customVoiceAudio && isFinite(this.customVoiceAudio.duration) && this.customVoiceAudio.duration > 0)
        ? this.customVoiceAudio.duration
        : this.voiceDuration;
      this.onVoiceUpdate(this.voiceTime, dur, false);
    }
  }

  seekVoiceNote(ratio) {
    const dur = (this.customVoiceAudio && isFinite(this.customVoiceAudio.duration) && this.customVoiceAudio.duration > 0)
      ? this.customVoiceAudio.duration
      : this.voiceDuration;
    this.voiceTime = Math.max(0, Math.min(dur, ratio * dur));
    if (this.customVoiceAudio) {
      this.customVoiceAudio.currentTime = this.voiceTime;
    }
    if (this.onVoiceUpdate) {
      this.onVoiceUpdate(this.voiceTime, dur, this.voicePlaying);
    }
  }

  /* =========================================================
   * OFFLINE SYNTH FALLBACK (ONLY USED IF NO INTERNET)
   * ========================================================= */

  _buildNoteTable() {
    const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const aliases = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };
    const table = {};
    for (let oct = 2; oct <= 6; oct++) {
      names.forEach((n, i) => {
        const midi = (oct + 1) * 12 + i;
        table[`${n}${oct}`] = 440 * Math.pow(2, (midi - 69) / 12);
      });
      Object.entries(aliases).forEach(([flat, sharp]) => {
        table[`${flat}${oct}`] = table[`${sharp}${oct}`];
      });
    }
    return table;
  }

  _buildArrangements() {
    return [
      {
        bpm: 96,
        stepBeats: 0.75,
        tone: 'musicbox-piano',
        steps: [
          { chord: ['Ab3', 'Eb4', 'Ab4'], melody: 'C5', vel: 0.8 },
          { melody: 'Eb4', vel: 0.45 },
          { melody: 'Ab4', vel: 0.55 },
          { chord: ['F3', 'C4', 'Ab4'], melody: 'C5', vel: 0.8 },
          { melody: 'F4', vel: 0.45 },
          { melody: 'Ab4', vel: 0.55 }
        ]
      }
    ];
  }

  _triggerNote(freq, startTime, duration, velocity = 0.7, tone = 'musicbox-piano') {
    if (!this.ctx || !freq) return;
    const noteGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(tone === 'felt-piano' ? 1800 : 2500, startTime);
    filter.frequency.exponentialRampToValueAtTime(650, startTime + duration);

    const osc1 = this.ctx.createOscillator();
    osc1.type = tone === 'felt-piano' ? 'triangle' : 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    const peak = 0.13 * velocity;
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(peak, startTime + 0.018);
    noteGain.gain.exponentialRampToValueAtTime(peak * 0.42, startTime + 0.24);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.musicGain);

    osc1.start(startTime);
    osc1.stop(startTime + duration + 0.04);
  }

  _startSynthLoop() {
    const arr = this.arrangements[0];
    const stepMs = (60 / arr.bpm) * arr.stepBeats * 1000;

    const playStep = () => {
      if (!this.isPlaying || !this.ctx) return;
      const step = arr.steps[this.stepIndex % arr.steps.length];
      const now = this.ctx.currentTime + 0.02;
      if (step.chord) {
        step.chord.forEach((n, idx) => {
          this._triggerNote(this.noteFreqs[n], now + idx * 0.024, 2.2, 0.42, arr.tone);
        });
      }
      if (step.melody) {
        this._triggerNote(this.noteFreqs[step.melody], now + 0.05, 1.5, 0.7, arr.tone);
      }
      this.stepIndex = (this.stepIndex + 1) % arr.steps.length;
      this.stepTimer = setTimeout(playStep, stepMs);
    };
    playStep();

    this.progressTimer = setInterval(() => {
      if (!this.isPlaying) return;
      this.currentTime += 0.25;
      if (this.currentTime >= this.duration) {
        this.currentTime = 0;
        this.pause(false);
        if (this.onTrackEnd) this.onTrackEnd();
        return;
      }
      if (this.onTimeUpdate) this.onTimeUpdate(this.currentTime, this.duration);
    }, 250);
  }
}

window.MixtapeAudioEngine = MixtapeAudioEngine;
