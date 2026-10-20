/*
  Every sound is synthesised with Web Audio, so there are no sound files.
  Nothing plays until the first key press or tap (browsers require it), and
  sound and music can each be switched off.

  The music is one pentatonic theme played on a different instrument in
  each part of the museum, the way a real museum's rooms each have their
  own character: a plucked zither in the lobby, temple bells among the
  bronzes, a bamboo flute among the jades, a pipa for the ceramics and a
  music box for the little treasures. Under it runs a quiet room tone, and
  footsteps sound different on marble, wood and carpet.
*/
(function (root) {
  let ac = null, master = null, musicGain = null, ambGain = null, sfxGain = null;
  let sfxOn = true, musicOn = true;
  let tune = null, timer = null, nextAt = 0, step = 0;
  let room = null, roomNodes = null, roomTimer = null;

  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
  // C D E G A, the gong pentatonic scale, over three octaves
  const M = {
    E2: 40, G2: 43, A2: 45, C3: 48, D3: 50, E3: 52, G3: 55, A3: 57,
    C4: 60, D4: 62, E4: 64, G4: 67, A4: 69, C5: 72, D5: 74, E5: 76, G5: 79, A5: 81, C6: 84
  };

  // The theme, in eighth notes; null is a rest, "-" holds the note before.
  const THEME = [
    "E5", "-", "G5", "-", "A5", "-", "G5", "E5", "D5", "-", "-", "-", "C5", "-", "D5", "-",
    "E5", "-", "G5", "-", "A5", "-", "C6", "A5", "G5", "-", "-", "-", null, null, null, null,
    "A5", "-", "G5", "-", "E5", "-", "D5", "E5", "G5", "-", "E5", "-", "D5", "-", "C5", "-",
    "D5", "-", "E5", "-", "G5", "-", "E5", "D5", "C5", "-", "-", "-", null, null, null, null
  ];
  const BASS = ["C3", "G3", "A2", "E3", "C3", "G3", "G2", "D3", "A2", "E3", "C3", "G3", "G2", "D3", "C3", "G3"];

  /*
    Each area: tempo, instrument, octave shift, how loud, and how much of
    the bass to play (bells and flutes sound better sparse).
  */
  const TUNES = {
    lobby: { bpm: 96, voice: "zither", shift: 0, vol: 0.07, bass: 1 },
    bronze: { bpm: 66, voice: "bell", shift: -12, vol: 0.06, bass: 0.5 },
    jade: { bpm: 70, voice: "flute", shift: -12, vol: 0.05, bass: 0.5 },
    ceramics: { bpm: 84, voice: "pipa", shift: -12, vol: 0.07, bass: 1 },
    "precious-crafts": { bpm: 90, voice: "musicbox", shift: 12, vol: 0.045, bass: 0.25 }
  };

  function ensure() {
    if (ac) return true;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    try {
      ac = new Ctx();
      master = ac.createGain();
      master.gain.value = 0.9;
      master.connect(ac.destination);
      sfxGain = ac.createGain();
      sfxGain.gain.value = sfxOn ? 1 : 0;
      sfxGain.connect(master);
      musicGain = ac.createGain();
      musicGain.gain.value = musicOn ? 1 : 0;
      musicGain.connect(master);
      ambGain = ac.createGain();
      ambGain.gain.value = sfxOn ? 1 : 0;
      ambGain.connect(master);
      return true;
    } catch (e) {
      ac = null;
      return false;
    }
  }

  function unlock() {
    if (!ensure()) return;
    if (ac.state === "suspended") ac.resume().catch(() => {});
    if (tune && !timer) startScheduler();
    if (room && !roomNodes) startRoom();
  }

  const running = () => ac && ac.state === "running";

  // ---- building blocks ----

  function env(g, at, attack, vol, decay) {
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  }

  function tone(freq, at, dur, { wave = "square", vol = 0.06, to = null, dest = sfxGain, attack = 0.005 } = {}) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(freq, at);
    if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur);
    env(g, at, attack, vol, dur);
    o.connect(g).connect(dest);
    o.start(at);
    o.stop(at + attack + dur + 0.05);
  }

  let noiseBuf = null;
  function noiseBuffer() {
    if (noiseBuf) return noiseBuf;
    const len = ac.sampleRate * 2;
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      // softened white noise, a little toward pink
      last = 0.97 * last + 0.03 * (Math.random() * 2 - 1);
      d[i] = (Math.random() * 2 - 1) * 0.6 + last * 3;
    }
    return noiseBuf;
  }

  // a burst of filtered noise: footsteps, doors, page turns
  function noise(at, dur, vol, { type = "lowpass", from = 2400, to = 300, q = 0.7, dest = sfxGain } = {}) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuffer();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(from, at);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, to), at + dur);
    env(g, at, 0.004, vol, dur);
    s.connect(f).connect(g).connect(dest);
    s.start(at, Math.random() * 1.5);
    s.stop(at + dur + 0.05);
  }

  // ---- instruments ----

  const VOICES = {
    // a plucked zither: bright attack, quick fall, a touch of string bend
    zither(f, at, len, vol, dest) {
      tone(f, at, Math.min(1.4, len + 0.6), { wave: "triangle", vol, to: f * 0.995, dest });
      tone(f * 2, at, 0.25, { wave: "sine", vol: vol * 0.35, dest });
    },
    // a bronze bell: inharmonic partials and a long ring
    bell(f, at, len, vol, dest) {
      tone(f, at, 2.6, { wave: "sine", vol, dest, attack: 0.002 });
      tone(f * 2.76, at, 1.1, { wave: "sine", vol: vol * 0.35, dest, attack: 0.002 });
      tone(f * 5.4, at, 0.35, { wave: "sine", vol: vol * 0.15, dest, attack: 0.001 });
    },
    // a bamboo flute: soft breath in, gentle vibrato
    flute(f, at, len, vol, dest) {
      const o = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(f, at);
      lfo.frequency.value = 5.2;
      lg.gain.value = f * 0.008;
      lfo.connect(lg).connect(o.frequency);
      const d = Math.max(0.3, len);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(vol, at + 0.08);
      g.gain.setValueAtTime(vol, at + d * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, at + d + 0.25);
      o.connect(g).connect(dest);
      o.start(at); lfo.start(at);
      o.stop(at + d + 0.3); lfo.stop(at + d + 0.3);
      noise(at, 0.12, vol * 0.25, { type: "bandpass", from: f * 2, to: f * 2, q: 3, dest });
    },
    // a pipa: a sharp pick, a short metallic body
    pipa(f, at, len, vol, dest) {
      tone(f, at, 0.7, { wave: "sawtooth", vol: vol * 0.45, to: f * 0.99, dest, attack: 0.002 });
      tone(f, at, 0.9, { wave: "triangle", vol: vol * 0.7, dest, attack: 0.002 });
    },
    // a music box: a tiny high tine
    musicbox(f, at, len, vol, dest) {
      tone(f, at, 0.9, { wave: "sine", vol, dest, attack: 0.001 });
      tone(f * 3, at, 0.18, { wave: "sine", vol: vol * 0.3, dest, attack: 0.001 });
    }
  };

  // ---- sound effects ----

  const SFX = {
    blip: t => tone(1046, t, 0.03, { vol: 0.025 }),
    select: t => { tone(784, t, 0.05, { vol: 0.05 }); tone(1046, t + 0.05, 0.07, { vol: 0.05 }); },
    back: t => { tone(659, t, 0.05, { vol: 0.045 }); tone(494, t + 0.05, 0.07, { vol: 0.045 }); },
    move: t => tone(1318, t, 0.025, { wave: "triangle", vol: 0.03 }),
    bump: t => tone(110, t, 0.09, { wave: "triangle", vol: 0.12, to: 70 }),
    door: t => { noise(t, 0.3, 0.1, { from: 1800, to: 200 }); tone(196, t + 0.02, 0.25, { wave: "sine", vol: 0.04 }); },
    stairs: t => [0, 1, 2, 3].forEach(i => tone(NOTE([60, 64, 67, 72][i]), t + i * 0.06, 0.08, { wave: "triangle", vol: 0.07 })),
    ding: t => { tone(NOTE(84), t, 0.5, { wave: "sine", vol: 0.08 }); tone(NOTE(79), t + 0.18, 0.6, { wave: "sine", vol: 0.07 }); },
    seen: t => [72, 74, 76, 79, 81].forEach((n, i) => tone(NOTE(n), t + i * 0.07, i === 4 ? 0.35 : 0.1, { wave: "triangle", vol: 0.06 })),
    alert: t => { tone(NOTE(84), t, 0.06, { vol: 0.05 }); tone(NOTE(91), t + 0.07, 0.1, { vol: 0.05 }); },
    // a page turning, for panels
    open: t => noise(t, 0.18, 0.06, { type: "highpass", from: 1200, to: 4000 }),
    close: t => noise(t, 0.14, 0.05, { type: "highpass", from: 4000, to: 1200 }),
    // a seal pressed onto paper
    stamp: t => { noise(t, 0.12, 0.2, { from: 600, to: 80 }); tone(90, t, 0.18, { wave: "sine", vol: 0.12, to: 55 }); },
    // an area's title card
    area: t => VOICES.bell(NOTE(76), t, 1, 0.05, sfxGain),
    // a step: marble clicks, wood thuds, carpet hushes
    "step-marble": t => noise(t, 0.035, 0.05, { type: "bandpass", from: 2600 + Math.random() * 600, to: 1800, q: 1.4 }),
    "step-wood": t => { noise(t, 0.05, 0.06, { from: 900, to: 200 }); tone(140 + Math.random() * 20, t, 0.05, { wave: "sine", vol: 0.04 }); },
    "step-carpet": t => noise(t, 0.06, 0.03, { from: 500, to: 150 })
  };

  function play(name) {
    if (!sfxOn || !running() || !SFX[name]) return;
    SFX[name](ac.currentTime + 0.01);
  }

  /*
    A voice blip for one character of dialogue: each speaker has their own
    pitch, wobbling a little so it sounds like speech, not a beep.
  */
  const VOICE_PITCH = { docent: 880, visitor: 620, staff: 520, sign: 0 };
  function voice(kind) {
    if (!sfxOn || !running()) return;
    const base = VOICE_PITCH[kind] || 0;
    if (!base) return;
    const f = base * (0.92 + Math.random() * 0.16);
    tone(f, ac.currentTime + 0.005, 0.045, { wave: "triangle", vol: 0.03 });
  }

  // ---- music ----

  function startScheduler() {
    if (!ac || timer) return;
    nextAt = ac.currentTime + 0.1;
    step = 0;
    timer = setInterval(schedule, 50);
  }

  function schedule() {
    if (!tune || !ac) return;
    const t = TUNES[tune];
    const eighth = 60 / t.bpm / 2;
    // after the tab was hidden, pick up from now rather than catching up
    if (nextAt < ac.currentTime) nextAt = ac.currentTime + 0.05;
    // with music off, keep time without making any sound
    if (!musicOn) {
      while (nextAt < ac.currentTime + 0.3) { nextAt += eighth; step++; }
      return;
    }
    while (nextAt < ac.currentTime + 0.3) {
      const i = step % THEME.length;
      const n = THEME[i];
      if (n && n !== "-") {
        let len = 1;
        while (THEME[(i + len) % THEME.length] === "-") len++;
        VOICES[t.voice](NOTE(M[n] + t.shift), nextAt, eighth * len, t.vol, musicGain);
      }
      if (i % 4 === 0 && (step / 4) % Math.round(1 / t.bass) === 0) {
        const b = BASS[(i / 4) % BASS.length];
        tone(NOTE(M[b]), nextAt, eighth * 3.6, { wave: "triangle", vol: t.vol * 0.8, dest: musicGain, attack: 0.02 });
      }
      nextAt += eighth;
      step++;
    }
  }

  function setTune(name) {
    if (name && !TUNES[name]) name = "lobby";
    if (name === tune) return;
    tune = name;
    step = 0;
    if (ac) nextAt = ac.currentTime + 0.4;
    if (!name && timer) { clearInterval(timer); timer = null; }
    else if (name && running()) startScheduler();
  }

  // ---- room tone ----

  /*
    A soft hum of air and distant visitors: brighter and busier in the
    lobbies, low and hushed in the galleries, with the odd far-off step.
  */
  function setRoom(kind) {
    if (kind === room) return;
    room = kind;
    stopRoom();
    if (room && running()) startRoom();
  }

  function startRoom() {
    if (!ac || !room || !sfxOn) return;
    const lobby = room === "lobby";
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuffer();
    s.loop = true;
    f.type = "lowpass";
    f.frequency.value = lobby ? 900 : 380;
    g.gain.setValueAtTime(0, ac.currentTime);
    g.gain.linearRampToValueAtTime(lobby ? 0.022 : 0.016, ac.currentTime + 1.2);
    s.connect(f).connect(g).connect(ambGain);
    s.start();
    roomNodes = { s, g };
    const tick = () => {
      if (!running() || !roomNodes) return;
      const t = ac.currentTime + 0.05;
      if (Math.random() < (lobby ? 0.7 : 0.35)) {
        // a few distant steps
        const n = 2 + Math.floor(Math.random() * 4), gap = 0.42 + Math.random() * 0.1;
        for (let i = 0; i < n; i++) noise(t + i * gap, 0.03, lobby ? 0.012 : 0.008, { type: "bandpass", from: lobby ? 2200 : 900, to: 700, q: 1.2, dest: ambGain });
      }
      if (lobby && Math.random() < 0.4) {
        // a murmur of voices across the hall
        noise(t, 1.4, 0.01, { type: "bandpass", from: 500, to: 700, q: 2.5, dest: ambGain });
      }
    };
    roomTimer = setInterval(tick, 2600);
  }

  function stopRoom() {
    clearInterval(roomTimer);
    roomTimer = null;
    if (roomNodes && ac) {
      const { s, g } = roomNodes;
      g.gain.setTargetAtTime(0, ac.currentTime, 0.3);
      setTimeout(() => { try { s.stop(); } catch (e) {} }, 1500);
    }
    roomNodes = null;
  }

  function setSfx(on) {
    sfxOn = !!on;
    if (sfxGain) sfxGain.gain.setTargetAtTime(sfxOn ? 1 : 0, ac.currentTime, 0.05);
    if (ambGain) ambGain.gain.setTargetAtTime(sfxOn ? 1 : 0, ac.currentTime, 0.2);
    // the room tone only runs while sound is on
    if (!sfxOn) stopRoom();
    else if (room && !roomNodes && running()) startRoom();
  }
  function setMusic(on) {
    musicOn = !!on;
    if (musicGain) musicGain.gain.setTargetAtTime(musicOn ? 1 : 0, ac.currentTime, 0.05);
  }

  root.Sound = { unlock, play, voice, setTune, setRoom, setSfx, setMusic };
})(typeof globalThis !== "undefined" ? globalThis : this);
