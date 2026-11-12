// Home — horizontal scrapbook.
// Vertical scroll drives the horizontal track (GSAP ScrollTrigger, pinned).
// Without GSAP or with reduced motion: native horizontal scroll, wheel mapped to x.
import "./i18n.js"; // first: translates the page before anything else runs
import { addMarkers } from "./marker.js";
import "./glass.js";
import { play, playBead, playScroll, playMelody, initSoundToggle } from "./sound.js";
import { introDone } from "./intro.js";
import "./buddy.js"; // Pix, the little pixel buddy (catch-me game)
import "./radish.js"; // Radi, the sleepy pixel radish

const book = document.querySelector(".scrollbook");
const track = document.querySelector(".track");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const unit = () => window.innerHeight / 1080; // 1 artboard px

/* ---------- to-do list: checkable, remembered for this visitor ---------- */
function initTodo() {
  const KEY = "home-todo-v1";
  const boxes = [...document.querySelectorAll(".todo-input")];
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (Array.isArray(saved)) boxes.forEach((b, i) => { if (typeof saved[i] === "boolean") b.checked = saved[i]; });
  } catch { /* storage unavailable: keep defaults */ }
  boxes.forEach((b) => b.addEventListener("change", () => {
    play("pen");
    try { localStorage.setItem(KEY, JSON.stringify(boxes.map((x) => x.checked))); } catch { /* ignore */ }
  }));
}

/* ---------- highlighter on links / CTAs ---------- */
function markLinks() {
  const set = (sel, kind) => document.querySelectorAll(sel).forEach((el) => { el.dataset.marker = kind; });
  set(".text-click-here, .text-contact-me, .ui-site-name", "fluo");
  set(".text-work", "circle");
  set(".contact-email a, .contact-linkedin a", "fluo"); // same highlighter as "Contact me"
  addMarkers();
}

/* ---------- in-page links ----------
   #profile → the blue portrait badge (dock "profile")
   #about   → the bio block (skip link)
   scrollTo(el, margin) is provided by the current layout mode. */
function bindAboutLinks(scrollTo) {
  const about = document.getElementById("about");
  const targets = {
    "#profile": { el: document.querySelector(".g-badge") || document.querySelector(".badge-portrait-imane"), margin: 0.08 },
    "#about": { el: about, margin: 0.1 },
  };
  Object.entries(targets).forEach(([hash, { el, margin }]) => {
    if (!el) return;
    document.querySelectorAll(`a[href="${hash}"]`).forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        scrollTo(el, margin);
        about.setAttribute("tabindex", "-1");
        about.focus({ preventScroll: true }); // screen readers land on the bio
      });
    });
  });
}
// x of an element on the track, independent of the current scroll transform
const trackX = (el) => track.offsetLeft + el.getBoundingClientRect().left - track.getBoundingClientRect().left;

function nativeScroll() {
  book.classList.add("is-native");
  book.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      book.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });
  bindAboutLinks((el, m) => book.scrollTo({ left: Math.max(0, trackX(el) - innerWidth * m), behavior: reduceMotion ? "auto" : "smooth" }));
}

/* ---------- motion (GSAP) ---------- */
function gsapScroll() {
  gsap.registerPlugin(ScrollTrigger);
  // layout width of the track (not scrollWidth: it would count pieces bleeding off the edge)
  // layout size only (offset + exact width), unaffected by the current transform
  const distance = () => Math.max(0, track.offsetLeft + parseFloat(getComputedStyle(track).width) - window.innerWidth);

  const scroller = gsap.to(track, {
    x: () => -distance(),
    ease: "none",
    scrollTrigger: {
      trigger: book,
      pin: true,
      scrub: 0.8,
      end: () => "+=" + distance(),
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });
  const inTrack = (trigger, extra = {}) => ({ trigger, containerAnimation: scroller, ...extra });

  // Cut-out letters drop in, one by one — right after the welcome intro.
  const letters = gsap.from(".g-title img:not(.torn-paper-grid-beige)", {
    y: () => -40 * unit(), autoAlpha: 0, duration: 0.7, ease: "back.out(2)", stagger: 0.04, paused: true,
  });
  introDone.then(() => letters.play());

  // Parallax: small objects drift at their own speed while the page slides.
  const drift = [
    [".sticker-sun", 60], [".sticker-sunflower", -40], [".button-strawberry-gingham", 50],
    [".sticker-sparkles", -60], [".button-flower-frosted", 70],
    [".pin-heart-charm", -35], [".coffee-stain", 40], [".tape-kraft", -30],
    [".button-gingham-blue", 45], [".sticker-plant-flowers", -45],
  ];
  drift.forEach(([sel, px]) => {
    const el = document.querySelector(sel);
    if (!el) return;
    gsap.fromTo(el, { x: () => px * unit() }, {
      x: () => -px * unit(), ease: "none",
      scrollTrigger: inTrack(el, { start: "left right", end: "right left", scrub: true }),
    });
  });

  // Papers settle into place as they enter (extra tilt + lift → rest).
  gsap.utils.toArray(".paper-kraft-intro, .paper-lined-skills, .g-work, .torn-paper-gingham-red, .torn-paper-tartan-red, .g-contact")
    .forEach((el, i) => {
      gsap.from(el, {
        rotation: i % 2 ? 6 : -6, y: () => 40 * unit(), ease: "power2.out",
        scrollTrigger: inTrack(el, { start: "left 100%", end: "left 60%", scrub: 1 }),
      });
    });

  // Keyboard slides in, badge swings on its chain.
  gsap.from(".keyboard-pastel", {
    x: () => 160 * unit(), rotation: 4, ease: "power2.out",
    scrollTrigger: inTrack(".keyboard-pastel", { start: "left 100%", end: "left 45%", scrub: 1 }),
  });
  gsap.set(".badge-portrait-imane", { transformOrigin: "50% 0%" });
  // swings only towards the left so it never covers the to-do list on its right
  gsap.fromTo(".badge-portrait-imane", { rotation: 12 }, {
    rotation: 0, ease: "sine.inOut",
    scrollTrigger: inTrack(".badge-portrait-imane", { start: "left right", end: "center center", scrub: 1.2 }),
  });

  // Beads pop, to-do items get written in, when they enter the screen.
  gsap.from(".g-name img:not(.stamp-internship)", {
    scale: 0.4, autoAlpha: 0, duration: 0.5, ease: "back.out(2.5)", stagger: 0.05,
    scrollTrigger: inTrack(".g-name", { start: "left 85%" }),
  });
  gsap.from(".list-to-do li", {
    x: () => -20 * unit(), autoAlpha: 0, duration: 0.45, ease: "power2.out", stagger: 0.12,
    scrollTrigger: inTrack(".g-todo", { start: "left 80%" }),
  });

  initHover();
  bindAboutLinks((el, m) => {
    const st = scroller.scrollTrigger;
    const x = Math.max(0, trackX(el) - innerWidth * m);
    window.scrollTo({ top: st.start + Math.min(x, distance()), behavior: "smooth" });
  });
  // arriving from another page on index.html#profile (or #about)
  if (location.hash === "#profile" || location.hash === "#about") {
    requestAnimationFrame(() => document.querySelector(`a[href="${location.hash}"]`)?.click());
  }
}

/* ---------- objects react when the mouse passes over them ---------- */
// desktop: objects react when the mouse passes over them; touch screens: when you tap them
// (a bonus, never needed to go on: scrolling stays free)
function initHover() {
  if (!window.gsap) return;
  const evt = window.matchMedia("(hover: hover)").matches ? "mouseenter" : "click";
  const on = (sel, fn) => document.querySelectorAll(sel).forEach((el) => {
    el.addEventListener(evt, () => { if (!gsap.isTweening(el) || el.dataset.hoverBusy !== "1") fn(el); });
  });
  // soft but lively movements: paper objects, not cartoons
  const wiggle = (el) => {
    el.dataset.hoverBusy = "1";
    gsap.timeline({ onComplete: () => { el.dataset.hoverBusy = "0"; } })
      .to(el, { rotation: "+=7", duration: 0.18, ease: "sine.out" })
      .to(el, { rotation: "-=12", duration: 0.26, ease: "sine.inOut" })
      .to(el, { rotation: "+=7", duration: 0.26, ease: "sine.inOut" })
      .to(el, { rotation: "-=2", duration: 0.32, ease: "sine.out" });
  };
  const bounce = (el) => gsap.fromTo(el, { scale: 1 }, { scale: 1.12, y: () => -9 * unit(), duration: 0.26, yoyo: true, repeat: 1, ease: "sine.inOut" });
  const press = (el) => gsap.fromTo(el, { scale: 1 }, { scale: 0.93, duration: 0.16, yoyo: true, repeat: 1, ease: "sine.inOut" });
  const spin = (el) => gsap.to(el, { rotation: "+=72", duration: 0.85, ease: "power2.inOut", overwrite: "auto" });
  const swing = (el) => { gsap.set(el, { transformOrigin: "50% 0%" }); wiggle(el); };
  // the polaroid swings from its clip: pivot = clip centre, photo and clip move together
  const hang = (el) => { gsap.set(el, { transformOrigin: "50% 8%" }); wiggle(el); };

  const withSound = (fn, sound) => (el) => { fn(el); play(sound); };
  on(".g-title img:not(.torn-paper-grid-beige)", withSound(bounce, "paper"));
  // bead-01 (S) … bead-11 (E): each letter keeps its own note
  on('.g-name img[class*="bead-"]', (el) => { bounce(el); playBead(parseInt(el.className.match(/bead-(\d+)/)[1], 10) - 1); });
  on(".sticker-sun, .sticker-sunflower, .sticker-sparkles, .sticker-plant-flowers", withSound(wiggle, "paper"));
  on(".paperclip-silver, .paperclip-diagonal", withSound(wiggle, "jingle"));
  on(".button-strawberry-gingham, .button-gingham-blue, .button-flower-frosted", withSound(spin, "pop"));
  on(".sticker-ctrl-z", withSound(press, "rewind"));
  // the "stage février–avril 2027" stamp stays still: no hover animation
  on(".pin-heart-charm", withSound(swing, "jingle"));
  document.querySelector(".badge-portrait-imane")?.addEventListener(evt, () => play("jingle"));
  on(".g-polaroid", withSound(hang, "paper"));
}

/* ---------- the green keyboard types when clicked ---------- */
function initKeyboard() {
  const kb = document.querySelector(".keyboard-pastel");
  if (!kb) return;
  kb.classList.add("is-playable");
  kb.removeAttribute("aria-hidden");
  kb.setAttribute("role", "button");
  kb.setAttribute("tabindex", "0");
  kb.setAttribute("aria-label", "Mechanical keyboard — click to type");
  const type = () => {
    play("typing");
    if (window.gsap && !reduceMotion) {
      // the keyboard "bounces" with each key press
      gsap.timeline().to(kb, { scale: 0.985, duration: 0.05, repeat: 7, yoyo: true, ease: "power1.inOut" });
    }
  };
  kb.addEventListener("click", type);
  kb.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); type(); } });
  kb.addEventListener("mouseenter", () => play("key"));
}

/* ---------- mobile / portrait: vertical scrapbook ---------- */
const MOBILE = "(max-width: 52rem), (orientation: portrait)";
function mobileScroll() {
  bindAboutLinks((el) => el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }));
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const letters = gsap.from(".g-title img:not(.torn-paper-grid-beige)", { y: -30, autoAlpha: 0, duration: 0.6, ease: "back.out(2)", stagger: 0.035, paused: true });
  introDone.then(() => letters.play());
  // each block is "stuck" onto the page as it scrolls into view
  // blocks already on the first screen are shown as they are (no hide-then-reveal: faster first paint,
  // and they sit under the intro anyway); the others are stuck on as they scroll into view
  const blocks = [...track.children].filter((el) => el !== document.querySelector(".g-title")
    && getComputedStyle(el).display !== "none" && el.getBoundingClientRect().top > innerHeight * 0.9);
  blocks.forEach((el, i) => {
    gsap.from(el, {
      y: 50, rotation: i % 2 ? 4 : -4, autoAlpha: 0, duration: 0.7, ease: "back.out(1.4)",
      scrollTrigger: { trigger: el, start: "top 88%", once: true, onEnter: () => playScroll("paper") },
    });
  });
  // the bead band plays its little melody once when it comes into view
  ScrollTrigger.create({ trigger: ".g-name", start: "top 70%", once: true, onEnter: playMelody });
  gsap.from(".g-name img:not(.stamp-internship)", { scale: 0.4, autoAlpha: 0, duration: 0.45, ease: "back.out(2.5)", stagger: 0.05, scrollTrigger: { trigger: ".g-name", start: "top 80%", once: true } });
}

initTodo();
markLinks();
initKeyboard();
initSoundToggle();
const mobileLayout = window.matchMedia(MOBILE);
if (mobileLayout.matches) {
  mobileScroll();
  initHover();
} else if (window.gsap && window.ScrollTrigger && !reduceMotion) {
  gsapScroll();
} else {
  nativeScroll();
}
// switching between portrait and landscape changes the whole layout: rebuild it
mobileLayout.addEventListener("change", () => location.reload());
