/**
 * CANCIONES PARA TI — Regalo Digital Coquette Vintage (v3)
 * Incluye canciones de Álvaro Díaz, Nsqk, Milo J y Junior H con voces reales,
 * contador en tiempo real desde el 24 de julio de 2026, carta romántica,
 * nota de voz íntima y ramo de flores virtual con poemas personalizados.
 */

(function () {
  'use strict';

  /* ========================================================================
   * 1. CANCIONES Y FLORES PERSONALIZADAS
   * ======================================================================== */

  const TRACKS = [
    {
      id: 'inarow62',
      num: '01',
      title: 'INAROW62.',
      artist: 'Álvaro Díaz',
      expectedArtist: 'alvaro diaz',
      itunesQuery: 'INAROW62 Alvaro Diaz',
      duration: 192,
      durationLabel: '3:12',
      dedication: 'Para cuando te pienso sin parar ♡',
      liked: true,
      lyrics: [
        '“Tú me tienes pensando en ti todo el día…”',
        '“No me canso de mirar tu carita tan linda…”',
        '“Siempre eres tú mi lugar favorito.”'
      ]
    },
    {
      id: '309',
      num: '02',
      title: '309',
      artist: 'Nsqk',
      expectedArtist: 'nsqk',
      itunesQuery: '309 Nsqk',
      duration: 204,
      durationLabel: '3:24',
      dedication: 'Para esas noches donde solo existimos tú y yo',
      liked: true,
      lyrics: [
        '“Y si me pierdo, sé que en ti me encuentro…”',
        '“Me quedo despierto pensando en volver a verte…”',
        '“Tú haces que todo lo demás desaparezca.”'
      ]
    },
    {
      id: 'mai',
      num: '03',
      title: 'M.A.I',
      artist: 'Milo J',
      expectedArtist: 'milo j',
      itunesQuery: 'm.a.i Milo J',
      duration: 168,
      durationLabel: '2:48',
      dedication: 'Porque me encantas de una manera inexplicable',
      liked: true,
      lyrics: [
        '“Y es que tú me tienes volando tan alto…”',
        '“Quédate cerquita que contigo todo brilla…”',
        '“Me enamoré de ti sin darme cuenta.”'
      ]
    },
    {
      id: 'reyna-pepiada',
      num: '04',
      title: 'Reina Pepiada',
      artist: 'Álvaro Díaz',
      expectedArtist: 'alvaro diaz',
      itunesQuery: 'Reina Pepiada Alvaro Diaz',
      duration: 178,
      durationLabel: '2:58',
      dedication: 'Para mi niña más hermosa de todas',
      liked: true,
      lyrics: [
        '“Tú eres mi reina en todos los sentidos…”',
        '“Ese piquete tuyo que me vuelve loco…”',
        '“La más bella del mundo entero.”'
      ]
    },
    {
      id: '1004km',
      num: '05',
      title: '1004km',
      artist: 'Junior H',
      expectedArtist: 'junior h',
      itunesQuery: '1004km Junior H',
      duration: 190,
      durationLabel: '3:10',
      dedication: 'No importa la distancia, mi corazón siempre está contigo',
      liked: true,
      lyrics: [
        '“Aunque haya kilómetros entre nosotros, siempre estás aquí…”',
        '“Cierro los ojos y te siento cerquita de mí…”',
        '“Pronto nos volvemos a abrazar.”'
      ]
    }
  ];

  const FLOWERS = [
    {
      shortName: 'Flor 01 • Peonía',
      title: 'Flor 01 • Peonía rosa',
      meaning: 'Eres el papoi de mi papoi'
    },
    {
      shortName: 'Flor 02 • Rosa',
      title: 'Flor 02 • Rosa de jardín',
      meaning: `Hay un café tan hondo en tu mirada
que me desarma con solo sonreír
tus ojos son mi paz más esperada,
el único lugar donde quiero vivir`
    },
    {
      shortName: 'Flor 03 • Ranúnculo',
      title: 'Flor 03 • Ranúnculo crema',
      meaning: `Tu sonrisa de pronto se levanta
y me borra del pecho cualquier duda;
es una luz sencilla que me encanta,
la cura fácil de mi alma desnuda`
    },
    {
      shortName: 'Flor 04 • Lirio',
      title: 'Flor 04 • Lirio de los valles',
      meaning: `Me gusta tu piel, tu andar, tu forma entera,
lo que cuentas sin palabras al tocarme;
tu cuerpo es el abrazo que quisiera
por el resto de mis días para amarte`
    },
    {
      shortName: 'Flor 05 • Lazo & Paniculata',
      title: 'Flor 05 • Lazo de satén y paniculata',
      meaning: `Podrá el mundo cambiar de rumbo un día,
y los años pasar sin darnos cuenta,
pero tú fuiste, eres y serás la mía,
la única verdad que me alimenta.`
    }
  ];

  /* Fecha inicial para el contador de noviazgo: 24 de julio de 2026 */
  const RELATIONSHIP_START = new Date('2026-07-24T00:00:00');

  /* Fecha inicial para la hermosa amistad: 2022 */
  const FRIENDSHIP_START = new Date('2022-01-01T00:00:00');

  /* ========================================================================
   * 2. ESTADO Y ELEMENTOS DEL DOM
   * ======================================================================== */

  const audio = new window.MixtapeAudioEngine();
  let activeTrackIdx = 0;
  let isEnvelopeOpened = false;

  const dom = {
    envelopeScreen: document.getElementById('envelope-screen'),
    envelopeStage: document.getElementById('envelope-stage'),
    waxSealBtn: document.getElementById('wax-seal-btn'),
    replayEnvelopeBtn: document.getElementById('replay-envelope-btn'),
    muteToggleBtn: document.getElementById('mute-toggle-btn'),
    giftMain: document.getElementById('gift-main'),

    // Reproductor casete
    cassetteWrap: document.getElementById('cassette-artwork-wrap'),
    cassetteTrackLabel: document.getElementById('cassette-track-label'),
    cassetteMixtapeSub: document.getElementById('cassette-mixtape-sub'),
    tapePackLeft: document.getElementById('tape-pack-left'),
    tapePackRight: document.getElementById('tape-pack-right'),
    lyricWhisperText: document.getElementById('lyric-whisper-text'),
    timeCurrent: document.getElementById('time-current'),
    timeTotal: document.getElementById('time-total'),
    progressTrack: document.getElementById('progress-track'),
    progressFill: document.getElementById('progress-fill'),
    playPauseBtn: document.getElementById('play-pause-btn'),
    playPauseIcon: document.getElementById('play-pause-icon'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    tapeWarmthBtn: document.getElementById('tape-warmth-btn'),
    volumeSlider: document.getElementById('volume-slider'),

    // Lista de canciones
    trackList: document.getElementById('track-list'),

    // Carta y posdata
    psSecretCard: document.getElementById('ps-secret-card'),

    // Nota de voz
    voiceMemoBox: document.getElementById('voice-memo-box'),
    voicePlayBtn: document.getElementById('voice-play-btn'),
    voicePlayIcon: document.getElementById('voice-play-icon'),
    voiceWaveform: document.getElementById('voice-waveform'),
    voiceTime: document.getElementById('voice-time'),
    voicePhrases: document.querySelectorAll('.voice-phrase'),

    // Contador en tiempo real (Amor y Amistad)
    countDays: document.getElementById('count-days'),
    countHours: document.getElementById('count-hours'),
    countMinutes: document.getElementById('count-minutes'),
    countSeconds: document.getElementById('count-seconds'),
    countFriendDays: document.getElementById('count-friend-days'),
    countFriendHours: document.getElementById('count-friend-hours'),
    countFriendMinutes: document.getElementById('count-friend-minutes'),
    countFriendSeconds: document.getElementById('count-friend-seconds'),

    // Ramo de flores
    flowerPins: document.querySelectorAll('.flower-pin'),
    flowerPillsRow: document.getElementById('flower-pills-row'),
    flowerMeaningName: document.getElementById('flower-meaning-name'),
    flowerMeaningText: document.getElementById('flower-meaning-text'),
    petalShowerBtn: document.getElementById('petal-shower-btn'),
    footerPetalBtn: document.getElementById('footer-petal-btn')
  };

  /* ========================================================================
   * 3. FUNCIONES DE APOYO
   * ======================================================================== */

  function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec || 0));
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ========================================================================
   * 4. APERTURA DEL SOBRE ("Toca para abrir")
   * ======================================================================== */

  function openEnvelope() {
    if (isEnvelopeOpened) return;
    isEnvelopeOpened = true;

    audio.playEnvelopeOpen();
    dom.envelopeStage.classList.add('is-opening');
    spawnPetals(32);

    setTimeout(() => {
      dom.envelopeScreen.classList.add('is-hidden');
      document.body.classList.remove('envelope-locked');
      dom.giftMain.classList.add('is-revealed');
    }, 950);
  }

  function replayEnvelope() {
    audio.playCassetteClick();
    isEnvelopeOpened = false;
    dom.envelopeStage.classList.remove('is-opening');
    dom.envelopeScreen.classList.remove('is-hidden');
    document.body.classList.add('envelope-locked');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  dom.envelopeStage.addEventListener('click', openEnvelope);
  dom.envelopeStage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEnvelope();
    }
  });
  dom.waxSealBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openEnvelope();
  });
  dom.replayEnvelopeBtn.addEventListener('click', replayEnvelope);

  /* ========================================================================
   * 5. LISTA DE CANCIONES Y CASETE VINTAGE (VOCES REALES)
   * ======================================================================== */

  // Precargar las pistas vocales de estudio
  audio.onVocalStreamReady = (idx) => {
    renderTracklist();
  };
  audio.preloadVocalStreams(TRACKS);

  function renderTracklist() {
    dom.trackList.innerHTML = '';

    TRACKS.forEach((track, idx) => {
      const li = document.createElement('li');
      li.className = `track-item${idx === activeTrackIdx ? ' is-active' : ''}${idx === activeTrackIdx && audio.isPlaying ? ' is-playing' : ''}`;
      li.dataset.index = idx;

      const hasVocal = audio.hasVocalStream(idx);
      const sourceBadge = hasVocal ? ' • 🎤 Voz Original' : '';

      li.innerHTML = `
        <button type="button" class="track-index-btn" aria-label="Reproducir ${escapeHtml(track.title)}">
          <span class="track-num-text">${track.num}</span>
          <span class="eq-bars" aria-hidden="true">
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
          </span>
        </button>

        <div class="track-info">
          <div class="track-title-row">
            <span class="track-title">${escapeHtml(track.title)}</span>
            <span class="track-artist">— ${escapeHtml(track.artist)}${sourceBadge}</span>
          </div>
          <p class="track-dedication">${escapeHtml(track.dedication)}</p>
        </div>

        <div class="track-actions">
          <button type="button" class="track-heart-btn${track.liked ? ' is-liked' : ''}" data-heart-idx="${idx}" aria-label="Favorito">
            ${track.liked ? '♥' : '♡'}
          </button>
          <span class="track-duration">${track.durationLabel}</span>
        </div>
      `;

      li.addEventListener('click', (e) => {
        if (e.target.closest('.track-heart-btn')) return;
        audio.playCassetteClick();
        if (activeTrackIdx === idx) {
          togglePlayPause();
        } else {
          selectTrack(idx, true);
        }
      });

      dom.trackList.appendChild(li);
    });

    dom.trackList.querySelectorAll('.track-heart-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.heartIdx);
        TRACKS[idx].liked = !TRACKS[idx].liked;
        btn.classList.toggle('is-liked', TRACKS[idx].liked);
        btn.textContent = TRACKS[idx].liked ? '♥' : '♡';
        if (TRACKS[idx].liked) {
          audio.playPetalChime(idx);
        }
      });
    });
  }

  function selectTrack(idx, autoPlay = false) {
    activeTrackIdx = (idx + TRACKS.length) % TRACKS.length;
    const track = TRACKS[activeTrackIdx];

    audio.loadTrack(activeTrackIdx, track.duration);

    dom.cassetteTrackLabel.textContent = `${track.num}. ${track.title} — ${track.artist}`;
    dom.timeCurrent.textContent = '0:00';
    dom.timeTotal.textContent = track.durationLabel;
    dom.lyricWhisperText.textContent = track.lyrics[0];
    updateProgressUI(0, audio.duration);
    renderTracklist();

    if (autoPlay) {
      audio.play();
    }
  }

  function togglePlayPause() {
    audio.playCassetteClick();
    if (audio.isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }

  function updateProgressUI(current, total) {
    const safeTotal = total > 0 ? total : 1;
    const ratio = Math.max(0, Math.min(1, current / safeTotal));
    const pct = (ratio * 100).toFixed(2);

    dom.progressFill.style.width = `${pct}%`;
    dom.progressTrack.setAttribute('aria-valuenow', Math.round(ratio * 100));
    dom.timeCurrent.textContent = formatTime(current);
    dom.timeTotal.textContent = formatTime(safeTotal);

    // Transferencia visual de cinta magnética
    const leftR = 42 - ratio * 18;
    const rightR = 24 + ratio * 18;
    dom.tapePackLeft.setAttribute('r', leftR.toFixed(1));
    dom.tapePackRight.setAttribute('r', rightR.toFixed(1));

    // Rotar frase romántica de la pista activa
    const track = TRACKS[activeTrackIdx];
    if (track && track.lyrics.length > 0) {
      const segmentDur = Math.max(4, safeTotal / track.lyrics.length);
      const lyricIdx = Math.min(track.lyrics.length - 1, Math.floor(current / segmentDur));
      const activeLyric = track.lyrics[lyricIdx];
      if (dom.lyricWhisperText.textContent !== activeLyric) {
        dom.lyricWhisperText.textContent = activeLyric;
      }
    }
  }

  audio.onTimeUpdate = (curr, dur) => {
    updateProgressUI(curr, dur);
  };

  audio.onPlayStateChange = (playing) => {
    dom.cassetteWrap.classList.toggle('is-playing', playing);
    dom.playPauseIcon.textContent = playing ? '⏸' : '▶';
    dom.playPauseIcon.style.marginLeft = playing ? '0px' : '2px';
    renderTracklist();
  };

  audio.onTrackEnd = () => {
    selectTrack(activeTrackIdx + 1, true);
  };

  dom.playPauseBtn.addEventListener('click', togglePlayPause);
  dom.prevBtn.addEventListener('click', () => {
    audio.playCassetteClick();
    selectTrack(activeTrackIdx - 1, audio.isPlaying);
  });
  dom.nextBtn.addEventListener('click', () => {
    audio.playCassetteClick();
    selectTrack(activeTrackIdx + 1, audio.isPlaying);
  });

  // Barra de avance táctil
  function scrubFromPointer(clientX) {
    const rect = dom.progressTrack.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.seek(ratio * audio.duration);
  }

  let isScrubbing = false;
  dom.progressTrack.addEventListener('pointerdown', (e) => {
    isScrubbing = true;
    scrubFromPointer(e.clientX);
  });
  window.addEventListener('pointermove', (e) => {
    if (isScrubbing) scrubFromPointer(e.clientX);
  });
  window.addEventListener('pointerup', () => {
    isScrubbing = false;
  });

  dom.tapeWarmthBtn.addEventListener('click', () => {
    audio.playCassetteClick();
    const active = audio.toggleTapeWarmth();
    dom.tapeWarmthBtn.classList.toggle('is-active', active);
  });

  dom.volumeSlider.addEventListener('input', (e) => {
    audio.setVolume(parseFloat(e.target.value));
  });

  dom.muteToggleBtn.addEventListener('click', () => {
    const muted = audio.toggleMute();
    dom.muteToggleBtn.textContent = muted ? '🔇 Silencio' : '🔊 Con sonido';
  });

  /* ========================================================================
   * 6. CARTA Y POSDATA SECRETA (P.D.)
   * ======================================================================== */

  dom.psSecretCard.addEventListener('click', () => {
    const open = dom.psSecretCard.classList.toggle('is-open');
    dom.psSecretCard.setAttribute('aria-expanded', String(open));
    audio.playPetalChime(2);
  });
  dom.psSecretCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dom.psSecretCard.click();
    }
  });

  /* ========================================================================
   * 7. SORPRESA 01: NOTA DE VOZ ÍNTIMA DE JOSE (AUDIO REAL)
   * ======================================================================== */

  const WAVE_HEIGHTS = [
    26, 42, 65, 50, 82, 94, 60, 44, 72, 88, 54, 36, 68, 92, 76, 58, 40,
    84, 96, 70, 52, 64, 86, 48, 34, 74, 90, 62, 46, 78, 66, 50, 38, 28
  ];

  function buildWaveformBars() {
    dom.voiceWaveform.innerHTML = '';
    WAVE_HEIGHTS.forEach((h, idx) => {
      const bar = document.createElement('span');
      bar.className = 'wave-bar';
      bar.style.height = `${h}%`;
      bar.dataset.barIndex = idx;
      dom.voiceWaveform.appendChild(bar);
    });
  }
  buildWaveformBars();

  // Cargar el audio real de Jose grabado con su voz
  audio.setCustomVoiceBlobUrl('assets/voice-memo.mp3', 92);

  dom.voicePlayBtn.addEventListener('click', () => {
    audio.toggleVoiceNote();
  });

  dom.voiceWaveform.addEventListener('click', (e) => {
    const rect = dom.voiceWaveform.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.seekVoiceNote(ratio);
  });

  // Tocar cualquier frase para saltar directamente a ella en el audio de Jose
  dom.voicePhrases.forEach((phrase) => {
    phrase.addEventListener('click', () => {
      const start = parseFloat(phrase.dataset.start);
      const dur = audio.voiceDuration || 92;
      audio.seekVoiceNote(start / dur);
      if (!audio.voicePlaying) {
        audio.startVoiceNote();
      }
    });
  });

  let lastActivePhrase = null;
  audio.onVoiceUpdate = (curr, dur, playing) => {
    dom.voiceMemoBox.classList.toggle('is-playing', playing);
    dom.voicePlayIcon.textContent = playing ? '⏸' : '▶';
    dom.voiceTime.textContent = `${formatTime(curr)} / ${formatTime(dur)}`;

    const ratio = dur > 0 ? curr / dur : 0;
    const bars = dom.voiceWaveform.querySelectorAll('.wave-bar');
    const playedCount = Math.floor(ratio * bars.length);
    bars.forEach((bar, i) => {
      bar.classList.toggle('is-played', i <= playedCount && (playing || curr > 0));
    });

    dom.voicePhrases.forEach((phrase) => {
      const start = parseFloat(phrase.dataset.start);
      const end = parseFloat(phrase.dataset.end);
      const active = playing && curr >= start && curr < end;
      phrase.classList.toggle('is-speaking', active);
      if (active && phrase !== lastActivePhrase) {
        lastActivePhrase = phrase;
        phrase.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  };

  /* ========================================================================
   * 8. SORPRESA 02: CONTADORES EN TIEMPO REAL (AMOR Y AMISTAD)
   * ======================================================================== */

  function updateLoveCounter() {
    const now = new Date();

    // 1. Contador principal: Nuestro Amor (desde el 24 de julio de 2026 - 4 meses)
    const diff = Math.max(0, now - RELATIONSHIP_START);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (dom.countDays) dom.countDays.textContent = days;
    if (dom.countHours) dom.countHours.textContent = String(hours).padStart(2, '0');
    if (dom.countMinutes) dom.countMinutes.textContent = String(minutes).padStart(2, '0');
    if (dom.countSeconds) dom.countSeconds.textContent = String(seconds).padStart(2, '0');

    // 2. Pequeño contador: Nuestra Amistad (desde 2022)
    const friendDiff = Math.max(0, now - FRIENDSHIP_START);
    const fDays = Math.floor(friendDiff / (1000 * 60 * 60 * 24));
    const fHours = Math.floor((friendDiff / (1000 * 60 * 60)) % 24);
    const fMinutes = Math.floor((friendDiff / (1000 * 60)) % 60);
    const fSeconds = Math.floor((friendDiff / 1000) % 60);

    if (dom.countFriendDays) dom.countFriendDays.textContent = fDays.toLocaleString('es-MX');
    if (dom.countFriendHours) dom.countFriendHours.textContent = String(fHours).padStart(2, '0');
    if (dom.countFriendMinutes) dom.countFriendMinutes.textContent = String(fMinutes).padStart(2, '0');
    if (dom.countFriendSeconds) dom.countFriendSeconds.textContent = String(fSeconds).padStart(2, '0');
  }
  updateLoveCounter();
  setInterval(updateLoveCounter, 1000);

  /* ========================================================================
   * 9. SORPRESA 03: RAMO DE FLORES VIRTUAL CON POEMAS PERSONALIZADOS
   * ======================================================================== */

  function renderFlowerPills() {
    dom.flowerPillsRow.innerHTML = '';
    FLOWERS.forEach((f, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `flower-pill${idx === 0 ? ' is-selected' : ''}`;
      btn.textContent = f.shortName;
      btn.addEventListener('click', () => selectFlower(idx, true));
      dom.flowerPillsRow.appendChild(btn);
    });
  }
  renderFlowerPills();

  function selectFlower(idx, playSound = true) {
    const flower = FLOWERS[idx];
    if (!flower) return;

    dom.flowerPins.forEach((pin) => {
      pin.classList.toggle('is-selected', Number(pin.dataset.flower) === idx);
    });
    dom.flowerPillsRow.querySelectorAll('.flower-pill').forEach((pill, i) => {
      pill.classList.toggle('is-selected', i === idx);
    });

    dom.flowerMeaningName.textContent = flower.title;
    dom.flowerMeaningText.textContent = flower.meaning;

    if (playSound) {
      audio.playPetalChime(idx);
    }
  }

  dom.flowerPins.forEach((pin) => {
    pin.addEventListener('click', () => {
      selectFlower(Number(pin.dataset.flower), true);
    });
  });

  /* ========================================================================
   * 10. LLUVIA DE PÉTALOS DE ROSA
   * ======================================================================== */

  const canvas = document.getElementById('petals-canvas');
  const ctx = canvas.getContext('2d');
  const petals = [];
  const PETAL_COLORS = [
    'rgba(242, 184, 198, 0.82)',
    'rgba(232, 152, 172, 0.78)',
    'rgba(250, 218, 225, 0.86)',
    'rgba(255, 246, 240, 0.85)',
    'rgba(209, 122, 144, 0.72)'
  ];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function createPetal(randomY = false) {
    return {
      x: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : -24 - Math.random() * 80,
      size: 7 + Math.random() * 9,
      speedY: 0.85 + Math.random() * 1.45,
      speedX: -0.6 + Math.random() * 1.2,
      swayAmp: 0.6 + Math.random() * 1.2,
      swayFreq: 0.012 + Math.random() * 0.02,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.03,
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      ambient: false
    };
  }

  for (let i = 0; i < 6; i++) {
    const p = createPetal(true);
    p.ambient = true;
    p.speedY *= 0.55;
    petals.push(p);
  }

  function spawnPetals(count = 36) {
    for (let i = 0; i < count; i++) {
      petals.push(createPetal(false));
    }
  }

  function animatePetals() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.y * p.swayFreq) * p.swayAmp;
      p.angle += p.spin;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;

      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.9, -p.size * 0.8, p.size * 0.95, p.size * 0.6, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.95, p.size * 0.6, -p.size * 0.9, -p.size * 0.8, 0, -p.size);
      ctx.fill();
      ctx.restore();

      if (p.y > canvas.height + 30) {
        if (p.ambient) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        } else {
          petals.splice(i, 1);
        }
      }
    }

    requestAnimationFrame(animatePetals);
  }
  requestAnimationFrame(animatePetals);

  dom.petalShowerBtn.addEventListener('click', () => {
    audio.playPetalChime(4);
    spawnPetals(42);
  });
  dom.footerPetalBtn.addEventListener('click', () => {
    audio.playPetalChime(1);
    spawnPetals(38);
  });

  /* ========================================================================
   * 11. INICIALIZACIÓN
   * ======================================================================== */

  selectTrack(0, false);

  const params = new URLSearchParams(window.location.search);
  if (params.get('opened') === '1') {
    isEnvelopeOpened = true;
    dom.envelopeScreen.classList.add('is-hidden');
    document.body.classList.remove('envelope-locked');
    dom.giftMain.classList.add('is-revealed');
  }
})();
