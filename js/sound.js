import { t } from "./i18n.js";
// Tiny synthesized sound kit (Web Audio API) — no audio files to load.
// Every sound is built from noise / oscillators with a little randomness, so two
// clicks never sound exactly the same (like a real keyboard).
// Browsers only allow audio after a user gesture: the context unlocks on the first
// click / key press. The on/off choice is remembered (localStorage).
// Exceptions using real recordings (assets/sounds/): the green keyboard
// (key-1…8, from clavier_mecanique.mp3) and the Works folders (folder-1…4, from folder.mp3).

const KEY = "sound-on";
let ctx, master, noiseBuf;
let enabled = true;
try { enabled = localStorage.getItem(KEY) !== "0"; } catch { /* keep default */ }
let last = 0;
const TOUCH = window.matchMedia("(hover: none)").matches;
// real recordings (cut from your files): mechanical keys + cardboard folder
const BANKS = {
  key: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `assets/sounds/key-${n}.m4a`),
  folder: [1, 2, 3, 4].map((n) => `assets/sounds/folder-${n}.m4a`),
};
const takes = {};
let keyTakes = [];
let banksLoading;
function loadKeys() {
  banksLoading ??= Promise.all(Object.entries(BANKS).map(async ([name, files]) => {
    const b = await Promise.all(files.map(async (f) => {
      try { return await ctx.decodeAudioData(await (await fetch(f)).arrayBuffer()); } catch { return null; }
    }));
    takes[name] = b.filter(Boolean);
  })).then(() => { keyTakes = takes.key || []; });
}
// play one random take of a recorded sound
function realSample(name, t, volume = 2, rate = [0.95, 1.06]) {
  const list = takes[name];
  if (!list?.length) return false;
  const src = ctx.createBufferSource();
  src.buffer = list[Math.floor(Math.random() * list.length)];
  src.playbackRate.value = rand(rate[0], rate[1]);
  const g = ctx.createGain(); g.gain.value = volume * rand(0.85, 1); // master is 0.32
  src.connect(g).connect(master);
  src.start(t);
  return true;
}
// one real key press; pitch / volume vary a little so it never repeats exactly
function realKey(t, deep = false) {
  const src = ctx.createBufferSource();
  src.buffer = keyTakes[Math.floor(Math.random() * keyTakes.length)];
  src.playbackRate.value = deep ? rand(0.78, 0.84) : rand(0.95, 1.06);
  const g = ctx.createGain(); g.gain.value = (deep ? 1.1 : 1) * rand(1.9, 2.3); // master is 0.32
  src.connect(g).connect(master);
  src.start(t);
}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = TOUCH ? 0.22 : 0.32; // phones: a bit quieter
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume();
  loadKeys();
  return ctx;
}
// Unlock on the first real gesture. On phones the first touch is usually a scroll, which browsers
// don't count as a gesture → keep listening (tap / key) until the audio actually runs.
const GESTURES = ["pointerup", "touchend", "click", "keydown"];
function unlock() {
  if (!enabled) return;
  const c = audio();
  if (c && c.state === "running") GESTURES.forEach((t) => window.removeEventListener(t, unlock, true));
  else c?.resume?.().then(() => { if (c.state === "running") GESTURES.forEach((t) => window.removeEventListener(t, unlock, true)); });
}
GESTURES.forEach((t) => window.addEventListener(t, unlock, { capture: true, passive: true }));

const rand = (a, b) => a + Math.random() * (b - a);

// --- building blocks ---------------------------------------------------------
function noise(t, { dur = 0.05, gain = 0.6, type = "bandpass", freq = 3000, q = 1, to } = {}) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  src.playbackRate.value = rand(0.9, 1.1);
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t, rand(0, 0.5)); src.stop(t + dur + 0.02);
}
function tone(t, { freq = 440, to, dur = 0.1, gain = 0.4, type = "sine", attack = 0.002 } = {}) {
  const o = ctx.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

// --- sounds ------------------------------------------------------------------
const SOUNDS = {
  // cardboard folder landing on the stack (Works page, recorded)
  folder(t) { if (!realSample("folder", t, 1.8, [0.96, 1.04])) SOUNDS.paper(t); },
  // mechanical switch: sharp click + plastic body + thocky bottom-out
  key(t, deep = false) {
    if (keyTakes.length) return realKey(t, deep);
    noise(t, { dur: 0.018, gain: 0.9, type: "highpass", freq: rand(4200, 5600) });            // click leaf
    noise(t + 0.004, { dur: 0.05, gain: 0.55, freq: rand(1500, 2300), q: 1.4 });              // keycap clack
    tone(t + 0.006, { freq: deep ? rand(95, 115) : rand(150, 210), to: deep ? 60 : 90, dur: deep ? 0.09 : 0.045, gain: deep ? 0.55 : 0.35 }); // thock
  },
  // a short typing burst, ending on the space bar
  typing(t) {
    const n = 5 + Math.floor(Math.random() * 4);
    let at = t;
    for (let i = 0; i < n; i++) { SOUNDS.key(at); at += rand(0.055, 0.12); }
    SOUNDS.key(at + 0.05, true);
  },
  // glass / plastic bead clink
  clink(t) {
    const f = rand(2200, 3200);
    tone(t, { freq: f, dur: 0.22, gain: 0.22, type: "triangle" });
    tone(t, { freq: f * 2.76, dur: 0.12, gain: 0.08 });
    noise(t, { dur: 0.01, gain: 0.3, type: "highpass", freq: 6000 });
  },
  // cartoon "bloop" (buttons)
  pop(t) {
    tone(t, { freq: rand(520, 640), to: rand(180, 230), dur: 0.16, gain: 0.45, type: "sine" });
    noise(t, { dur: 0.012, gain: 0.25, freq: 1200 });
  },
  // paper flutter (stickers, papers, folders)
  paper(t) {
    noise(t, { dur: 0.16, gain: 0.32, type: "highpass", freq: rand(1800, 2600), to: 7000, q: 0.6 });
    noise(t + 0.05, { dur: 0.1, gain: 0.18, freq: rand(3000, 4000), q: 0.8 });
  },
  // tape-rewind "zip" (Ctrl+Z)
  rewind(t) {
    tone(t, { freq: 900, to: 140, dur: 0.28, gain: 0.18, type: "sawtooth", attack: 0.01 });
    noise(t, { dur: 0.28, gain: 0.15, freq: 2500, to: 400, q: 2 });
  },
  // rubber stamp thud
  stamp(t) {
    tone(t, { freq: 110, to: 45, dur: 0.18, gain: 0.7 });
    noise(t, { dur: 0.06, gain: 0.45, type: "lowpass", freq: 900 });
  },
  // little metal jingle (safety pin charm, clips, badge chain)
  jingle(t) {
    for (let i = 0; i < 4; i++) {
      const at = t + i * rand(0.03, 0.06);
      tone(at, { freq: rand(3200, 5200), dur: rand(0.12, 0.25), gain: 0.09, type: "triangle" });
      tone(at, { freq: rand(6500, 8000), dur: 0.06, gain: 0.04 });
    }
  },
  // felt pen tick (to-do list)
  pen(t) {
    noise(t, { dur: 0.07, gain: 0.35, type: "bandpass", freq: 2600, to: 5200, q: 3 });
    noise(t + 0.075, { dur: 0.09, gain: 0.3, type: "bandpass", freq: 5200, to: 3000, q: 3 });
  },
};

export function play(name) {
  if (!enabled || !SOUNDS[name]) return;
  const c = audio();
  if (!c || c.state !== "running") return;
  const now = c.currentTime;
  if (name !== "typing" && now - last < 0.04) return; // avoid machine-gun hover spam
  last = now;
  SOUNDS[name](now + 0.005);
}

// Beads of the name: each letter has its own note of a pentatonic scale, S (low) → E (high),
// so sweeping along "Shaiba Imane" plays a little music-box melody, the same every time.
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093]; // C5 → C7
export function playBead(index) {
  if (!enabled) return;
  const c = audio();
  if (!c || c.state !== "running") return;
  const t = c.currentTime + 0.005, f = SCALE[Math.max(0, Math.min(index, SCALE.length - 1))];
  tone(t, { freq: f, dur: 0.6, gain: 0.16, type: "sine", attack: 0.006 });        // soft bell
  tone(t, { freq: f * 2, dur: 0.35, gain: 0.05, type: "triangle", attack: 0.006 }); // shimmer
}

// sounds that come with scrolling (blocks landing, folders piling): never two closer than 0.6 s,
// so a fast scroll stays gentle
let lastScroll = 0;
export function playScroll(name) {
  const now = performance.now();
  if (now - lastScroll < 600) return;
  lastScroll = now;
  play(name);
}
// "Shaiba Imane" as a little music-box run: the 11 bead notes, S → E
export function playMelody() {
  for (let i = 0; i < 11; i++) setTimeout(() => playBead(i), i * 95);
}

export function isSoundOn() { return enabled; }
export function setSound(on) {
  enabled = on;
  try { localStorage.setItem(KEY, on ? "1" : "0"); } catch { /* ignore */ }
  if (on) { audio(); play("key"); }
}

// Header toggle: <button data-sound-toggle>
export function initSoundToggle() {
  document.querySelectorAll("[data-sound-toggle]").forEach((btn) => {
    const render = () => {
      btn.setAttribute("aria-pressed", String(enabled));
      btn.querySelector("[data-sound-label]").textContent = t(enabled ? "sound.on" : "sound.off");
    };
    btn.addEventListener("click", () => { setSound(!enabled); render(); });
    render();
  });
}
