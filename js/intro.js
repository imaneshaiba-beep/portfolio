// Home intro, on every load of the home page (not when arriving on an anchor link,
// not with prefers-reduced-motion).
// 1. While the page loads, "Shaiba Imane" is typed in the middle of the screen, letter by
//    letter like on a typewriter, at the same size as the site name in the header.
// 2. When the page is ready, the name slides to its place in the top-left corner (GSAP Flip):
//    it is the header's own link (.ui-site-name), so it lands exactly where it stays.
//    The rest of the page appears around it with a small stagger.
// While the intro is on screen, scrapbook stickers burst out under the mouse.
import { play } from "./sound.js";

const root = document.documentElement;
const intro = document.querySelector("[data-intro]");
const name = document.querySelector(".ui-site-name");
const HOLD = 1; // seconds the typed name stays in the middle before going to its place
const IMG = "assets/img/home/";
const BITS = [
  ["button-strawberry-gingham", 54], ["button-gingham-blue", 46], ["button-flower-frosted", 50],
  ["sticker-sparkles", 54], ["sticker-sun", 46], ["sticker-plant-flowers", 50], ["sticker-sunflower", 26],
  ["bead-01", 34], ["bead-02", 34], ["bead-03", 34], ["bead-05", 34], ["bead-08", 34], ["bead-11", 34],
  ["letter-01", 34], ["letter-07", 34], ["letter-15", 36], ["pushpin-wood", 22], ["paperclip-silver", 30],
];

const pageLoaded = new Promise((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", r, { once: true })));
const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));

export const introDone = new Promise((resolve) => {
  if (!intro || !name || !root.classList.contains("has-intro") || !window.gsap || !window.Flip) {
    intro?.remove();
    root.classList.remove("has-intro");
    resolve();
    return;
  }
  gsap.registerPlugin(Flip);

  // every character in its own span, all hidden: the line keeps its full width while typing,
  // so the centred name never shifts
  const text = name.textContent;
  name.textContent = "";
  const chars = [...text].map((c) => {
    const s = document.createElement("span");
    s.className = "type-char";
    s.textContent = c;
    name.append(s);
    return s;
  });
  const caret = document.createElement("span");
  caret.className = "type-caret";
  caret.setAttribute("aria-hidden", "true");
  name.prepend(caret);
  name.classList.add("is-intro");

  const ui = [".ui-links .tape-link", ".ui-sound", ".dock", ".ui-legal-corner"]
    .flatMap((sel) => [...document.querySelectorAll(sel)]);
  gsap.set(ui, { autoAlpha: 0, y: 14 });

  /* ---------- stickers following the mouse ---------- */
  // no limit: as long as the mouse moves, stickers keep coming (each one falls away by itself)
  const spawn = (x, y, spread = 70) => {
    const [file, size] = BITS[Math.floor(Math.random() * BITS.length)];
    const img = document.createElement("img");
    img.src = `${IMG}${file}.webp`; img.alt = ""; img.className = "intro__bit";
    img.style.width = `${size * gsap.utils.random(0.85, 1.3)}px`;
    intro.append(img);
    const angle = Math.random() * Math.PI * 2, dist = gsap.utils.random(spread * 0.35, spread);
    gsap.timeline({ onComplete: () => img.remove() })
      .fromTo(img, { x, y, xPercent: -50, yPercent: -50, scale: 0, rotation: gsap.utils.random(-60, 60) },
        { x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist, scale: 1, rotation: "+=" + gsap.utils.random(-30, 30), duration: 0.45, ease: "back.out(2)" })
      .to(img, { y: "+=" + gsap.utils.random(60, 140), rotation: "+=" + gsap.utils.random(-90, 90), autoAlpha: 0, duration: 0.9, ease: "power2.in" }, "+=0.5");
  };
  let lastX = -999, lastY = -999;
  const onMove = (e) => {
    if (Math.hypot(e.clientX - lastX, e.clientY - lastY) < 55) return;
    lastX = e.clientX; lastY = e.clientY;
    spawn(e.clientX, e.clientY);
    if (Math.random() < 0.35) spawn(e.clientX, e.clientY);
  };
  window.addEventListener("pointermove", onMove);

  (async () => {
    await document.fonts?.ready;
    await wait(0.35);

    /* ---------- 1. typing ---------- */
    for (const c of chars) {
      c.classList.add("is-typed");
      c.after(caret);
      if (c.textContent.trim()) play("key");
      // a typewriter is never perfectly regular; a little pause after the space
      await wait(c.textContent.trim() ? gsap.utils.random(0.17, 0.26) : 0.35); // typed key by key, still readable as typing
    }
    // wait for the page, but never more than 2.5 s after the typing (slow connections: the home
    // appears anyway, images keep loading behind)
    await Promise.all([Promise.race([pageLoaded, wait(2.5)]), wait(HOLD)]);
    caret.remove();
    window.removeEventListener("pointermove", onMove);

    /* ---------- 2. the name slides to its place ---------- */
    const state = Flip.getState(name);
    name.classList.remove("is-intro");
    const tl = gsap.timeline({
      onComplete: () => {
        intro.remove();
        root.classList.remove("has-intro");
        gsap.set(ui, { clearProps: "opacity,visibility,transform" });
      },
    });
    // slow, soft glide: the name takes its time to settle in the corner, on the plain loading
    // page; the home page only appears once the name has landed
    const GLIDE = 1.3;
    tl.add(Flip.from(state, { duration: GLIDE, ease: "power3.inOut", scale: true }), 0)
      .to(intro, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" }, GLIDE - 0.15)
      .to(ui, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.06 }, GLIDE)
      .add(resolve, GLIDE); // the cut-out letters of the home page start dropping in
  })();
});
